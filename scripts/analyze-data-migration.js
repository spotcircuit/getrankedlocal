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

async function analyzeDataMigration() {
  try {
    console.log('🔍 Analyzing current data state for lead_collections migration...\n');

    // 1. Check leads table structure
    console.log('=== LEADS TABLE STRUCTURE ===');
    const leadsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `;
    
    leadsColumns.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 2. Check lead_collections table structure
    console.log('\n=== LEAD_COLLECTIONS TABLE STRUCTURE ===');
    const leadCollectionsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lead_collections'
      ORDER BY ordinal_position
    `;
    
    leadCollectionsColumns.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Check competitor_searches table structure
    console.log('\n=== COMPETITOR_SEARCHES TABLE STRUCTURE ===');
    const competitorSearchesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'competitor_searches'
      ORDER BY ordinal_position
    `;
    
    competitorSearchesColumns.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 4. Get current counts
    console.log('\n=== CURRENT DATA COUNTS ===');
    const [leadsCount] = await sql`SELECT COUNT(*) as count FROM leads`;
    const [leadCollectionsCount] = await sql`SELECT COUNT(*) as count FROM lead_collections`;
    const [competitorSearchesCount] = await sql`SELECT COUNT(*) as count FROM competitor_searches`;
    
    console.log(`Total leads: ${leadsCount.count}`);
    console.log(`Total lead_collections entries: ${leadCollectionsCount.count}`);
    console.log(`Total competitor_searches entries: ${competitorSearchesCount.count}`);

    // 5. Analyze search metadata in leads
    console.log('\n=== LEADS SEARCH METADATA ANALYSIS ===');
    
    const [withSearchNiche] = await sql`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE search_niche IS NOT NULL AND search_niche != ''
    `;
    
    const [withSearchCity] = await sql`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE search_city IS NOT NULL AND search_city != ''
    `;
    
    const [withBoth] = await sql`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE search_niche IS NOT NULL AND search_niche != ''
        AND search_city IS NOT NULL AND search_city != ''
    `;

    console.log(`Leads with search_niche: ${withSearchNiche.count}`);
    console.log(`Leads with search_city: ${withSearchCity.count}`);
    console.log(`Leads with both search_niche and search_city: ${withBoth.count}`);

    // 6. Sample search_niche values
    console.log('\n=== SAMPLE SEARCH_NICHE VALUES ===');
    const sampleNiches = await sql`
      SELECT search_niche, COUNT(*) as count
      FROM leads 
      WHERE search_niche IS NOT NULL AND search_niche != ''
      GROUP BY search_niche
      ORDER BY count DESC
      LIMIT 10
    `;
    
    sampleNiches.forEach(row => {
      console.log(`  - "${row.search_niche}": ${row.count} leads`);
    });

    // 7. Sample search_city values
    console.log('\n=== SAMPLE SEARCH_CITY VALUES ===');
    const sampleCities = await sql`
      SELECT search_city, COUNT(*) as count
      FROM leads 
      WHERE search_city IS NOT NULL AND search_city != ''
      GROUP BY search_city
      ORDER BY count DESC
      LIMIT 10
    `;
    
    sampleCities.forEach(row => {
      console.log(`  - "${row.search_city}": ${row.count} leads`);
    });

    // 8. Check existing lead_collections entries
    console.log('\n=== EXISTING LEAD_COLLECTIONS ENTRIES ===');
    const existingCollections = await sql`
      SELECT search_collection, search_destination, search_term, COUNT(*) as count
      FROM lead_collections
      GROUP BY search_collection, search_destination, search_term
      ORDER BY count DESC
    `;
    
    existingCollections.forEach(row => {
      console.log(`  - Collection: "${row.search_collection}", Destination: "${row.search_destination}", Term: "${row.search_term}" (${row.count} leads)`);
    });

    // 9. Check if leads have state information
    console.log('\n=== LEADS WITH STATE INFORMATION ===');
    const stateFields = ['state', 'locality_state', 'address_state'];
    
    for (const field of stateFields) {
      try {
        const [stateCount] = await sql`
          SELECT COUNT(*) as count 
          FROM leads 
          WHERE ${sql(field)} IS NOT NULL AND ${sql(field)} != ''
        `.catch(() => [{ count: 0 }]);
        console.log(`Leads with ${field}: ${stateCount.count}`);
      } catch (e) {
        console.log(`Field ${field} does not exist in leads table`);
      }
    }

    // 10. Find leads that can be migrated
    console.log('\n=== MIGRATION READINESS ===');
    const [migrationReady] = await sql`
      SELECT COUNT(*) as count
      FROM leads l
      WHERE l.search_niche IS NOT NULL AND l.search_niche != ''
        AND l.search_city IS NOT NULL AND l.search_city != ''
        AND NOT EXISTS (
          SELECT 1 FROM lead_collections lc 
          WHERE lc.lead_id = l.id
        )
    `;
    
    console.log(`Leads ready for migration: ${migrationReady.count}`);
    
    const migrationPercentage = ((migrationReady.count / leadsCount.count) * 100).toFixed(1);
    console.log(`Migration coverage: ${migrationPercentage}%`);

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    console.error(error);
    process.exit(1);
  }
}

analyzeDataMigration();