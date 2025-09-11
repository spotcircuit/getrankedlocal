#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function clearGridData() {
  console.log('🗑️  Clearing all grid search data from database...');
  
  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting grid_point_results...');
    const r1 = await sql`DELETE FROM grid_point_results`;
    console.log(`  Deleted ${r1.length || 0} rows`);
    
    console.log('Deleting grid_competitors...');
    const r2 = await sql`DELETE FROM grid_competitors`;
    console.log(`  Deleted ${r2.length || 0} rows`);
    
    console.log('Deleting competitor_summaries...');
    const r3 = await sql`DELETE FROM competitor_summaries`;
    console.log(`  Deleted ${r3.length || 0} rows`);
    
    console.log('Deleting grid_cells...');
    const r4 = await sql`DELETE FROM grid_cells`;
    console.log(`  Deleted ${r4.length || 0} rows`);
    
    console.log('Deleting grid_searches...');
    const r5 = await sql`DELETE FROM grid_searches`;
    console.log(`  Deleted ${r5.length || 0} rows`);
    
    // Verify tables are empty
    console.log('\n✅ Verifying tables are empty:');
    const counts = await sql`
      SELECT 'grid_searches' as table_name, COUNT(*) as count FROM grid_searches
      UNION ALL
      SELECT 'grid_competitors', COUNT(*) FROM grid_competitors
      UNION ALL
      SELECT 'grid_point_results', COUNT(*) FROM grid_point_results
      UNION ALL
      SELECT 'grid_cells', COUNT(*) FROM grid_cells
      UNION ALL
      SELECT 'competitor_summaries', COUNT(*) FROM competitor_summaries
    `;
    
    counts.forEach(row => {
      console.log(`  ${row.table_name}: ${row.count} rows`);
    });
    
    console.log('\n✅ All grid search data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing grid tables:', error.message);
    process.exit(1);
  }
}

clearGridData();