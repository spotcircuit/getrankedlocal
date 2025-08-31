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

async function checkRecentLeads() {
  try {
    // Check recent searches
    const recentSearches = await sql`
      SELECT 
        id,
        job_id,
        target_business_name,
        target_business_place_id,
        search_term,
        search_destination,
        created_at
      FROM competitor_searches
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('📋 RECENT SEARCHES:');
    console.log('==================');
    recentSearches.forEach(s => {
      console.log(`\n🔍 ${s.target_business_name}`);
      console.log(`   Search: ${s.search_term} in ${s.search_destination}`);
      console.log(`   Place ID: ${s.target_business_place_id}`);
      console.log(`   Time: ${s.created_at}`);
    });
    
    // Check if these businesses are in leads
    console.log('\n\n✅ CHECKING LEADS TABLE:');
    console.log('========================');
    
    for (const search of recentSearches) {
      if (search.target_business_place_id) {
        const lead = await sql`
          SELECT 
            id,
            business_name,
            place_id,
            email,
            domain,
            owner_name,
            created_at,
            updated_at
          FROM leads
          WHERE place_id = ${search.target_business_place_id}
        `;
        
        if (lead.length > 0) {
          console.log(`\n✅ FOUND: ${lead[0].business_name}`);
          console.log(`   Email: ${lead[0].email || 'NOT EXTRACTED'}`);
          console.log(`   Domain: ${lead[0].domain || 'NOT EXTRACTED'}`);
          console.log(`   Owner: ${lead[0].owner_name || 'NOT EXTRACTED'}`);
          console.log(`   Created: ${lead[0].created_at}`);
        } else {
          console.log(`\n❌ NOT IN LEADS: ${search.target_business_name}`);
          console.log(`   Place ID: ${search.target_business_place_id}`);
        }
      }
    }
    
    // Check total leads count
    const totalLeads = await sql`SELECT COUNT(*) as count FROM leads`;
    console.log(`\n\n📊 Total leads in database: ${totalLeads[0].count}`);
    
    // Check prospects count
    const totalProspects = await sql`SELECT COUNT(*) as count FROM prospects`;
    console.log(`📊 Total prospects in database: ${totalProspects[0].count}`);
    
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRecentLeads();