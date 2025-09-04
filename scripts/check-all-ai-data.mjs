import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkAllAIData() {
  console.log('\n🔍 Checking all businesses with AI data\n');
  console.log('=' .repeat(60));
  
  // Get all searches with AI intelligence
  const searches = await sql`
    SELECT 
      id,
      target_business_name,
      target_business_place_id,
      search_term,
      ai_intelligence,
      created_at
    FROM competitor_searches
    WHERE ai_intelligence IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 10
  `;
  
  console.log(`Found ${searches.length} searches with AI data\n`);
  
  for (const search of searches) {
    console.log('\n' + '=' .repeat(60));
    console.log(`📍 Business: ${search.target_business_name}`);
    console.log(`   Search Term: ${search.search_term}`);
    console.log(`   Created: ${search.created_at}`);
    
    if (search.ai_intelligence) {
      const ai = search.ai_intelligence;
      
      // Check owner field
      if (ai.owner) {
        console.log('\n👤 Owner Data:');
        if (ai.owner.name) {
          console.log(`   Name: ${ai.owner.name}`);
        }
        if (ai.owner.names) {
          console.log(`   Names: ${ai.owner.names.join(', ')}`);
        }
        if (ai.owner.email) {
          console.log(`   Email: ${ai.owner.email}`);
        }
      }
      
      // Check staff
      if (ai.staff && ai.staff.length > 0) {
        console.log('\n👥 Staff:');
        console.log(`   ${ai.staff.slice(0, 3).join(', ')}`);
      }
      
      // Check contacts
      if (ai.contacts) {
        console.log('\n📧 Contacts:');
        if (ai.contacts.emails && ai.contacts.emails.length > 0) {
          console.log(`   Emails: ${ai.contacts.emails.join(', ')}`);
        }
        if (ai.contacts.phones && ai.contacts.phones.length > 0) {
          console.log(`   Phones: ${ai.contacts.phones.join(', ')}`);
        }
      }
      
      // Check if raw response exists
      if (ai.raw_ai_response) {
        // Extract a snippet about owners/founders
        const rawText = ai.raw_ai_response;
        const ownerMatch = rawText.match(/(?:Owner|Founder)[^.]*\.(?:[^.]*\.)?/i);
        if (ownerMatch) {
          console.log('\n📝 Raw mentions of owner:');
          console.log(`   "${ownerMatch[0].trim()}"`);
        }
      }
      
      // Check for issues
      console.log('\n⚠️  Issues:');
      if (ai.owner && ai.owner.name === 'founder name') {
        console.log('   - Owner name is placeholder "founder name"');
      }
      if (!ai.owner || (!ai.owner.name && !ai.owner.names)) {
        console.log('   - No owner information extracted');
      }
      if (ai.review_insights && ai.review_insights.negative_themes) {
        const badThemes = ai.review_insights.negative_themes.filter(t => 
          t.includes('review themes') || t.includes('and recent') || t.length < 5
        );
        if (badThemes.length > 0) {
          console.log('   - Negative themes contain parsing errors');
        }
      }
    }
  }
  
  await sql.end();
  process.exit(0);
}

checkAllAIData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});