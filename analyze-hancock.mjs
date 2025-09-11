import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}
const sql = neon(connectionString);

async function findHancock() {
  try {
    // Get the latest grid search for orthodontics/braces
    const searches = await sql`
      SELECT id, search_term, city, state, created_at, initiated_by_name
      FROM grid_searches 
      WHERE search_term ILIKE '%ortho%' OR search_term ILIKE '%brace%'
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('Recent orthodontics/braces searches:');
    searches.forEach(s => {
      console.log(`  ID ${s.id}: "${s.search_term}" in ${s.city}, ${s.state} (${new Date(s.created_at).toLocaleString()})`);
      if (s.initiated_by_name) console.log(`    Target: ${s.initiated_by_name}`);
    });
    
    if (searches.length === 0) {
      console.log('No orthodontics searches found, checking all searches...');
      const allSearches = await sql`
        SELECT id, search_term, city, state, created_at 
        FROM grid_searches 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      if (allSearches.length > 0) {
        searches.push(allSearches[0]);
      }
    }
    
    if (searches.length === 0) {
      console.log('No grid searches found in database');
      return;
    }
    
    const searchId = searches[0].id;
    console.log(`\nAnalyzing search ID ${searchId}...\n`);
    
    // Find Hancock in competitors
    const hancock = await sql`
      SELECT * FROM grid_competitors 
      WHERE search_id = ${searchId}
      AND (name ILIKE '%hancock%' OR name ILIKE '%orthodontic%')
      ORDER BY coverage_percent DESC
      LIMIT 5
    `;
    
    if (hancock.length > 0) {
      console.log('=== HANCOCK/ORTHODONTICS BUSINESSES FOUND ===\n');
      
      for (const h of hancock) {
        console.log(`Name: ${h.name}`);
        console.log(`Coverage: ${h.coverage_percent}%`);
        console.log(`Appearances: ${h.appearances} out of 169 grid points`);
        console.log(`Average Rank: #${parseFloat(h.avg_rank).toFixed(1)}`);
        console.log(`Rating: ${h.rating} stars | Reviews: ${h.reviews}`);
        console.log('');
        
        // Get detailed grid points for the first Hancock entry
        if (h.name.toLowerCase().includes('hancock')) {
          const gridPoints = await sql`
            SELECT 
              gpr.grid_index,
              gpr.rank_position,
              FLOOR(gpr.grid_index / 13) as grid_row,
              (gpr.grid_index % 13) as grid_col
            FROM grid_point_results gpr
            WHERE gpr.search_id = ${searchId}
            AND gpr.competitor_id = ${h.id}
            ORDER BY gpr.rank_position
          `;
          
          console.log(`\n${h.name} appears at ${gridPoints.length} grid points:\n`);
          
          // Group by rank
          const rankGroups = {};
          gridPoints.forEach(p => {
            const rank = p.rank_position;
            if (!rankGroups[rank]) rankGroups[rank] = [];
            rankGroups[rank].push(`(${p.grid_row},${p.grid_col})`);
          });
          
          // Show summary by rank
          Object.keys(rankGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(rank => {
            console.log(`Rank #${rank}: ${rankGroups[rank].length} locations`);
            if (rankGroups[rank].length <= 10) {
              console.log(`  Grids: ${rankGroups[rank].join(', ')}`);
            } else {
              console.log(`  First 10: ${rankGroups[rank].slice(0, 10).join(', ')}`);
              console.log(`  ... and ${rankGroups[rank].length - 10} more`);
            }
          });
          
          // Calculate stats
          const ranks = gridPoints.map(p => p.rank_position);
          const bestRank = Math.min(...ranks);
          const worstRank = Math.max(...ranks);
          
          console.log('\n=== HANCOCK SUMMARY STATISTICS ===');
          console.log(`Total Appearances: ${gridPoints.length}/169 grid points`);
          console.log(`Best Rank: #${bestRank}`);
          console.log(`Worst Rank: #${worstRank}`);
          console.log(`Coverage: ${h.coverage_percent}%`);
          
          // Find where they rank #1
          const topRanks = gridPoints.filter(p => p.rank_position === 1);
          if (topRanks.length > 0) {
            console.log(`\nRanks #1 at ${topRanks.length} locations:`);
            topRanks.forEach(p => {
              console.log(`  Grid (${p.grid_row}, ${p.grid_col})`);
            });
          }
        }
      }
      
    } else {
      console.log('Hancock Orthodontics not found in this search');
      
      // Show top competitors instead
      const topCompetitors = await sql`
        SELECT name, coverage_percent, appearances, avg_rank 
        FROM grid_competitors 
        WHERE search_id = ${searchId}
        AND name NOT LIKE 'Visit %'
        AND name NOT LIKE 'Get directions%'
        ORDER BY coverage_percent DESC 
        LIMIT 10
      `;
      
      console.log('\nTop 10 competitors in this search:');
      topCompetitors.forEach((c, i) => {
        console.log(`${i+1}. ${c.name}`);
        console.log(`   Coverage: ${c.coverage_percent}% | Appearances: ${c.appearances} | Avg Rank: #${parseFloat(c.avg_rank).toFixed(1)}`);
      });
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  }
  
  process.exit(0);
}

findHancock();