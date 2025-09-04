#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { sql } = require('@vercel/postgres');

async function checkProspectStats() {
  try {
    // Get prospect stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN enrichment_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN enrichment_status = 'enriched' THEN 1 END) as enriched,
        COUNT(CASE WHEN enrichment_status = 'failed' THEN 1 END) as failed,
        COUNT(DISTINCT search_city) as cities,
        COUNT(DISTINCT search_niche) as niches
      FROM prospects
    `;
    
    console.log('\n📊 PROSPECT STATISTICS:');
    console.log('=' .repeat(50));
    console.log(`Total Prospects: ${stats.rows[0].total}`);
    console.log(`  - Pending: ${stats.rows[0].pending}`);
    console.log(`  - Enriched: ${stats.rows[0].enriched}`);
    console.log(`  - Failed: ${stats.rows[0].failed}`);
    console.log(`\nUnique Cities: ${stats.rows[0].cities}`);
    console.log(`Unique Niches: ${stats.rows[0].niches}`);
    
    // Get top cities
    const cities = await sql`
      SELECT search_city, COUNT(*) as count 
      FROM prospects 
      WHERE search_city IS NOT NULL
      GROUP BY search_city 
      ORDER BY count DESC 
      LIMIT 10
    `;
    
    console.log('\n🏙️ TOP CITIES:');
    console.log('=' .repeat(50));
    cities.rows.forEach((city, idx) => {
      console.log(`${idx + 1}. ${city.search_city}: ${city.count} prospects`);
    });
    
    // Get sample of pending prospects
    const pendingProspects = await sql`
      SELECT 
        place_id,
        business_name,
        search_city,
        search_niche,
        rating,
        review_count
      FROM prospects 
      WHERE enrichment_status = 'pending'
      ORDER BY review_count DESC NULLS LAST
      LIMIT 5
    `;
    
    console.log('\n🎯 TOP PENDING PROSPECTS (by reviews):');
    console.log('=' .repeat(50));
    pendingProspects.rows.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.business_name}`);
      console.log(`   City: ${p.search_city}, Niche: ${p.search_niche}`);
      console.log(`   Rating: ${p.rating}, Reviews: ${p.review_count}`);
      console.log(`   Place ID: ${p.place_id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProspectStats();