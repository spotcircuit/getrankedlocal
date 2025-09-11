import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}
const sql = neon(connectionString);

async function analyzeHancockGrid() {
  try {
    // Get the Hancock entry with highest coverage
    const hancock = await sql`
      SELECT 
        gc.*,
        gs.city,
        gs.state,
        gs.search_term
      FROM grid_competitors gc
      JOIN grid_searches gs ON gc.search_id = gs.id
      WHERE gc.name = 'Hancock Orthodontics - Leesburg'
      ORDER BY gc.coverage_percent DESC
      LIMIT 1
    `;
    
    if (hancock.length === 0) {
      console.log('Hancock Orthodontics - Leesburg not found');
      return;
    }
    
    const h = hancock[0];
    console.log('=== HANCOCK ORTHODONTICS - LEESBURG ANALYSIS ===\n');
    console.log(`Search Location: ${h.city}, ${h.state}`);
    console.log(`Search Term: "${h.search_term}"`);
    console.log(`Coverage: ${h.coverage_percent}%`);
    console.log(`Total Appearances: ${h.appearances}/169 grid points`);
    console.log(`Average Rank: #${parseFloat(h.avg_rank).toFixed(1)}`);
    console.log(`Rating: ${h.rating} stars (${h.reviews} reviews)\n`);
    
    // Get detailed grid point data
    const gridPoints = await sql`
      SELECT 
        gpr.grid_index,
        gpr.rank_position,
        FLOOR(gpr.grid_index / 13) as grid_row,
        (gpr.grid_index % 13) as grid_col
      FROM grid_point_results gpr
      WHERE gpr.search_id = ${h.search_id}
      AND gpr.competitor_id = ${h.id}
      ORDER BY gpr.rank_position, gpr.grid_index
    `;
    
    console.log(`\n=== GRID POINT BREAKDOWN (${gridPoints.length} points) ===\n`);
    
    // Group by rank ranges
    const rankRanges = {
      '1-3': [],
      '4-10': [],
      '11-20': [],
      '21-50': [],
      '51-100': [],
      '100+': []
    };
    
    gridPoints.forEach(p => {
      const gridCoord = `(${p.grid_row},${p.grid_col})`;
      const rank = p.rank_position;
      
      if (rank <= 3) rankRanges['1-3'].push({ rank, coord: gridCoord });
      else if (rank <= 10) rankRanges['4-10'].push({ rank, coord: gridCoord });
      else if (rank <= 20) rankRanges['11-20'].push({ rank, coord: gridCoord });
      else if (rank <= 50) rankRanges['21-50'].push({ rank, coord: gridCoord });
      else if (rank <= 100) rankRanges['51-100'].push({ rank, coord: gridCoord });
      else rankRanges['100+'].push({ rank, coord: gridCoord });
    });
    
    // Display summary by rank range
    console.log('RANK DISTRIBUTION:');
    Object.entries(rankRanges).forEach(([range, points]) => {
      if (points.length > 0) {
        const percentage = ((points.length / 169) * 100).toFixed(1);
        console.log(`\nRank ${range}: ${points.length} points (${percentage}% of grid)`);
        
        // Show detailed positions for top ranks
        if (range === '1-3' && points.length <= 20) {
          points.forEach(p => {
            console.log(`  #${p.rank} at grid ${p.coord}`);
          });
        } else if (points.length <= 10) {
          console.log(`  Grid positions: ${points.map(p => p.coord).join(', ')}`);
        } else {
          console.log(`  First 5: ${points.slice(0, 5).map(p => p.coord).join(', ')}`);
          if (points.length > 5) {
            console.log(`  ... and ${points.length - 5} more`);
          }
        }
      }
    });
    
    // Calculate statistics
    const ranks = gridPoints.map(p => p.rank_position);
    const bestRank = Math.min(...ranks);
    const worstRank = Math.max(...ranks);
    const medianRank = ranks.sort((a, b) => a - b)[Math.floor(ranks.length / 2)];
    
    console.log('\n=== PERFORMANCE SUMMARY ===');
    console.log(`Best Rank: #${bestRank}`);
    console.log(`Worst Rank: #${worstRank}`);
    console.log(`Median Rank: #${medianRank}`);
    console.log(`Average Rank: #${h.avg_rank}`);
    
    // Calculate visibility zones
    const notShowing = 169 - h.appearances;
    console.log(`\n=== VISIBILITY ANALYSIS ===`);
    console.log(`Visible in: ${h.appearances} grid points (${h.coverage_percent}%)`);
    console.log(`Not showing in: ${notShowing} grid points (${((notShowing/169)*100).toFixed(1)}%)`);
    
    if (rankRanges['1-3'].length > 0) {
      console.log(`\nTop 3 Rankings: ${rankRanges['1-3'].length} locations`);
      console.log(`That's ${((rankRanges['1-3'].length / 169) * 100).toFixed(1)}% of the total grid`);
    }
    
    // Grid visualization (simplified text version)
    console.log('\n=== GRID VISUALIZATION ===');
    console.log('(Higher numbers = worse ranking, • = not found)\n');
    
    // Create a 13x13 grid
    const grid = Array(13).fill(null).map(() => Array(13).fill('•'));
    
    // Fill in the ranks
    gridPoints.forEach(p => {
      const rank = p.rank_position;
      if (rank <= 3) grid[p.grid_row][p.grid_col] = '◆'; // Top 3
      else if (rank <= 10) grid[p.grid_row][p.grid_col] = '▪'; // 4-10
      else if (rank <= 20) grid[p.grid_row][p.grid_col] = '○'; // 11-20
      else grid[p.grid_row][p.grid_col] = '·'; // 21+
    });
    
    // Print the grid
    console.log('   0 1 2 3 4 5 6 7 8 9 0 1 2');
    grid.forEach((row, i) => {
      console.log(`${i.toString().padStart(2)} ${row.join(' ')}`);
    });
    
    console.log('\nLegend: ◆=Top 3, ▪=4-10, ○=11-20, ·=21+, •=Not found');
    
  } catch (error) {
    console.error('Database error:', error.message);
  }
  
  process.exit(0);
}

analyzeHancockGrid();