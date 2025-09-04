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

// Helper function to normalize niche names for collection naming
function normalizeNiche(niche) {
  if (!niche) return '';
  
  return niche
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Helper function to normalize city names for destination
function normalizeDestination(city) {
  if (!city) return '';
  
  // The search_city is in format like "San Francisco Ca"
  // Convert to proper format like "San Francisco, CA"
  return city
    .trim()
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b([A-Z][a-z]*)\s+([A-Z][a-z]?)$/i, (match, cityPart, statePart) => {
      // Handle cases like "San Francisco Ca" -> "San Francisco, CA"
      const state = statePart.toUpperCase();
      return `${cityPart}, ${state}`;
    })
    .replace(/\b([A-Z][a-z]*\s+[A-Z][a-z]*)\s+([A-Z][a-z]?)$/i, (match, cityPart, statePart) => {
      // Handle cases like "New York City Ny" -> "New York City, NY"
      const state = statePart.toUpperCase();
      return `${cityPart}, ${state}`;
    });
}

// Helper function to create collection name
function createCollectionName(niche, city) {
  const normalizedNiche = normalizeNiche(niche);
  const cityPart = city
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return `${normalizedNiche}_${cityPart}`;
}

async function migrateLeadCollections() {
  console.log('🚀 Starting lead_collections migration...\n');

  try {
    // Get baseline counts
    const [initialLeadsCount] = await sql`SELECT COUNT(*) as count FROM leads`;
    const [initialCollectionsCount] = await sql`SELECT COUNT(*) as count FROM lead_collections`;
    
    console.log(`📊 Initial state:`);
    console.log(`   Total leads: ${initialLeadsCount.count}`);
    console.log(`   Total lead_collections: ${initialCollectionsCount.count}\n`);

    // Find leads that need to be migrated
    const leadsToMigrate = await sql`
      SELECT l.id, l.business_name, l.search_niche, l.search_city, l.place_id
      FROM leads l
      WHERE l.search_niche IS NOT NULL AND l.search_niche != ''
        AND l.search_city IS NOT NULL AND l.search_city != ''
        AND NOT EXISTS (
          SELECT 1 FROM lead_collections lc 
          WHERE lc.lead_id = l.id
        )
      ORDER BY l.id
    `;

    console.log(`🎯 Found ${leadsToMigrate.length} leads to migrate\n`);

    if (leadsToMigrate.length === 0) {
      console.log('✅ No leads need migration. All done!');
      return;
    }

    // Group leads by niche and city for batch processing
    const collectionGroups = {};
    
    leadsToMigrate.forEach(lead => {
      const collectionName = createCollectionName(lead.search_niche, lead.search_city);
      const destination = normalizeDestination(lead.search_city);
      const key = `${collectionName}|${destination}|${lead.search_niche}`;
      
      if (!collectionGroups[key]) {
        collectionGroups[key] = {
          collection_name: collectionName,
          destination: destination,
          search_term: lead.search_niche,
          leads: []
        };
      }
      
      collectionGroups[key].leads.push(lead);
    });

    console.log(`📦 Created ${Object.keys(collectionGroups).length} collection groups\n`);

    // Show sample of what will be created
    console.log(`🔍 Sample collections to be created:`);
    Object.values(collectionGroups).slice(0, 5).forEach(group => {
      console.log(`   "${group.collection_name}" (${group.destination}) - ${group.leads.length} leads`);
    });
    console.log('');

    // Process in transaction
    let totalProcessed = 0;
    const BATCH_SIZE = 500;
    
    console.log(`⚡ Starting migration in batches of ${BATCH_SIZE}...\n`);

    // Process each collection group
    for (const [key, group] of Object.entries(collectionGroups)) {
      try {
        console.log(`📝 Processing: ${group.collection_name} (${group.leads.length} leads)`);
        
        // Process leads in batches
        for (let i = 0; i < group.leads.length; i += BATCH_SIZE) {
          const batch = group.leads.slice(i, i + BATCH_SIZE);
          
          // Use transaction for this batch
          await sql.begin(async (tx) => {
            for (const lead of batch) {
              await tx`
                INSERT INTO lead_collections (
                  lead_id, 
                  search_collection, 
                  search_destination, 
                  search_term,
                  created_at
                ) VALUES (
                  ${lead.id},
                  ${group.collection_name},
                  ${group.destination},
                  ${group.search_term},
                  NOW()
                )
              `;
            }
          });
          
          totalProcessed += batch.length;
          
          if (batch.length === BATCH_SIZE) {
            console.log(`   ✓ Processed batch ${Math.floor(i / BATCH_SIZE) + 1} (${totalProcessed} total)`);
          }
        }
        
        console.log(`   ✅ Completed ${group.collection_name}: ${group.leads.length} leads`);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${group.collection_name}:`, error.message);
        throw error; // Re-throw to stop migration
      }
    }

    // Get final counts
    const [finalCollectionsCount] = await sql`SELECT COUNT(*) as count FROM lead_collections`;
    const newEntries = finalCollectionsCount.count - initialCollectionsCount.count;
    
    console.log(`\n📊 Migration completed!`);
    console.log(`   Initial lead_collections: ${initialCollectionsCount.count}`);
    console.log(`   Final lead_collections: ${finalCollectionsCount.count}`);
    console.log(`   New entries created: ${newEntries}`);
    console.log(`   Success rate: ${totalProcessed === leadsToMigrate.length ? '100%' : `${((totalProcessed / leadsToMigrate.length) * 100).toFixed(1)}%`}`);

    // Show sample of created entries
    console.log(`\n🔍 Sample of newly created entries:`);
    const sampleEntries = await sql`
      SELECT lc.search_collection, lc.search_destination, lc.search_term, COUNT(*) as count
      FROM lead_collections lc
      WHERE lc.created_at >= NOW() - INTERVAL '5 minutes'
      GROUP BY lc.search_collection, lc.search_destination, lc.search_term
      ORDER BY count DESC
      LIMIT 5
    `;
    
    sampleEntries.forEach(entry => {
      console.log(`   "${entry.search_collection}" (${entry.search_destination}) - ${entry.count} leads`);
    });

    console.log(`\n✅ Migration successful! All lead collections have been populated.`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Add confirmation prompt
if (require.main === module) {
  console.log('⚠️  This script will migrate lead data to populate the lead_collections table.');
  console.log('⚠️  This is a one-time migration that should be safe to run multiple times.');
  console.log('⚠️  It will skip leads that are already in lead_collections.\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Do you want to proceed? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      rl.close();
      migrateLeadCollections();
    } else {
      console.log('Migration cancelled.');
      rl.close();
    }
  });
} else {
  // Export for testing
  module.exports = { migrateLeadCollections, normalizeNiche, normalizeDestination, createCollectionName };
}