#!/usr/bin/env node

const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function cleanupMedSpaSearches() {
  try {
    console.log('🔍 Finding incorrect "med spas" searches for K&M Hair Lounge...');
    
    // First, let's see what we have
    const searches = await sql`
      SELECT id, target_business_name, search_term, created_at 
      FROM competitor_searches 
      WHERE LOWER(target_business_name) LIKE '%k%m%hair%'
        OR LOWER(target_business_name) LIKE '%k&m%'
      ORDER BY created_at DESC
    `;
    
    console.log(`Found ${searches.rows.length} searches for K&M:`);
    searches.rows.forEach(s => {
      console.log(`  - ID: ${s.id}, Term: "${s.search_term}", Date: ${s.created_at}`);
    });
    
    // Delete the incorrect "med spas" searches
    const deleteResult = await sql`
      DELETE FROM competitor_searches 
      WHERE (LOWER(target_business_name) LIKE '%k%m%hair%'
        OR LOWER(target_business_name) LIKE '%k&m%')
        AND LOWER(search_term) = 'med spas'
      RETURNING id, target_business_name, search_term
    `;
    
    if (deleteResult.rowCount > 0) {
      console.log(`\n✅ Deleted ${deleteResult.rowCount} incorrect "med spas" searches:`);
      deleteResult.rows.forEach(s => {
        console.log(`  - Deleted: ${s.target_business_name} - "${s.search_term}"`);
      });
    } else {
      console.log('\n❌ No "med spas" searches found to delete');
    }
    
    // Show remaining searches
    const remaining = await sql`
      SELECT id, target_business_name, search_term, created_at 
      FROM competitor_searches 
      WHERE LOWER(target_business_name) LIKE '%k%m%hair%'
        OR LOWER(target_business_name) LIKE '%k&m%'
      ORDER BY created_at DESC
    `;
    
    console.log(`\n📊 Remaining searches for K&M (${remaining.rows.length} total):`);
    remaining.rows.forEach(s => {
      console.log(`  - Term: "${s.search_term}", Date: ${s.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

cleanupMedSpaSearches();