#!/usr/bin/env node

/**
 * Process search results from competitor_searches:
 * 1. Insert searched (enriched) businesses into leads table
 * 2. Insert competitors (unenriched) into prospects table with deduplication
 * 3. Track relationships in search_prospects junction table
 */

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

async function processSearchResults() {
  try {
    console.log('🚀 Starting to process search results...\n');

    // Get all searches from competitor_searches
    const searches = await sql`
      SELECT 
        id,
        job_id,
        search_term,
        search_destination,
        search_collection,
        target_business_name,
        target_business_place_id,
        target_business_rank,
        ai_intelligence,
        created_at
      FROM competitor_searches
      WHERE target_business_place_id IS NOT NULL
      AND target_business_place_id LIKE 'Ch%'
      ORDER BY created_at DESC
    `;

    console.log(`📋 Found ${searches.length} search results to process\n`);

    let stats = {
      searchesProcessed: 0,
      leadsInserted: 0,
      leadsUpdated: 0,
      prospectsInserted: 0,
      prospectsSkipped: 0,
      errors: 0
    };

    // Process each search
    for (const search of searches) {
      console.log(`\n🔍 Processing search: ${search.search_term} in ${search.search_destination}`);
      console.log(`   Job ID: ${search.job_id}`);
      
      try {
        // 1. Process the target business (enriched) -> goes to leads table
        if (search.target_business_place_id && search.ai_intelligence) {
          console.log(`   🎯 Processing target business: ${search.target_business_name}`);
          
          // Parse AI intelligence data
          let aiData = {};
          try {
            aiData = typeof search.ai_intelligence === 'string' 
              ? JSON.parse(search.ai_intelligence) 
              : search.ai_intelligence;
          } catch (e) {
            console.log(`   ⚠️ Could not parse AI intelligence data`);
          }

          // Extract city and state from search_destination
          const [city, state] = search.search_destination.split(',').map(s => s.trim());

          // Check if already exists in leads
          const existingLead = await sql`
            SELECT id, place_id FROM leads 
            WHERE place_id = ${search.target_business_place_id}
          `;

          if (existingLead.length > 0) {
            // Update existing lead with latest data
            await sql`
              UPDATE leads SET
                business_name = ${search.target_business_name},
                search_city = ${city},
                search_state = ${state},
                search_niche = ${search.search_term},
                source_directory = ${search.search_collection || 'google'},
                additional_data = ${JSON.stringify(aiData)},
                updated_at = CURRENT_TIMESTAMP
              WHERE place_id = ${search.target_business_place_id}
            `;
            console.log(`   ✅ Updated existing lead`);
            stats.leadsUpdated++;
          } else {
            // Insert new lead
            await sql`
              INSERT INTO leads (
                place_id,
                business_name,
                search_city,
                search_state,
                search_niche,
                source_directory,
                additional_data,
                lead_score,
                email_enrichment_status,
                outreach_status
              ) VALUES (
                ${search.target_business_place_id},
                ${search.target_business_name},
                ${city},
                ${state},
                ${search.search_term},
                ${search.search_collection || 'google'},
                ${JSON.stringify(aiData)},
                100,
                'completed',
                'not_started'
              )
            `;
            console.log(`   ✅ Inserted new lead`);
            stats.leadsInserted++;
          }
        }

        // 2. Get the search_collection data (contains competitors)
        let competitors = [];
        if (search.search_collection) {
          try {
            // The search_collection field contains the competitor data
            const collectionData = typeof search.search_collection === 'string' 
              ? JSON.parse(search.search_collection) 
              : search.search_collection;
            
            if (Array.isArray(collectionData)) {
              competitors = collectionData;
            } else if (collectionData.results) {
              competitors = collectionData.results;
            }
          } catch (e) {
            console.log(`   ⚠️ No competitor data found in search_collection`);
          }
        }

        console.log(`   📊 Found ${competitors.length} competitors`);

        // 3. Process each competitor -> goes to prospects table (deduplicated)
        for (const comp of competitors) {
          // Skip if it's the target business itself
          if (comp.place_id === search.target_business_place_id) {
            continue;
          }

          if (!comp.place_id || !comp.place_id.startsWith('Ch')) {
            console.log(`   ⚠️ Skipping competitor without valid place_id: ${comp.business_name || 'Unknown'}`);
            continue;
          }

          try {
            // Extract city and state
            const [compCity, compState] = search.search_destination.split(',').map(s => s.trim());

            // Insert or update in prospects table
            const result = await sql`
              INSERT INTO prospects (
                place_id,
                business_name,
                rating,
                review_count,
                street_address,
                city,
                state,
                phone,
                website,
                search_city,
                search_state,
                search_niche,
                source_directory,
                enrichment_status
              ) VALUES (
                ${comp.place_id},
                ${comp.business_name || comp.name},
                ${comp.rating || null},
                ${comp.review_count || comp.reviews || null},
                ${comp.street_address || comp.address || null},
                ${comp.city || compCity},
                ${comp.state || compState},
                ${comp.phone || null},
                ${comp.website || null},
                ${compCity},
                ${compState},
                ${search.search_term},
                ${search.search_collection || 'google'},
                'pending'
              )
              ON CONFLICT (place_id) 
              DO UPDATE SET
                rating = COALESCE(prospects.rating, EXCLUDED.rating),
                review_count = COALESCE(prospects.review_count, EXCLUDED.review_count),
                updated_at = CURRENT_TIMESTAMP
              RETURNING place_id
            `;

            if (result.length > 0) {
              stats.prospectsInserted++;
            }

            // Track the relationship in junction table
            await sql`
              INSERT INTO search_prospects (
                search_id,
                prospect_place_id,
                rank,
                is_target_business
              ) VALUES (
                ${search.id},
                ${comp.place_id},
                ${comp.rank || comp.position || null},
                ${false}
              )
              ON CONFLICT (search_id, prospect_place_id) 
              DO NOTHING
            `;

          } catch (compError) {
            console.log(`   ❌ Error processing competitor ${comp.business_name || 'Unknown'}: ${compError.message}`);
            stats.prospectsSkipped++;
          }
        }

        stats.searchesProcessed++;

      } catch (searchError) {
        console.error(`   ❌ Error processing search: ${searchError.message}`);
        stats.errors++;
      }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Searches processed: ${stats.searchesProcessed}`);
    console.log(`Leads inserted: ${stats.leadsInserted}`);
    console.log(`Leads updated: ${stats.leadsUpdated}`);
    console.log(`Prospects inserted: ${stats.prospectsInserted}`);
    console.log(`Prospects skipped: ${stats.prospectsSkipped}`);
    console.log(`Errors: ${stats.errors}`);

    // Get final counts
    const leadCount = await sql`SELECT COUNT(*) as count FROM leads`;
    const prospectCount = await sql`SELECT COUNT(*) as count FROM prospects`;
    
    console.log('\n📈 Database totals:');
    console.log(`   Total leads (enriched): ${leadCount[0].count}`);
    console.log(`   Total prospects (unenriched): ${prospectCount[0].count}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the processor
processSearchResults();