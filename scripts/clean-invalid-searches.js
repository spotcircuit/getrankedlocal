#!/usr/bin/env node

/**
 * Delete search records that don't have valid Google place_ids
 * Valid place_ids start with "Ch" (e.g., ChIJ...)
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Try to read from .env file
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

// Create neon client
const sql = neon(connectionString);

async function cleanInvalidSearches() {
  try {
    console.log('🧹 Cleaning invalid search records...\n');

    // First, let's see what we have
    const allSearches = await sql`
      SELECT id, target_business_place_id, target_business_name, search_term, search_destination
      FROM competitor_searches
      ORDER BY created_at DESC
    `;
    
    console.log(`Found ${allSearches.length} total searches\n`);
    
    // Identify invalid searches (place_id doesn't start with "Ch")
    const invalidSearches = allSearches.filter(s => 
      !s.target_business_place_id || 
      !s.target_business_place_id.startsWith('Ch')
    );
    
    const validSearches = allSearches.filter(s => 
      s.target_business_place_id && 
      s.target_business_place_id.startsWith('Ch')
    );
    
    console.log(`✅ Valid searches (place_id starts with "Ch"): ${validSearches.length}`);
    console.log(`❌ Invalid searches to delete: ${invalidSearches.length}\n`);
    
    if (invalidSearches.length > 0) {
      console.log('Invalid searches to be deleted:');
      invalidSearches.forEach(s => {
        console.log(`  - ${s.target_business_name} (${s.search_term} in ${s.search_destination}) - place_id: ${s.target_business_place_id || 'NULL'}`);
      });
      
      console.log('\nDeleting invalid searches...');
      
      // Note: competitors table was already dropped and recreated
      // so we don't need to delete from it
      
      // Delete the invalid searches
      const deleteResult = await sql`
        DELETE FROM competitor_searches 
        WHERE target_business_place_id IS NULL 
        OR NOT target_business_place_id LIKE 'Ch%'
      `;
      
      console.log('✅ Invalid searches deleted successfully!\n');
    }
    
    // Show remaining valid searches
    if (validSearches.length > 0) {
      console.log('Remaining valid searches:');
      validSearches.forEach(s => {
        console.log(`  ✅ ${s.target_business_name} (${s.search_term} in ${s.search_destination}) - place_id: ${s.target_business_place_id}`);
      });
    }
    
    console.log('\n✅ Cleanup complete!');
    console.log('Now run: node scripts/process-search-results.js');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanInvalidSearches();