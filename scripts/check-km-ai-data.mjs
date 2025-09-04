import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkKMAIData() {
  const placeId = 'ChIJt5aQN3o_tokRGBA8Ql77l1M';
  console.log(`\n🔍 Checking AI data for K&M HAIR LOUNGE\n`);
  console.log('=' .repeat(60));
  
  // Check in leads table
  console.log('\n📊 LEADS TABLE - additional_data field:');
  const leads = await sql`
    SELECT 
      business_name,
      additional_data
    FROM leads
    WHERE place_id = ${placeId}
  `;
  
  if (leads.length > 0) {
    const lead = leads[0];
    console.log('\nBusiness:', lead.business_name);
    
    if (lead.additional_data) {
      console.log('\n🤖 Raw AI Data Type:', typeof lead.additional_data);
      console.log('\n🤖 Raw AI Data:', JSON.stringify(lead.additional_data, null, 2));
      
      // Try to parse if it's a string
      if (typeof lead.additional_data === 'string') {
        try {
          const parsed = JSON.parse(lead.additional_data);
          console.log('\n📄 Parsed AI Data:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('\n❌ Could not parse as JSON');
        }
      }
    } else {
      console.log('\n❌ No additional_data found');
    }
  }
  
  // Check in competitor_searches table
  console.log('\n\n📊 COMPETITOR_SEARCHES TABLE - ai_intelligence field:');
  const searches = await sql`
    SELECT 
      id,
      search_term,
      ai_intelligence,
      created_at
    FROM competitor_searches
    WHERE target_business_place_id = ${placeId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  if (searches.length > 0) {
    const search = searches[0];
    console.log('\nSearch ID:', search.id);
    console.log('Search Term:', search.search_term);
    console.log('Created:', search.created_at);
    
    if (search.ai_intelligence) {
      console.log('\n🤖 Raw AI Intelligence Type:', typeof search.ai_intelligence);
      console.log('\n🤖 Raw AI Intelligence:', JSON.stringify(search.ai_intelligence, null, 2));
      
      // Try to parse if it's a string
      if (typeof search.ai_intelligence === 'string') {
        try {
          const parsed = JSON.parse(search.ai_intelligence);
          console.log('\n📄 Parsed AI Intelligence:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('\n❌ Could not parse as JSON');
        }
      }
    } else {
      console.log('\n❌ No ai_intelligence found');
    }
  }
  
  await sql.end();
  process.exit(0);
}

checkKMAIData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});