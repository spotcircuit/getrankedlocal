#!/usr/bin/env node
/**
 * Script to manually add lead_collections entries for leads that don't have them
 * This is a one-time migration to populate the new lead_collections table
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

// Normalize collection function (same as in collection-utils.ts)
function normalizeCollection(searchTerm) {
  if (!searchTerm) return '';
  
  let normalized = searchTerm.toLowerCase().trim();
  
  const mappings = {
    'med spa': 'medspas',
    'med spas': 'medspas',
    'medical spa': 'medspas',
    'medical spas': 'medspas',
    'hair salon': 'hair-salons',
    'hair salons': 'hair-salons',
    'restaurant': 'restaurants',
    'restaurants': 'restaurants',
    'marketing': 'marketing-agencies',
    'marketing agency': 'marketing-agencies',
    'marketing agencies': 'marketing-agencies',
  };
  
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // Default: create a slug version
  normalized = normalized
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return normalized;
}

async function addLeadCollectionsTracking() {
  console.log('\n📊 Adding lead_collections tracking for future searches...\n');
  
  try {
    // First, let's check what we have
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT lc.lead_id) as leads_with_collections,
        COUNT(DISTINCT cs.id) as total_searches
      FROM leads l
      LEFT JOIN lead_collections lc ON lc.lead_id = l.id
      CROSS JOIN competitor_searches cs
    `;
    
    console.log('Current statistics:');
    console.log(`  Total leads: ${stats[0].total_leads}`);
    console.log(`  Leads with collections: ${stats[0].leads_with_collections}`);
    console.log(`  Total searches: ${stats[0].total_searches}`);
    
    // Find leads without collection entries
    const orphanedLeads = await sql`
      SELECT 
        l.id,
        l.business_name,
        l.place_id,
        l.search_niche,
        l.search_city,
        cs.id as search_id,
        cs.search_term,
        cs.search_destination
      FROM leads l
      LEFT JOIN lead_collections lc ON lc.lead_id = l.id
      LEFT JOIN competitor_searches cs ON cs.target_business_place_id = l.place_id
      WHERE lc.id IS NULL
        AND cs.id IS NOT NULL
    `;
    
    console.log(`\nFound ${orphanedLeads.length} leads without collection entries`);
    
    if (orphanedLeads.length > 0) {
      console.log('\nAdding collection entries for orphaned leads...\n');
      
      for (const lead of orphanedLeads) {
        const normalizedCollection = normalizeCollection(lead.search_term);
        
        try {
          await sql`
            INSERT INTO lead_collections (
              lead_id,
              search_collection,
              search_destination,
              search_term,
              search_id
            ) VALUES (
              ${lead.id},
              ${normalizedCollection},
              ${lead.search_destination},
              ${lead.search_term},
              ${lead.search_id}
            )
            ON CONFLICT (lead_id, search_collection, search_destination) 
            DO NOTHING
          `;
          
          console.log(`  ✅ ${lead.business_name}: ${normalizedCollection} in ${lead.search_destination}`);
        } catch (error) {
          console.log(`  ❌ Failed for ${lead.business_name}: ${error.message}`);
        }
      }
    }
    
    // Show updated stats
    const newStats = await sql`
      SELECT 
        COUNT(DISTINCT lead_id) as unique_leads,
        COUNT(DISTINCT search_collection) as unique_collections,
        COUNT(DISTINCT search_destination) as unique_destinations,
        COUNT(*) as total_relationships
      FROM lead_collections
    `;
    
    console.log('\n📊 Updated Lead Collections Statistics:');
    console.log(`   Unique leads: ${newStats[0].unique_leads}`);
    console.log(`   Unique collections: ${newStats[0].unique_collections}`);
    console.log(`   Unique destinations: ${newStats[0].unique_destinations}`);
    console.log(`   Total relationships: ${newStats[0].total_relationships}`);
    
    console.log('\n✅ Lead collections tracking is now set up!');
    console.log('\n⚠️  NOTE: The competitor-db.ts file needs manual update to automatically');
    console.log('    populate lead_collections for new searches. Add this code after');
    console.log('    inserting/updating the lead (around line 221):');
    console.log(`
        // Get the lead ID for lead_collections
        const leadResult = await sql\`
          SELECT id FROM leads 
          WHERE place_id = \${data.target_business.place_id}
        \`;
        
        if (leadResult.length > 0) {
          const leadId = leadResult[0].id;
          const normalizedCollection = normalizeCollection(data.search_term);
          
          // Insert into lead_collections to track the relationship
          await sql\`
            INSERT INTO lead_collections (
              lead_id,
              search_collection,
              search_destination,
              search_term,
              search_id
            ) VALUES (
              \${leadId},
              \${normalizedCollection},
              \${data.search_destination},
              \${data.search_term},
              \${searchId}
            )
            ON CONFLICT (lead_id, search_collection, search_destination) 
            DO UPDATE SET
              search_term = EXCLUDED.search_term,
              search_id = EXCLUDED.search_id
          \`;
          console.log('✅ Added lead to collection:', normalizedCollection);
        }
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await sql.end();
  process.exit(0);
}

addLeadCollectionsTracking().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});