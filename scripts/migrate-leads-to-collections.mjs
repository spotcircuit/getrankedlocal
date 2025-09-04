#!/usr/bin/env node
/**
 * Migration Script: Populate lead_collections table from existing leads data
 * 
 * This script will:
 * 1. Migrate leads with search_niche to lead_collections
 * 2. Normalize collection names
 * 3. Reconstruct search destinations from city data
 * 4. Handle orphaned leads without matching searches
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

// Collection normalization mapping
const COLLECTION_MAPPINGS = {
  // Medical/Spa
  'med spas': 'medspas',
  'med spa': 'medspas',
  'medical spas': 'medspas',
  'medical spa': 'medspas',
  
  // Services
  'roofing': 'roofing',
  'plumber': 'plumbers',
  'plumbing': 'plumbers',
  'seo services': 'seo-services',
  'dumpster rental': 'dumpster-rental',
  'waste removal': 'waste-removal',
  
  // Hair/Beauty
  'hair salons': 'hair-salons',
  'hair salon': 'hair-salons',
  
  // Food
  'mexican restaurants': 'mexican-restaurants',
  'restaurants': 'restaurants',
  
  // Marketing
  'marketing': 'marketing-agencies',
  'marketing agency': 'marketing-agencies',
};

function normalizeCollection(searchNiche) {
  if (!searchNiche) return null;
  
  const lowered = searchNiche.toLowerCase().trim();
  
  // Check direct mapping
  if (COLLECTION_MAPPINGS[lowered]) {
    return COLLECTION_MAPPINGS[lowered];
  }
  
  // Default: slugify
  return lowered
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function constructDestination(city, state) {
  if (!city) return null;
  
  // If state is already in city string, use as-is
  if (city.includes(',')) {
    return city.trim();
  }
  
  // Try to extract state from various formats
  if (state) {
    return `${city}, ${state}`;
  }
  
  // Default patterns for common cities
  const cityStateMap = {
    'austin': 'TX',
    'houston': 'TX',
    'dallas': 'TX',
    'miami': 'FL',
    'orlando': 'FL',
    'atlanta': 'GA',
    'chicago': 'IL',
    'new york': 'NY',
    'los angeles': 'CA',
    'san francisco': 'CA',
    'ashburn': 'VA',
    'sterling': 'VA',
    'aventura': 'FL',
  };
  
  const cityLower = city.toLowerCase();
  for (const [knownCity, knownState] of Object.entries(cityStateMap)) {
    if (cityLower.includes(knownCity)) {
      return `${city}, ${knownState}`;
    }
  }
  
  // Can't determine state
  return city;
}

async function migrateLeadsToCollections() {
  console.log('\n🚀 Starting Lead Collections Migration\n');
  console.log('=' .repeat(70));
  
  try {
    // Start transaction
    console.log('\n📝 Beginning transaction...');
    
    // Get initial stats
    const initialStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(DISTINCT lead_id) FROM lead_collections) as already_migrated,
        (SELECT COUNT(*) FROM leads WHERE search_niche IS NOT NULL) as with_search_niche
    `;
    
    console.log('\n📊 Initial State:');
    console.log(`   Total leads: ${initialStats[0].total_leads}`);
    console.log(`   Already in collections: ${initialStats[0].already_migrated}`);
    console.log(`   With search_niche: ${initialStats[0].with_search_niche}`);
    
    // Step 1: Migrate leads that have matching competitor_searches
    console.log('\n\n🔄 Step 1: Migrating leads with matching competitor_searches...');
    
    const matchedLeads = await sql`
      INSERT INTO lead_collections (lead_id, search_collection, search_destination, search_term, search_id)
      SELECT DISTINCT
        l.id as lead_id,
        COALESCE(
          CASE 
            WHEN cs.search_term IS NOT NULL THEN ${sql.json(COLLECTION_MAPPINGS)}::jsonb->>LOWER(cs.search_term)
            ELSE NULL
          END,
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                LOWER(COALESCE(cs.search_term, l.search_niche)),
                '[^a-z0-9\\s-]', '', 'g'
              ),
              '\\s+', '-', 'g'
            ),
            '-+', '-', 'g'
          )
        ) as search_collection,
        cs.search_destination,
        cs.search_term,
        cs.id as search_id
      FROM leads l
      INNER JOIN competitor_searches cs ON cs.target_business_place_id = l.place_id
      LEFT JOIN lead_collections lc ON lc.lead_id = l.id
      WHERE l.search_niche IS NOT NULL
        AND l.search_niche != ''
        AND lc.id IS NULL
        AND cs.search_destination IS NOT NULL
      ON CONFLICT (lead_id, search_collection, search_destination) DO NOTHING
      RETURNING lead_id
    `;
    
    console.log(`   ✅ Migrated ${matchedLeads.length} leads with matching searches`);
    
    // Step 2: Migrate orphaned leads (have search_niche but no competitor_searches)
    console.log('\n🔄 Step 2: Migrating orphaned leads without matching searches...');
    
    // Get orphaned leads
    const orphanedLeads = await sql`
      SELECT DISTINCT
        l.id,
        l.business_name,
        l.place_id,
        l.search_niche,
        l.search_city,
        l.city,
        l.state
      FROM leads l
      LEFT JOIN lead_collections lc ON lc.lead_id = l.id
      WHERE l.search_niche IS NOT NULL
        AND l.search_niche != ''
        AND lc.id IS NULL
    `;
    
    console.log(`   Found ${orphanedLeads.length} orphaned leads to process`);
    
    let orphanedCount = 0;
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < orphanedLeads.length; i += BATCH_SIZE) {
      const batch = orphanedLeads.slice(i, i + BATCH_SIZE);
      
      for (const lead of batch) {
        const normalizedCollection = normalizeCollection(lead.search_niche);
        const searchDestination = constructDestination(
          lead.search_city || lead.city,
          lead.state
        );
        
        if (normalizedCollection && searchDestination) {
          try {
            await sql`
              INSERT INTO lead_collections (
                lead_id,
                search_collection,
                search_destination,
                search_term
              ) VALUES (
                ${lead.id},
                ${normalizedCollection},
                ${searchDestination},
                ${lead.search_niche}
              )
              ON CONFLICT (lead_id, search_collection, search_destination) DO NOTHING
            `;
            orphanedCount++;
          } catch (err) {
            console.log(`   ⚠️  Failed for ${lead.business_name}: ${err.message}`);
          }
        }
      }
      
      if ((i + BATCH_SIZE) % 500 === 0) {
        console.log(`   Processing... ${Math.min(i + BATCH_SIZE, orphanedLeads.length)}/${orphanedLeads.length}`);
      }
    }
    
    console.log(`   ✅ Migrated ${orphanedCount} orphaned leads`);
    
    // Step 3: Handle special cases - normalize existing collections
    console.log('\n🔄 Step 3: Normalizing existing collection names...');
    
    const normalized = await sql`
      UPDATE lead_collections
      SET search_collection = CASE
        WHEN search_collection = 'med_spas_ashburn_VA' THEN 'medspas'
        WHEN search_collection = 'hair_salons_ashburn_VA' THEN 'hair-salons'
        WHEN search_collection = 'marketings_aventura_FL' THEN 'marketing-agencies'
        ELSE search_collection
      END
      WHERE search_collection IN (
        'med_spas_ashburn_VA',
        'hair_salons_ashburn_VA', 
        'marketings_aventura_FL'
      )
      RETURNING id
    `;
    
    console.log(`   ✅ Normalized ${normalized.length} existing entries`);
    
    // Get final statistics
    const finalStats = await sql`
      SELECT 
        COUNT(DISTINCT lead_id) as unique_leads,
        COUNT(DISTINCT search_collection) as unique_collections,
        COUNT(DISTINCT search_destination) as unique_destinations,
        COUNT(*) as total_relationships
      FROM lead_collections
    `;
    
    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Final Statistics:');
    console.log(`   Unique leads in collections: ${finalStats[0].unique_leads}`);
    console.log(`   Unique collections: ${finalStats[0].unique_collections}`);
    console.log(`   Unique destinations: ${finalStats[0].unique_destinations}`);
    console.log(`   Total relationships: ${finalStats[0].total_relationships}`);
    
    // Show sample of collections
    const sampleCollections = await sql`
      SELECT 
        search_collection,
        COUNT(DISTINCT lead_id) as lead_count,
        array_agg(DISTINCT search_destination ORDER BY search_destination) as destinations
      FROM lead_collections
      GROUP BY search_collection
      ORDER BY lead_count DESC
      LIMIT 10
    `;
    
    console.log('\n📁 Collections Created:');
    sampleCollections.forEach(col => {
      console.log(`   ${col.search_collection}: ${col.lead_count} leads`);
      if (col.destinations.length <= 3) {
        console.log(`      Locations: ${col.destinations.join(', ')}`);
      } else {
        console.log(`      Locations: ${col.destinations.slice(0, 3).join(', ')} + ${col.destinations.length - 3} more`);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sql.end();
  }
}

// Run migration
migrateLeadsToCollections().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});