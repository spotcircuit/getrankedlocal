#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function clearAllGridData() {
  try {
    console.log('🗑️ Clearing ALL grid search data from database...\n');
    
    // Get all grid searches
    const searches = await sql`
      SELECT id, city, state, search_term, created_at 
      FROM grid_searches 
      ORDER BY created_at DESC
    `;
    
    console.log(`Found ${searches.length} grid search(es) to delete:\n`);
    
    for (const search of searches) {
      console.log(`📍 Deleting: ${search.search_term} in ${search.city}, ${search.state} (${search.created_at})`);
      
      // Delete in order of foreign key dependencies
      // 1. Delete grid_point_results (references grid_competitors)
      const pointResults = await sql`
        DELETE FROM grid_point_results 
        WHERE search_id = ${search.id}
        RETURNING id
      `;
      console.log(`   - Deleted ${pointResults.length} grid point results`);
      
      // 2. Delete grid_competitors
      const competitors = await sql`
        DELETE FROM grid_competitors 
        WHERE search_id = ${search.id}
        RETURNING id
      `;
      console.log(`   - Deleted ${competitors.length} competitors`);
      
      // 3. Delete grid_cells
      const cells = await sql`
        DELETE FROM grid_cells 
        WHERE search_id = ${search.id}
        RETURNING id
      `;
      console.log(`   - Deleted ${cells.length} grid cells`);
      
      // 4. Finally delete the search itself
      await sql`
        DELETE FROM grid_searches 
        WHERE id = ${search.id}
      `;
      console.log(`   ✅ Deleted search record\n`);
    }
    
    if (searches.length === 0) {
      console.log('No grid searches found in database');
    } else {
      console.log(`✅ Successfully deleted ${searches.length} grid search(es)!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearAllGridData();