#!/usr/bin/env node
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function createLeadCollectionsTable() {
  console.log('\n📊 Creating lead_collections table...\n');
  
  try {
    // Create the lead_collections table
    await sql`
      CREATE TABLE IF NOT EXISTS lead_collections (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        search_collection VARCHAR(100) NOT NULL,
        search_destination VARCHAR(255) NOT NULL,
        search_term VARCHAR(255),
        search_id INTEGER REFERENCES competitor_searches(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(lead_id, search_collection, search_destination)
      )
    `;
    
    console.log('✅ Created lead_collections table');
    
    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_lead_collections_lead_id 
      ON lead_collections(lead_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_lead_collections_collection 
      ON lead_collections(search_collection)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_lead_collections_destination 
      ON lead_collections(search_destination)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_lead_collections_search_id 
      ON lead_collections(search_id)
    `;
    
    console.log('✅ Created indexes for lead_collections');
    
    // Populate with existing data from competitor_searches
    console.log('\n🔄 Migrating existing search relationships...\n');
    
    const migrated = await sql`
      INSERT INTO lead_collections (lead_id, search_collection, search_destination, search_term, search_id)
      SELECT DISTINCT
        l.id as lead_id,
        cs.search_collection,
        cs.search_destination,
        cs.search_term,
        cs.id as search_id
      FROM leads l
      INNER JOIN competitor_searches cs ON cs.target_business_place_id = l.place_id
      WHERE cs.search_collection IS NOT NULL
        AND cs.search_destination IS NOT NULL
      ON CONFLICT (lead_id, search_collection, search_destination) DO NOTHING
      RETURNING *
    `;
    
    console.log(`✅ Migrated ${migrated.length} existing relationships`);
    
    // Show sample data
    const sample = await sql`
      SELECT 
        lc.*,
        l.business_name
      FROM lead_collections lc
      JOIN leads l ON l.id = lc.lead_id
      LIMIT 5
    `;
    
    if (sample.length > 0) {
      console.log('\n📋 Sample lead_collections entries:');
      sample.forEach(row => {
        console.log(`   ${row.business_name}: ${row.search_collection} in ${row.search_destination}`);
      });
    }
    
    // Get stats
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT lead_id) as unique_leads,
        COUNT(DISTINCT search_collection) as unique_collections,
        COUNT(DISTINCT search_destination) as unique_destinations,
        COUNT(*) as total_relationships
      FROM lead_collections
    `;
    
    console.log('\n📊 Lead Collections Statistics:');
    console.log(`   Unique leads: ${stats[0].unique_leads}`);
    console.log(`   Unique collections: ${stats[0].unique_collections}`);
    console.log(`   Unique destinations: ${stats[0].unique_destinations}`);
    console.log(`   Total relationships: ${stats[0].total_relationships}`);
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Table already exists');
    }
  }
  
  await sql.end();
  process.exit(0);
}

createLeadCollectionsTable().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});