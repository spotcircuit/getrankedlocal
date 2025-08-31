#!/usr/bin/env node

/**
 * Analyze competitor_searches table to understand the data
 */

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

async function analyzeSearches() {
  try {
    console.log('📊 Analyzing competitor_searches table...\n');

    // Get all searches
    const searches = await sql`
      SELECT 
        id,
        target_business_name,
        target_business_place_id,
        search_term,
        search_destination,
        created_at
      FROM competitor_searches
      ORDER BY created_at DESC
    `;
    
    console.log(`Total searches: ${searches.length}\n`);
    
    // Find duplicates by place_id
    const placeIdGroups = {};
    searches.forEach(s => {
      if (s.target_business_place_id) {
        if (!placeIdGroups[s.target_business_place_id]) {
          placeIdGroups[s.target_business_place_id] = [];
        }
        placeIdGroups[s.target_business_place_id].push(s);
      }
    });
    
    // Show duplicates
    console.log('🔍 Duplicate searches (same place_id):');
    Object.entries(placeIdGroups).forEach(([placeId, group]) => {
      if (group.length > 1) {
        console.log(`\n  Place ID: ${placeId}`);
        console.log(`  Business: ${group[0].target_business_name}`);
        console.log(`  Searches (${group.length}):`);
        group.forEach(s => {
          console.log(`    - "${s.search_term}" in ${s.search_destination} (${s.created_at})`);
        });
      }
    });
    
    // Show unique businesses
    console.log('\n✅ Unique businesses:');
    Object.entries(placeIdGroups).forEach(([placeId, group]) => {
      if (group.length === 1) {
        const s = group[0];
        console.log(`  - ${s.target_business_name} (${s.search_term} in ${s.search_destination})`);
      }
    });
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`  Total searches: ${searches.length}`);
    console.log(`  Unique businesses: ${Object.keys(placeIdGroups).length}`);
    console.log(`  Businesses with duplicates: ${Object.values(placeIdGroups).filter(g => g.length > 1).length}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeSearches();