#!/usr/bin/env node

/**
 * Process existing search results:
 * 1. Insert searched (enriched) businesses into leads table
 * 2. Insert competitors (unenriched) into competitors table with deduplication
 * 3. Track relationships in search_competitors junction table
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Try to read from .env file
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

// Create neon client
const sql = neon(connectionString);

async function processSearchResults() {
  try {
    console.log('🚀 Starting to process search results...\n');

    // First, check if competitors table exists
    console.log('📊 Checking competitors table...');
    
    try {
      // Check if table exists
      const tableCheck = await sql`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_name = 'competitors'
      `;
      
      if (tableCheck[0].count === '0') {
        console.log('Creating competitors table...');
        // Read and execute the schema
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'create-competitors-table.sql'), 'utf8');
        
        // Split by statement but handle CREATE TABLE specially
        const statements = schemaSQL.split(/;\s*\n/).filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await sql(statement);
            } catch (err) {
              // If it's just an "already exists" error, continue
              if (!err.message.includes('already exists')) {
                console.error('Error executing:', statement.substring(0, 50) + '...');
                throw err;
              }
            }
          }
        }
      } else {
        console.log('Competitors table already exists');
      }
    } catch (err) {
      console.error('Schema setup error:', err.message);
      // Try a different approach - just ensure the table exists
      try {
        // Create table if not exists (minimal version)
        await sql`
          CREATE TABLE IF NOT EXISTS competitors (
            place_id VARCHAR(255) PRIMARY KEY,
            business_name VARCHAR(255) NOT NULL,
            rating DECIMAL(2,1),
            review_count INTEGER,
            street_address TEXT,
            city VARCHAR(100),
            state VARCHAR(50),
            phone VARCHAR(50),
            website VARCHAR(255),
            search_city VARCHAR(100),
            search_niche VARCHAR(100),
            source_directory VARCHAR(100),
            enrichment_status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        // Create junction table
        await sql`
          CREATE TABLE IF NOT EXISTS search_competitors (
            search_id INTEGER,
            competitor_place_id VARCHAR(255),
            rank INTEGER,
            is_target_business BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (search_id, competitor_place_id)
          )
        `;
      } catch (fallbackErr) {
        console.error('Fallback schema creation also failed:', fallbackErr.message);
      }
    }
    
    console.log('✅ Database schema ready\n');

    // Get all competitor searches that have been completed
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
      ORDER BY created_at DESC
    `;

    console.log(`📋 Found ${searches.length} search results to process\n`);

    let stats = {
      searchesProcessed: 0,
      leadsInserted: 0,
      leadsUpdated: 0,
      competitorsInserted: 0,
      competitorsDuplicate: 0,
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
                search_city = ${search.search_destination.split(',')[0]?.trim()},
                search_niche = ${search.search_term},
                source_directory = ${search.search_collection},
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
                search_niche,
                source_directory,
                additional_data,
                lead_score,
                email_enrichment_status,
                outreach_status
              ) VALUES (
                ${search.target_business_place_id},
                ${search.target_business_name},
                ${search.search_destination.split(',')[0]?.trim()},
                ${search.search_term},
                ${search.search_collection},
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

        // 2. Get all competitors for this search
        const competitors = await sql`
          SELECT 
            place_id,
            business_name,
            rank,
            rating,
            review_count,
            street_address,
            city,
            state,
            phone,
            website,
            snippet,
            book_online_link
          FROM competitors
          WHERE search_id = ${search.id}
          ORDER BY rank
        `;

        console.log(`   📊 Found ${competitors.length} competitors`);

        // 3. Process each competitor -> goes to competitors table (deduplicated)
        for (const comp of competitors) {
          if (!comp.place_id) {
            console.log(`   ⚠️ Skipping competitor without place_id: ${comp.business_name}`);
            continue;
          }

          try {
            // Insert or update in the new competitors table
            const result = await sql`
              INSERT INTO competitors (
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
                search_niche,
                source_directory,
                enrichment_status
              ) VALUES (
                ${comp.place_id},
                ${comp.business_name},
                ${comp.rating},
                ${comp.review_count},
                ${comp.street_address},
                ${comp.city},
                ${comp.state},
                ${comp.phone},
                ${comp.website},
                ${search.search_destination.split(',')[0]?.trim()},
                ${search.search_term},
                ${search.search_collection},
                'pending'
              )
              ON CONFLICT (place_id) 
              DO UPDATE SET
                rating = EXCLUDED.rating,
                review_count = EXCLUDED.review_count,
                updated_at = CURRENT_TIMESTAMP
              RETURNING place_id
            `;

            if (result.length > 0) {
              stats.competitorsInserted++;
            }

            // Track the relationship in junction table
            await sql`
              INSERT INTO search_competitors (
                search_id,
                competitor_place_id,
                rank,
                is_target_business
              ) VALUES (
                ${search.id},
                ${comp.place_id},
                ${comp.rank},
                ${comp.place_id === search.target_business_place_id}
              )
              ON CONFLICT (search_id, competitor_place_id) 
              DO NOTHING
            `;

          } catch (compError) {
            console.log(`   ❌ Error processing competitor ${comp.business_name}: ${compError.message}`);
            stats.competitorsDuplicate++;
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
    console.log(`Competitors inserted: ${stats.competitorsInserted}`);
    console.log(`Competitors skipped (duplicate): ${stats.competitorsDuplicate}`);
    console.log(`Errors: ${stats.errors}`);

    // Get final counts
    const leadCount = await sql`SELECT COUNT(*) as count FROM leads`;
    const competitorCount = await sql`SELECT COUNT(*) as count FROM competitors`;
    
    console.log('\n📈 Database totals:');
    console.log(`   Total leads (enriched): ${leadCount[0].count}`);
    console.log(`   Total competitors (unique): ${competitorCount[0].count}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the processor
processSearchResults();