#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function migrateLegacyLeads() {
  console.log('🔧 Migrating legacy leads to proper structure...\n');
  
  try {
    // 1. Find all leads that don't have corresponding competitor_searches
    console.log('1️⃣ Finding orphaned leads (in leads but not in competitor_searches)...');
    const orphanedLeads = await sql`
      SELECT 
        l.id,
        l.place_id,
        l.business_name,
        l.city,
        l.state,
        l.rating,
        l.review_count,
        l.created_at,
        lc.search_collection,
        lc.search_destination
      FROM leads l
      LEFT JOIN lead_collections lc ON lc.lead_id = l.id
      LEFT JOIN competitor_searches cs ON cs.target_business_place_id = l.place_id
      WHERE cs.id IS NULL
        AND l.place_id IS NOT NULL
      ORDER BY l.created_at DESC
    `;
    
    console.log(`Found ${orphanedLeads.length} orphaned leads`);
    
    if (orphanedLeads.length > 0) {
      console.log('\nSample orphaned leads:');
      orphanedLeads.slice(0, 5).forEach(lead => {
        console.log(`  - ${lead.business_name} (${lead.city}, ${lead.state})`);
        console.log(`    Collection: ${lead.search_collection || 'none'}, Place ID: ${lead.place_id}`);
      });
    }
    
    // 2. Create synthetic competitor_searches for orphaned leads
    console.log('\n2️⃣ Creating synthetic competitor_searches for orphaned leads...');
    
    let createdSearches = 0;
    const leadsByLocation = new Map();
    
    // Group leads by location and collection
    for (const lead of orphanedLeads) {
      if (!lead.place_id) continue;
      
      const destination = lead.search_destination || `${lead.city}, ${lead.state}`;
      const collection = lead.search_collection || 'medspas'; // Default to medspas for legacy
      const key = `${collection}:${destination}`;
      
      if (!leadsByLocation.has(key)) {
        leadsByLocation.set(key, []);
      }
      leadsByLocation.get(key).push(lead);
    }
    
    // Create a search for each unique location/collection combo
    for (const [key, leads] of leadsByLocation.entries()) {
      const [collection, destination] = key.split(':');
      const lead = leads[0]; // Use first lead as representative
      
      try {
        // Check if search already exists
        const existing = await sql`
          SELECT id FROM competitor_searches
          WHERE target_business_name = ${lead.business_name}
            AND target_business_place_id = ${lead.place_id}
        `;
        
        if (existing.length === 0) {
          // Create synthetic search
          const searchResult = await sql`
            INSERT INTO competitor_searches (
              job_id,
              search_term,
              search_destination,
              search_collection,
              target_business_name,
              target_business_place_id,
              target_business_rank,
              total_competitors_found,
              ai_intelligence,
              created_at
            ) VALUES (
              ${`legacy-${lead.id}-${Date.now()}`},
              ${collection.replace(/-/g, ' ')},
              ${destination},
              ${collection},
              ${lead.business_name},
              ${lead.place_id},
              1,
              0,
              ${JSON.stringify({
                legacy_migration: true,
                migrated_at: new Date().toISOString(),
                original_lead_id: lead.id,
                note: 'Synthetic search created for legacy lead'
              })},
              ${lead.created_at}
            )
            RETURNING id
          `;
          
          console.log(`✅ Created search ${searchResult[0].id} for ${lead.business_name}`);
          createdSearches++;
          
          // Add to search_prospects
          await sql`
            INSERT INTO search_prospects (
              search_id,
              prospect_place_id,
              is_target_business,
              rank,
              created_at
            ) VALUES (
              ${searchResult[0].id},
              ${lead.place_id},
              true,
              1,
              NOW()
            )
            ON CONFLICT DO NOTHING
          `;
        }
      } catch (err) {
        console.log(`⚠️ Error processing ${lead.business_name}: ${err.message}`);
      }
    }
    
    console.log(`\n✅ Created ${createdSearches} synthetic searches`);
    
    // 3. Ensure all leads are in prospects table with correct status
    console.log('\n3️⃣ Ensuring all leads are in prospects table...');
    
    const leadsNotInProspects = await sql`
      SELECT 
        l.id,
        l.place_id,
        l.business_name,
        l.rating,
        l.review_count,
        l.street_address,
        l.city,
        l.state,
        l.website,
        l.phone,
        l.owner_name,
        l.email,
        l.domain,
        l.additional_data,
        lc.search_collection,
        lc.search_destination
      FROM leads l
      LEFT JOIN lead_collections lc ON lc.lead_id = l.id
      LEFT JOIN prospects p ON p.place_id = l.place_id
      WHERE p.place_id IS NULL
        AND l.place_id IS NOT NULL
    `;
    
    console.log(`Found ${leadsNotInProspects.length} leads not in prospects table`);
    
    let addedToProspects = 0;
    for (const lead of leadsNotInProspects) {
      try {
        const [searchCity, searchState] = (lead.search_destination || `${lead.city}, ${lead.state}`).split(', ');
        
        await sql`
          INSERT INTO prospects (
            place_id,
            business_name,
            rating,
            review_count,
            street_address,
            city,
            state,
            website,
            phone,
            owner_name,
            email,
            domain,
            search_city,
            search_state,
            search_niche,
            source_directory,
            enrichment_status,
            promoted_at,
            additional_data,
            created_at,
            updated_at
          ) VALUES (
            ${lead.place_id},
            ${lead.business_name},
            ${lead.rating},
            ${lead.review_count},
            ${lead.street_address},
            ${lead.city},
            ${lead.state},
            ${lead.website},
            ${lead.phone},
            ${lead.owner_name},
            ${lead.email},
            ${lead.domain},
            ${searchCity || lead.city},
            ${searchState || lead.state},
            ${lead.search_collection || 'medspas'},
            ${`lead_${lead.id}`},
            'promoted',
            NOW(),
            ${lead.additional_data},
            NOW(),
            NOW()
          )
        `;
        addedToProspects++;
      } catch (err) {
        if (!err.message.includes('duplicate key')) {
          console.log(`⚠️ Error adding ${lead.business_name} to prospects: ${err.message}`);
        }
      }
    }
    
    console.log(`✅ Added ${addedToProspects} leads to prospects table`);
    
    // 4. Fix search_prospects for existing searches missing target business
    console.log('\n4️⃣ Fixing search_prospects missing target businesses...');
    
    const searchesMissingTarget = await sql`
      SELECT 
        cs.id as search_id,
        cs.target_business_place_id,
        cs.target_business_name,
        cs.target_business_rank
      FROM competitor_searches cs
      LEFT JOIN search_prospects sp ON sp.search_id = cs.id AND sp.is_target_business = true
      WHERE sp.search_id IS NULL
        AND cs.target_business_place_id IS NOT NULL
    `;
    
    console.log(`Found ${searchesMissingTarget.length} searches missing target in search_prospects`);
    
    let fixedTargets = 0;
    for (const search of searchesMissingTarget) {
      // First ensure the business is in prospects
      const prospectExists = await sql`
        SELECT place_id FROM prospects WHERE place_id = ${search.target_business_place_id}
      `;
      
      if (prospectExists.length === 0) {
        // Try to get from leads
        const leadData = await sql`
          SELECT * FROM leads WHERE place_id = ${search.target_business_place_id}
        `;
        
        if (leadData.length > 0) {
          const lead = leadData[0];
          // Add to prospects first
          try {
            await sql`
              INSERT INTO prospects (
                place_id,
                business_name,
                rating,
                review_count,
                street_address,
                city,
                state,
                website,
                phone,
                enrichment_status,
                promoted_at,
                created_at
              ) VALUES (
                ${lead.place_id},
                ${lead.business_name},
                ${lead.rating},
                ${lead.review_count},
                ${lead.street_address},
                ${lead.city},
                ${lead.state},
                ${lead.website},
                ${lead.phone},
                'promoted',
                NOW(),
                NOW()
              )
              ON CONFLICT (place_id) DO NOTHING
            `;
          } catch (err) {
            // Ignore duplicate key errors
          }
        }
      }
      
      // Now add to search_prospects
      try {
        await sql`
          INSERT INTO search_prospects (
            search_id,
            prospect_place_id,
            is_target_business,
            rank,
            created_at
          ) VALUES (
            ${search.search_id},
            ${search.target_business_place_id},
            true,
            ${search.target_business_rank || 1},
            NOW()
          )
        `;
        fixedTargets++;
      } catch (err) {
        if (!err.message.includes('duplicate key') && !err.message.includes('foreign key')) {
          console.log(`⚠️ Error adding target for search ${search.search_id}: ${err.message}`);
        }
      }
    }
    
    console.log(`✅ Fixed ${fixedTargets} missing targets in search_prospects`);
    
    // 5. Generate summary report
    console.log('\n📊 Migration Summary:');
    console.log('================================');
    
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM prospects WHERE enrichment_status = 'promoted') as promoted_prospects,
        (SELECT COUNT(*) FROM competitor_searches) as total_searches,
        (SELECT COUNT(DISTINCT search_id) FROM search_prospects WHERE is_target_business = true) as searches_with_targets,
        (SELECT COUNT(*) FROM leads l WHERE EXISTS (
          SELECT 1 FROM competitor_searches cs WHERE cs.target_business_place_id = l.place_id
        )) as leads_with_searches
    `;
    
    const s = stats[0];
    console.log(`Total Leads: ${s.total_leads}`);
    console.log(`Promoted Prospects: ${s.promoted_prospects}`);
    console.log(`Total Searches: ${s.total_searches}`);
    console.log(`Searches with Targets: ${s.searches_with_targets}`);
    console.log(`Leads with Searches: ${s.leads_with_searches}`);
    console.log(`Orphaned Leads: ${s.total_leads - s.leads_with_searches}`);
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateLegacyLeads().catch(console.error);