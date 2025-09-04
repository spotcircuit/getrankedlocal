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

async function examineExistingCollections() {
  try {
    console.log('🔍 Examining existing lead_collections and competitor_searches...\n');

    // Check existing competitor_searches
    console.log('=== COMPETITOR_SEARCHES ENTRIES ===');
    const competitorSearches = await sql`
      SELECT id, search_term, search_destination, search_collection, 
             target_business_name, target_business_place_id, created_at
      FROM competitor_searches
      ORDER BY created_at DESC
    `;
    
    competitorSearches.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  Search Term: "${row.search_term}"`);
      console.log(`  Search Destination: "${row.search_destination}"`);
      console.log(`  Search Collection: "${row.search_collection}"`);
      console.log(`  Target Business: "${row.target_business_name}"`);
      console.log(`  Target Place ID: "${row.target_business_place_id}"`);
      console.log(`  Created: ${row.created_at}`);
      console.log('');
    });

    // Check existing lead_collections with details
    console.log('=== LEAD_COLLECTIONS ENTRIES ===');
    const leadCollections = await sql`
      SELECT lc.id, lc.lead_id, lc.search_collection, lc.search_destination, 
             lc.search_term, lc.search_id, lc.created_at,
             l.business_name, l.search_niche, l.search_city, l.place_id
      FROM lead_collections lc
      LEFT JOIN leads l ON lc.lead_id = l.id
      ORDER BY lc.created_at DESC
    `;
    
    leadCollections.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  Lead ID: ${row.lead_id}`);
      console.log(`  Business Name: "${row.business_name}"`);
      console.log(`  Search Collection: "${row.search_collection}"`);
      console.log(`  Search Destination: "${row.search_destination}"`);
      console.log(`  Search Term: "${row.search_term}"`);
      console.log(`  Search ID: ${row.search_id}`);
      console.log(`  Lead's search_niche: "${row.search_niche}"`);
      console.log(`  Lead's search_city: "${row.search_city}"`);
      console.log(`  Lead's place_id: "${row.place_id}"`);
      console.log(`  Created: ${row.created_at}`);
      console.log('');
    });

    // Check for relationship between competitor_searches and lead_collections
    console.log('=== RELATIONSHIPS ===');
    const relationships = await sql`
      SELECT cs.id as competitor_search_id, cs.search_collection as cs_collection,
             COUNT(lc.id) as related_lead_collections
      FROM competitor_searches cs
      LEFT JOIN lead_collections lc ON cs.id = lc.search_id
      GROUP BY cs.id, cs.search_collection
    `;
    
    relationships.forEach(row => {
      console.log(`Competitor Search ID ${row.competitor_search_id} (${row.cs_collection}): ${row.related_lead_collections} related lead_collections`);
    });

    console.log('\n✅ Examination complete!\n');

  } catch (error) {
    console.error('❌ Error during examination:', error.message);
    console.error(error);
    process.exit(1);
  }
}

examineExistingCollections();