const { neon } = require('@neondatabase/serverless');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function clearGridTables() {
  console.log('🗑️  Clearing all grid search tables...');
  
  try {
    // Delete in order to respect foreign key constraints
    const results = [];
    
    // 1. Delete grid_point_results first (has foreign keys)
    const r1 = await sql`DELETE FROM grid_point_results`;
    console.log(`   - Deleted rows from grid_point_results`);
    
    // 2. Delete grid_competitors
    const r2 = await sql`DELETE FROM grid_competitors`;
    console.log(`   - Deleted rows from grid_competitors`);
    
    // 3. Delete competitor_summaries (if exists)
    try {
      const r3 = await sql`DELETE FROM competitor_summaries`;
      console.log(`   - Deleted rows from competitor_summaries`);
    } catch (e) {
      // Table might not exist
    }
    
    // 4. Delete grid_cells
    const r4 = await sql`DELETE FROM grid_cells`;
    console.log(`   - Deleted rows from grid_cells`);
    
    // 5. Delete grid_searches last (parent table)
    const r5 = await sql`DELETE FROM grid_searches`;
    console.log(`   - Deleted rows from grid_searches`);
    
    console.log('✅ Successfully cleared all grid tables');
    
    // Verify all tables are empty
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM grid_searches) as searches,
        (SELECT COUNT(*) FROM grid_competitors) as competitors,
        (SELECT COUNT(*) FROM grid_point_results) as point_results,
        (SELECT COUNT(*) FROM grid_cells) as cells
    `;
    
    console.log('\n📊 Verification - Row counts after deletion:');
    console.log(`   - grid_searches: ${counts[0].searches}`);
    console.log(`   - grid_competitors: ${counts[0].competitors}`);
    console.log(`   - grid_point_results: ${counts[0].point_results}`);
    console.log(`   - grid_cells: ${counts[0].cells}`);
    
  } catch (error) {
    console.error('❌ Error clearing tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

clearGridTables();