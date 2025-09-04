#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) {
      connectionString = match[1].trim();
    }
  } catch (e) {
    console.error('Could not read .env file');
  }
}

if (!connectionString) {
  throw new Error('DATABASE_URL not found in environment or .env file');
}

const sql = neon(connectionString);

// Import the helper functions from the migration script
const { normalizeNiche, normalizeDestination, createCollectionName } = require('./migrate-lead-collections.js');

async function dryRunMigration() {
  console.log('🧪 Dry run: Testing migration logic without making changes...\n');

  try {
    // Get current counts
    const [leadsCount] = await sql`SELECT COUNT(*) as count FROM leads`;
    const [collectionsCount] = await sql`SELECT COUNT(*) as count FROM lead_collections`;
    
    console.log(`📊 Current state:`);
    console.log(`   Total leads: ${leadsCount.count}`);
    console.log(`   Total lead_collections: ${collectionsCount.count}\n`);

    // Find leads that would be migrated
    const leadsToMigrate = await sql`
      SELECT l.id, l.business_name, l.search_niche, l.search_city, l.place_id
      FROM leads l
      WHERE l.search_niche IS NOT NULL AND l.search_niche != ''
        AND l.search_city IS NOT NULL AND l.search_city != ''
        AND NOT EXISTS (
          SELECT 1 FROM lead_collections lc 
          WHERE lc.lead_id = l.id
        )
      ORDER BY l.id
      LIMIT 10
    `;

    console.log(`🎯 Sample of leads that would be migrated (showing first 10):\n`);

    const collectionGroups = {};

    leadsToMigrate.forEach((lead, index) => {
      const collectionName = createCollectionName(lead.search_niche, lead.search_city);
      const destination = normalizeDestination(lead.search_city);
      
      console.log(`${index + 1}. Lead ID: ${lead.id}`);
      console.log(`   Business: "${lead.business_name}"`);
      console.log(`   Original niche: "${lead.search_niche}"`);
      console.log(`   Original city: "${lead.search_city}"`);
      console.log(`   → Collection: "${collectionName}"`);
      console.log(`   → Destination: "${destination}"`);
      console.log(`   → Search Term: "${lead.search_niche}"`);
      console.log('');

      const key = `${collectionName}|${destination}|${lead.search_niche}`;
      if (!collectionGroups[key]) {
        collectionGroups[key] = {
          collection_name: collectionName,
          destination: destination,
          search_term: lead.search_niche,
          count: 0
        };
      }
      collectionGroups[key].count++;
    });

    // Test the normalization functions with various inputs
    console.log(`🧪 Testing normalization functions:\n`);
    
    const testNiches = ['med spas', 'hair salons', 'mexican restaurants', 'SEO Services', 'Roofing', 'dumpster rental'];
    console.log(`Niche normalization:`);
    testNiches.forEach(niche => {
      console.log(`   "${niche}" → "${normalizeNiche(niche)}"`);
    });
    
    console.log(`\nDestination normalization:`);
    const testCities = ['San Francisco Ca', 'New York City Ny', 'Boston Ma', 'Dallas Tx'];
    testCities.forEach(city => {
      console.log(`   "${city}" → "${normalizeDestination(city)}"`);
    });

    console.log(`\nCollection name generation:`);
    testNiches.slice(0, 3).forEach(niche => {
      testCities.slice(0, 2).forEach(city => {
        const collection = createCollectionName(niche, city);
        console.log(`   "${niche}" + "${city}" → "${collection}"`);
      });
    });

    // Get actual count that would be processed
    const [actualCount] = await sql`
      SELECT COUNT(*) as count
      FROM leads l
      WHERE l.search_niche IS NOT NULL AND l.search_niche != ''
        AND l.search_city IS NOT NULL AND l.search_city != ''
        AND NOT EXISTS (
          SELECT 1 FROM lead_collections lc 
          WHERE lc.lead_id = l.id
        )
    `;

    console.log(`\n📊 Migration summary (dry run):`);
    console.log(`   Leads that would be migrated: ${actualCount.count}`);
    console.log(`   Unique collections that would be created: ${Object.keys(collectionGroups).length} (from sample)`);
    console.log(`   Migration would be safe: ${actualCount.count > 0 ? 'YES' : 'NO (no leads to migrate)'}`);

    // Check for potential issues
    console.log(`\n🔍 Checking for potential issues:\n`);
    
    // Check for leads with problematic search_niche values
    const problematicNiches = await sql`
      SELECT search_niche, COUNT(*) as count
      FROM leads
      WHERE search_niche IS NOT NULL 
        AND search_niche != ''
        AND (
          search_niche ~ '[^a-zA-Z0-9\\s]'  -- Contains special characters
          OR length(search_niche) > 100     -- Very long
          OR search_niche ~ '^\\s+|\\s+$'   -- Leading/trailing whitespace
        )
      GROUP BY search_niche
      ORDER BY count DESC
      LIMIT 5
    `;

    if (problematicNiches.length > 0) {
      console.log(`⚠️  Found niches that might need special handling:`);
      problematicNiches.forEach(row => {
        console.log(`   "${row.search_niche}" (${row.count} leads)`);
      });
    } else {
      console.log(`✅ All search_niche values look clean`);
    }

    // Check for leads with problematic search_city values
    const problematicCities = await sql`
      SELECT search_city, COUNT(*) as count
      FROM leads
      WHERE search_city IS NOT NULL 
        AND search_city != ''
        AND (
          length(search_city) > 100     -- Very long
          OR search_city ~ '^\\s+|\\s+$'   -- Leading/trailing whitespace
        )
      GROUP BY search_city
      ORDER BY count DESC
      LIMIT 5
    `;

    if (problematicCities.length > 0) {
      console.log(`\n⚠️  Found cities that might need special handling:`);
      problematicCities.forEach(row => {
        console.log(`   "${row.search_city}" (${row.count} leads)`);
      });
    } else {
      console.log(`\n✅ All search_city values look clean`);
    }

    console.log(`\n✅ Dry run completed successfully!`);
    console.log(`   The migration script should work safely with the current data.`);

  } catch (error) {
    console.error('\n❌ Dry run failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

dryRunMigration();