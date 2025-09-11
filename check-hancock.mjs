import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}
const sql = neon(connectionString);

async function checkHancock() {
  try {
    // Search for Hancock across all grid searches
    const hancock = await sql`
      SELECT 
        gc.name,
        gc.coverage_percent,
        gc.appearances,
        gc.avg_rank,
        gc.rating,
        gc.reviews,
        gs.city,
        gs.state,
        gs.search_term,
        gs.created_at
      FROM grid_competitors gc
      JOIN grid_searches gs ON gc.search_id = gs.id
      WHERE gc.name ILIKE '%hancock%'
      ORDER BY gc.coverage_percent DESC
    `;
    
    if (hancock.length === 0) {
      console.log('No businesses with "Hancock" in the name found in grid searches');
      
      // Show all businesses in Leesburg searches
      const leesburg = await sql`
        SELECT DISTINCT
          gc.name,
          gc.coverage_percent,
          gc.appearances,
          gc.avg_rank
        FROM grid_competitors gc
        JOIN grid_searches gs ON gc.search_id = gs.id
        WHERE gs.city ILIKE '%leesburg%'
        ORDER BY gc.coverage_percent DESC
        LIMIT 20
      `;
      
      if (leesburg.length > 0) {
        console.log('\nTop businesses in Leesburg grid searches:');
        leesburg.forEach((b, i) => {
          console.log(`${i+1}. ${b.name}`);
          console.log(`   Coverage: ${b.coverage_percent}% | Appearances: ${b.appearances}/169 | Avg Rank: #${parseFloat(b.avg_rank).toFixed(1)}`);
        });
      }
      
    } else {
      console.log(`Found ${hancock.length} Hancock entries:\n`);
      
      hancock.forEach(h => {
        console.log(`Name: ${h.name}`);
        console.log(`Location: ${h.city}, ${h.state}`);
        console.log(`Search Term: "${h.search_term}"`);
        console.log(`Coverage: ${h.coverage_percent}%`);
        console.log(`Appearances: ${h.appearances}/169 grid points`);
        console.log(`Average Rank: #${parseFloat(h.avg_rank).toFixed(1)}`);
        console.log(`Rating: ${h.rating} stars (${h.reviews} reviews)`);
        console.log(`Search Date: ${new Date(h.created_at).toLocaleString()}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  }
  
  process.exit(0);
}

checkHancock();