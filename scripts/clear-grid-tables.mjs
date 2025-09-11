import sql from '../lib/db.ts';

async function clearGridTables() {
  console.log('🗑️  Clearing all grid search tables...');
  
  try {
    // Delete in order to respect foreign key constraints
    const results = [];
    
    // 1. Delete sponsored results first (has foreign keys to grid_searches)
    const r0a = await sql`DELETE FROM sponsored_results`;
    results.push(`Deleted ${r0a.count} rows from sponsored_results`);
    
    const r0b = await sql`DELETE FROM sponsored_summary`;
    results.push(`Deleted ${r0b.count} rows from sponsored_summary`);
    
    // 2. Delete grid_point_results (has foreign keys)
    const r1 = await sql`DELETE FROM grid_point_results`;
    results.push(`Deleted ${r1.count} rows from grid_point_results`);
    
    // 3. Delete grid_competitors
    const r2 = await sql`DELETE FROM grid_competitors`;
    results.push(`Deleted ${r2.count} rows from grid_competitors`);
    
    // 4. Delete competitor_summaries
    const r3 = await sql`DELETE FROM competitor_summaries`;
    results.push(`Deleted ${r3.count} rows from competitor_summaries`);
    
    // 5. Delete grid_cells
    const r4 = await sql`DELETE FROM grid_cells`;
    results.push(`Deleted ${r4.count} rows from grid_cells`);
    
    // 6. Delete grid_searches last (parent table)
    const r5 = await sql`DELETE FROM grid_searches`;
    results.push(`Deleted ${r5.count} rows from grid_searches`);
    
    console.log('✅ Successfully cleared all grid tables:');
    results.forEach(r => console.log(`   - ${r}`));
    
    // Verify all tables are empty
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM grid_searches) as searches,
        (SELECT COUNT(*) FROM grid_competitors) as competitors,
        (SELECT COUNT(*) FROM grid_point_results) as point_results,
        (SELECT COUNT(*) FROM grid_cells) as cells,
        (SELECT COUNT(*) FROM competitor_summaries) as summaries,
        (SELECT COUNT(*) FROM sponsored_results) as sponsored_results,
        (SELECT COUNT(*) FROM sponsored_summary) as sponsored_summary
    `;
    
    console.log('\n📊 Verification - Row counts after deletion:');
    console.log(`   - grid_searches: ${counts[0].searches}`);
    console.log(`   - grid_competitors: ${counts[0].competitors}`);
    console.log(`   - grid_point_results: ${counts[0].point_results}`);
    console.log(`   - grid_cells: ${counts[0].cells}`);
    console.log(`   - competitor_summaries: ${counts[0].summaries}`);
    console.log(`   - sponsored_results: ${counts[0].sponsored_results}`);
    console.log(`   - sponsored_summary: ${counts[0].sponsored_summary}`);
    
  } catch (error) {
    console.error('❌ Error clearing tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

clearGridTables();