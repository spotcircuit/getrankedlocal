#!/usr/bin/env node
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function finishMigration() {
  console.log('\n🏁 Finishing Migration of Remaining Leads\n');
  
  // Simple insert for remaining leads
  const result = await sql`
    INSERT INTO lead_collections (lead_id, search_collection, search_destination, search_term)
    SELECT 
      l.id,
      CASE 
        WHEN LOWER(l.search_niche) = 'med spas' THEN 'medspas'
        WHEN LOWER(l.search_niche) = 'hair salons' THEN 'hair-salons'
        WHEN LOWER(l.search_niche) = 'marketing' THEN 'marketing-agencies'
        ELSE REPLACE(LOWER(l.search_niche), ' ', '-')
      END as search_collection,
      COALESCE(
        l.search_city || ', ' || COALESCE(l.state, 'TX'),
        l.city || ', ' || COALESCE(l.state, 'TX'),
        'Unknown'
      ) as search_destination,
      l.search_niche
    FROM leads l
    LEFT JOIN lead_collections lc ON lc.lead_id = l.id
    WHERE l.search_niche IS NOT NULL
      AND l.search_niche != ''
      AND lc.id IS NULL
    ON CONFLICT (lead_id, search_collection, search_destination) DO NOTHING
    RETURNING lead_id
  `;
  
  console.log(`✅ Migrated ${result.length} remaining leads`);
  
  // Final stats
  const finalStats = await sql`
    SELECT 
      COUNT(DISTINCT lead_id) as total_leads,
      COUNT(DISTINCT search_collection) as collections,
      COUNT(DISTINCT search_destination) as destinations
    FROM lead_collections
  `;
  
  console.log('\n📊 Final Statistics:');
  console.log(`   Total leads: ${finalStats[0].total_leads}/6511`);
  console.log(`   Collections: ${finalStats[0].collections}`);
  console.log(`   Destinations: ${finalStats[0].destinations}`);
  
  await sql.end();
}

finishMigration().catch(console.error);