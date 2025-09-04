#!/usr/bin/env node
/**
 * Normalize search_destination field in lead_collections table
 * Fix inconsistencies like "Austin Tx, TX" -> "Austin, TX"
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

// State abbreviations mapping
const STATE_ABBR = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
  'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
  'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
  'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
  'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
  'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI', 'WYOMING': 'WY',
  // Common variations
  'TX': 'TX', 'FL': 'FL', 'CA': 'CA', 'NY': 'NY', 'VA': 'VA',
  'Tx': 'TX', 'tx': 'TX', 'Fl': 'FL', 'fl': 'FL', 'Ca': 'CA', 'ca': 'CA',
  'Or': 'OR', 'or': 'OR', 'Oh': 'OH', 'oh': 'OH',
  'Ma': 'MA', 'ma': 'MA', 'MA': 'MA',
  'Nc': 'NC', 'nc': 'NC', 'NC': 'NC',
  'Wa': 'WA', 'wa': 'WA', 'WA': 'WA',
  'Ny': 'NY', 'ny': 'NY', 'NY': 'NY',
  'OK': 'OK', 'Ok': 'OK', 'ok': 'OK'
};

function normalizeDestination(destination) {
  if (!destination) return null;
  
  // Handle "Unknown" or invalid
  if (destination === 'Unknown' || destination === 'null' || destination === '') {
    return null;
  }
  
  // Split by comma
  let parts = destination.split(',').map(p => p.trim());
  
  if (parts.length === 1) {
    // No comma, might be just city
    return destination.trim();
  }
  
  if (parts.length === 2) {
    let [city, state] = parts;
    
    // Clean up city - remove state abbreviations from city name
    // e.g., "Austin Tx" -> "Austin", "Boston Ma" -> "Boston"
    city = city.replace(/\s+[A-Za-z]{2}$/i, '').trim();
    
    // Normalize state
    const stateUpper = state.toUpperCase().trim();
    const normalizedState = STATE_ABBR[stateUpper] || stateUpper;
    
    // Ensure state is 2 letters
    if (normalizedState.length === 2) {
      return `${city}, ${normalizedState}`;
    }
  }
  
  if (parts.length === 3) {
    // Might be "Austin, Tx, TX" or "City, State, Zip"
    let [city, part2, part3] = parts;
    
    // Check if part2 looks like a state
    const part2Upper = part2.toUpperCase().trim();
    const part3Upper = part3.toUpperCase().trim();
    
    if (STATE_ABBR[part2Upper] || part2Upper.length === 2) {
      // part2 is state
      return `${city.trim()}, ${STATE_ABBR[part2Upper] || part2Upper}`;
    } else if (STATE_ABBR[part3Upper] || part3Upper.length === 2) {
      // part3 is state
      return `${city.trim()}, ${STATE_ABBR[part3Upper] || part3Upper}`;
    }
  }
  
  // Return as-is if we can't parse it
  return destination;
}

async function normalizeAllDestinations() {
  console.log('\n🔧 Normalizing Search Destinations\n');
  console.log('=' .repeat(60));
  
  // Get all unique destinations
  const destinations = await sql`
    SELECT search_destination, COUNT(*) as count
    FROM lead_collections
    GROUP BY search_destination
    ORDER BY count DESC
  `;
  
  console.log(`Found ${destinations.length} unique destinations to process\n`);
  
  // Find problematic ones
  const problematic = destinations.filter(d => {
    const dest = d.search_destination;
    return dest && (
      // Any double state patterns
      /\s+[A-Za-z]{2},\s+[A-Z]{2}$/.test(dest) ||
      // Multiple commas
      dest.split(',').length > 2 ||
      // Unknown/invalid
      dest === 'Unknown' ||
      dest === 'null' ||
      // Missing state
      !dest.includes(',')
    );
  });
  
  console.log(`Found ${problematic.length} destinations needing normalization:\n`);
  
  // Process each problematic destination
  let totalFixed = 0;
  
  for (const dest of problematic) {
    const original = dest.search_destination;
    const normalized = normalizeDestination(original);
    
    if (normalized && normalized !== original) {
      console.log(`  "${original}" → "${normalized}" (${dest.count} records)`);
      
      const result = await sql`
        UPDATE lead_collections
        SET search_destination = ${normalized}
        WHERE search_destination = ${original}
        RETURNING id
      `;
      
      totalFixed += result.length;
    } else if (!normalized) {
      console.log(`  "${original}" → NULL (invalid destination)`);
      
      // Delete entries with invalid destinations
      const result = await sql`
        DELETE FROM lead_collections
        WHERE search_destination = ${original}
        RETURNING id
      `;
      
      totalFixed += result.length;
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} records`);
  
  // Deduplicate after normalization
  console.log('\n🔍 Checking for duplicates after normalization...');
  
  const duplicates = await sql`
    SELECT 
      lead_id, 
      search_collection, 
      search_destination,
      COUNT(*) as count
    FROM lead_collections
    GROUP BY lead_id, search_collection, search_destination
    HAVING COUNT(*) > 1
  `;
  
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate entries to clean up`);
    
    // Remove duplicates keeping only one
    for (const dup of duplicates) {
      const toDelete = await sql`
        DELETE FROM lead_collections
        WHERE lead_id = ${dup.lead_id}
          AND search_collection = ${dup.search_collection}
          AND search_destination = ${dup.search_destination}
          AND id NOT IN (
            SELECT MIN(id)
            FROM lead_collections
            WHERE lead_id = ${dup.lead_id}
              AND search_collection = ${dup.search_collection}
              AND search_destination = ${dup.search_destination}
          )
        RETURNING id
      `;
      
      console.log(`  Removed ${toDelete.length} duplicates for lead ${dup.lead_id}`);
    }
  }
  
  // Show final statistics
  const finalStats = await sql`
    SELECT 
      COUNT(DISTINCT search_destination) as unique_destinations,
      COUNT(*) as total_records
    FROM lead_collections
  `;
  
  const topDestinations = await sql`
    SELECT search_destination, COUNT(*) as count
    FROM lead_collections
    GROUP BY search_destination
    ORDER BY count DESC
    LIMIT 10
  `;
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Final Statistics:');
  console.log(`   Unique destinations: ${finalStats[0].unique_destinations}`);
  console.log(`   Total records: ${finalStats[0].total_records}`);
  
  console.log('\n📍 Top 10 Destinations:');
  topDestinations.forEach(d => {
    console.log(`   ${d.search_destination}: ${d.count} leads`);
  });
  
  await sql.end();
}

normalizeAllDestinations().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});