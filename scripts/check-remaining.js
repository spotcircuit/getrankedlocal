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

async function checkRemaining() {
  try {
    const searches = await sql`
      SELECT 
        id,
        target_business_name,
        target_business_place_id,
        search_term,
        search_destination,
        created_at
      FROM competitor_searches
      ORDER BY target_business_place_id, created_at DESC
    `;
    
    console.log(`Total searches remaining: ${searches.length}\n`);
    
    // Group by place_id to check for duplicates
    const placeIdGroups = {};
    searches.forEach(s => {
      const key = s.target_business_place_id || 'NULL';
      if (!placeIdGroups[key]) {
        placeIdGroups[key] = [];
      }
      placeIdGroups[key].push(s);
    });
    
    // Show any remaining duplicates
    let hasDuplicates = false;
    Object.entries(placeIdGroups).forEach(([placeId, group]) => {
      if (group.length > 1) {
        if (!hasDuplicates) {
          console.log('⚠️  STILL HAS DUPLICATES:\n');
          hasDuplicates = true;
        }
        console.log(`Place ID: ${placeId}`);
        group.forEach(s => {
          console.log(`  - ${s.target_business_name} (${s.search_term}) - Created: ${s.created_at}`);
        });
        console.log('');
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ No duplicates found!\n');
      console.log('Unique businesses:');
      searches.forEach(s => {
        console.log(`  - ${s.target_business_name} (${s.search_term} in ${s.search_destination})`);
      });
    }
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRemaining();