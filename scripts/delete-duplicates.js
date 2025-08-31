#!/usr/bin/env node

/**
 * Delete duplicate searches and bad place_ids from competitor_searches
 * Keep only the most recent search for each place_id
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

async function deleteDuplicates() {
  try {
    console.log('🧹 Deleting duplicates and bad place_ids...\n');

    // Delete searches with NULL or invalid place_ids (not starting with Ch)
    const badPlaceIds = await sql`
      DELETE FROM competitor_searches 
      WHERE target_business_place_id IS NULL 
      OR NOT target_business_place_id LIKE 'Ch%'
      RETURNING id, target_business_name
    `;
    
    console.log(`❌ Deleted ${badPlaceIds.length} searches with bad place_ids`);
    if (badPlaceIds.length > 0) {
      badPlaceIds.forEach(s => console.log(`   - ${s.target_business_name}`));
    }

    // Delete duplicates - keep only the most recent for each place_id
    const deletedDuplicates = await sql`
      DELETE FROM competitor_searches a
      USING competitor_searches b
      WHERE a.target_business_place_id = b.target_business_place_id
      AND a.created_at < b.created_at
      RETURNING a.id, a.target_business_name, a.search_term, a.search_destination
    `;
    
    console.log(`\n🗑️ Deleted ${deletedDuplicates.length} duplicate searches`);
    if (deletedDuplicates.length > 0) {
      deletedDuplicates.forEach(s => 
        console.log(`   - ${s.target_business_name} (${s.search_term} in ${s.search_destination})`)
      );
    }

    // Show what's left
    const remaining = await sql`
      SELECT COUNT(*) as count FROM competitor_searches
    `;
    
    console.log(`\n✅ Remaining searches: ${remaining[0].count}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteDuplicates();