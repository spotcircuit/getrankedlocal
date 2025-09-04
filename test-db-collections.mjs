import sql from './lib/db.js';

async function testCollections() {
  try {
    console.log('Testing lead_collections table...\n');
    
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lead_collections'
      )
    `;
    console.log('Table exists:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      // Get column info
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'lead_collections'
        ORDER BY ordinal_position
      `;
      console.log('\nColumns:', columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));
      
      // Get count
      const count = await sql`SELECT COUNT(*) as count FROM lead_collections`;
      console.log('\nTotal rows:', count[0].count);
      
      // If empty, let's check competitor_searches
      if (parseInt(count[0].count) === 0) {
        console.log('\nTable is empty. Checking competitor_searches for data...');
        
        const competitorData = await sql`
          SELECT 
            search_collection as collection,
            COUNT(*) as count
          FROM competitor_searches
          WHERE search_collection IS NOT NULL
          GROUP BY search_collection
          LIMIT 10
        `;
        
        console.log('\nCompetitor searches collections:', competitorData);
        
        // Maybe we need to populate lead_collections from competitor_searches
        console.log('\n⚠️  The lead_collections table is empty but competitor_searches has data.');
        console.log('You may need to run a migration script to populate it.');
      } else {
        // Get sample collections
        const collections = await sql`
          SELECT 
            search_collection as collection,
            COUNT(DISTINCT lead_id) as total_businesses
          FROM lead_collections
          GROUP BY search_collection
          ORDER BY total_businesses DESC
          LIMIT 5
        `;
        console.log('\nTop collections:', collections);
      }
    } else {
      console.log('\n❌ Table lead_collections does not exist!');
      console.log('You may need to run: node scripts/create-lead-collections-table.mjs');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Suggestion: Check if the table name or column names are correct.');
    }
  }
  
  process.exit();
}

testCollections();