#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function fixMissingLeadCollections() {
  console.log('Starting to fix missing lead_collections entries...\n');

  try {
    // 1. Find leads that don't have ANY lead_collections entries
    console.log('Finding leads without lead_collections entries...');
    const orphanedLeads = await sql`
      SELECT 
        l.id,
        l.business_name,
        l.city,
        l.state,
        l.additional_data
      FROM leads l
      LEFT JOIN lead_collections lc ON l.id = lc.lead_id
      WHERE lc.lead_id IS NULL
    `;

    console.log(`Found ${orphanedLeads.length} leads without lead_collections entries\n`);

    if (orphanedLeads.length > 0) {
      // 2. For each orphaned lead, try to determine its collection from additional_data
      const toInsert = [];
      
      for (const lead of orphanedLeads) {
        let searchTerm = null;
        let searchDestination = `${lead.city}, ${lead.state}`;
        
        // Try to extract search info from additional_data
        if (lead.additional_data) {
          const data = typeof lead.additional_data === 'string' 
            ? JSON.parse(lead.additional_data) 
            : lead.additional_data;
          
          // Look for search_term or niche in the data
          searchTerm = data.search_term || data.niche || data.search_niche || null;
          
          // Look for search destination
          if (data.search_destination) {
            searchDestination = data.search_destination;
          } else if (data.search_city && data.search_state) {
            searchDestination = `${data.search_city}, ${data.search_state}`;
          }
        }
        
        // If we couldn't find a search term, skip this lead
        if (!searchTerm) {
          console.log(`⚠️  Lead ${lead.id} (${lead.business_name}) - No search term found in additional_data`);
          continue;
        }
        
        // Normalize the collection name
        const collection = searchTerm.toLowerCase()
          .replace(/\s+/g, ' ')
          .trim();
        
        toInsert.push({
          lead_id: lead.id,
          search_collection: collection,
          search_destination: searchDestination,
          search_term: searchTerm
        });
        
        console.log(`✓ Will add: Lead ${lead.id} (${lead.business_name}) -> collection: ${collection}, destination: ${searchDestination}`);
      }
      
      // 3. Insert missing lead_collections entries
      if (toInsert.length > 0) {
        console.log(`\nInserting ${toInsert.length} new lead_collections entries...`);
        
        for (const entry of toInsert) {
          await sql`
            INSERT INTO lead_collections (
              lead_id,
              search_collection,
              search_destination,
              search_term,
              created_at,
              updated_at
            ) VALUES (
              ${entry.lead_id},
              ${entry.search_collection},
              ${entry.search_destination},
              ${entry.search_term},
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            ON CONFLICT (lead_id, search_collection, search_destination)
            DO UPDATE SET
              search_term = EXCLUDED.search_term,
              updated_at = CURRENT_TIMESTAMP
          `;
        }
        
        console.log(`✅ Successfully inserted ${toInsert.length} lead_collections entries`);
      }
    }

    // 4. Fix inconsistencies where search_collection doesn't match search_term
    console.log('\n\nFixing inconsistencies where search_collection != search_term...');
    
    const inconsistent = await sql`
      SELECT 
        lead_id,
        search_collection,
        search_destination,
        search_term,
        COUNT(*) as count
      FROM lead_collections
      WHERE search_collection != search_term
        AND search_term IS NOT NULL
      GROUP BY lead_id, search_collection, search_destination, search_term
    `;
    
    console.log(`Found ${inconsistent.length} inconsistent entries`);
    
    if (inconsistent.length > 0) {
      console.log('\nNormalizing collection names to match search terms...');
      
      // Map of what to change
      const normalizationMap = {
        'medspas': 'med spas',
        'hair-salons': 'hair salons',
        'marketing-agencies': 'marketing',
        'law-firms': 'law firms',
        'home-services': 'home services'
      };
      
      for (const [oldName, newName] of Object.entries(normalizationMap)) {
        const result = await sql`
          UPDATE lead_collections
          SET search_collection = ${newName}
          WHERE search_collection = ${oldName}
        `;
        
        console.log(`✓ Updated ${oldName} -> ${newName}`);
      }
      
      // Also make search_collection = search_term where they differ
      const updateResult = await sql`
        UPDATE lead_collections
        SET search_collection = search_term
        WHERE search_collection != search_term
          AND search_term IS NOT NULL
      `;
      
      console.log(`✅ Normalized all collection names to match search terms`);
    }

    // 5. Final report
    console.log('\n\n=== Final Report ===');
    
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT lead_id) as total_leads,
        COUNT(DISTINCT search_collection) as total_collections,
        COUNT(DISTINCT search_destination) as total_destinations,
        COUNT(*) as total_relationships
      FROM lead_collections
    `;
    
    console.log('Lead Collections Stats:', stats[0]);
    
    const collections = await sql`
      SELECT 
        search_collection,
        COUNT(DISTINCT lead_id) as lead_count,
        COUNT(DISTINCT search_destination) as destination_count
      FROM lead_collections
      GROUP BY search_collection
      ORDER BY lead_count DESC
    `;
    
    console.log('\nCollections Summary:');
    collections.forEach(c => {
      console.log(`  - ${c.search_collection}: ${c.lead_count} leads across ${c.destination_count} destinations`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the migration
fixMissingLeadCollections().then(() => {
  console.log('\n✅ Migration completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});