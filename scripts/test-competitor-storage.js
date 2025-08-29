const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

loadEnv();

async function testCompetitorStorage() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  
  // Sample test data mimicking real API response
  const testData = {
    job_id: `test_${Date.now()}`,
    search_term: 'med spa',
    search_destination: 'Austin, TX',
    target_business: {
      name: 'Bella Medspa',
      place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      rank: 5
    },
    competitors: [
      {
        place_id: 'ChIJxxxxxx001',
        name: 'Elite Aesthetics',
        rank: 1,
        rating: 4.9,
        reviews: 523,
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        phone: '(512) 555-0001',
        website: 'eliteaesthetics.com',
        snippet: 'Premier medical spa offering advanced treatments',
        book_online_link: 'https://book.eliteaesthetics.com'
      },
      {
        place_id: 'ChIJxxxxxx002',
        name: 'Glow Medical Spa',
        rank: 2,
        rating: 4.8,
        reviews: 412,
        address: '456 Oak Ave',
        city: 'Austin',
        state: 'TX',
        phone: '(512) 555-0002',
        website: 'glowmedspa.com',
        snippet: 'Your destination for beauty and wellness',
        book_online_link: 'https://glowmedspa.com/book'
      },
      {
        place_id: 'ChIJxxxxxx003',
        name: 'Radiance Wellness Center',
        rank: 3,
        rating: 4.7,
        reviews: 389,
        address: '789 Pine Blvd',
        city: 'Round Rock',  // Different city!
        state: 'TX',
        phone: '(512) 555-0003',
        website: 'radiancewellness.com',
        snippet: 'Holistic approach to aesthetic medicine'
      },
      {
        place_id: 'ChIJxxxxxx004',
        name: 'Luxe Beauty Bar',
        rank: 4,
        rating: 4.6,
        reviews: 267,
        address: '321 Elm St',
        city: 'Austin',
        state: 'TX',
        phone: '(512) 555-0004'
      }
    ],
    market_analysis: {
      total_competitors: 47,
      avg_rating: 4.5,
      avg_reviews: 234,
      top_services: ['Botox', 'Laser Hair Removal', 'Facials'],
      market_saturation: 'high'
    }
  };

  try {
    console.log('🧪 Starting competitor storage test...\n');
    
    // Import and use the storage function
    const { storeCompetitorSearch } = require('../lib/competitor-db');
    
    // Store the test data
    const result = await storeCompetitorSearch(testData);
    
    console.log('\n✅ Storage test completed!');
    console.log('📊 Result:', result);
    
    // Verify data was stored
    console.log('\n🔍 Verifying stored data...');
    
    // Check search record
    const searches = await sql`
      SELECT * FROM competitor_searches 
      WHERE job_id = ${testData.job_id}
    `;
    
    if (searches.length > 0) {
      console.log('✅ Search record found:', {
        id: searches[0].id,
        search_term: searches[0].search_term,
        search_destination: searches[0].search_destination,
        target_business: searches[0].target_business_name,
        total_competitors: searches[0].total_competitors_found
      });
      
      // Check competitor records
      const competitors = await sql`
        SELECT * FROM competitors 
        WHERE search_id = ${searches[0].id}
        ORDER BY rank
      `;
      
      console.log(`\n✅ Found ${competitors.length} competitors:`);
      competitors.forEach(c => {
        console.log(`   #${c.rank} ${c.business_name} - ${c.rating}★ (${c.review_count} reviews)`);
        if (c.city !== 'Austin') {
          console.log(`      📍 Located in ${c.city} but showing in ${c.search_destination}`);
        }
      });
      
      // Test duplicate prevention
      console.log('\n🔄 Testing duplicate prevention...');
      const duplicateResult = await storeCompetitorSearch(testData);
      console.log('✅ Duplicate prevention:', duplicateResult.message);
      
      // Check cross-location competitors
      const crossLocation = await sql`
        SELECT * FROM competitors 
        WHERE search_id = ${searches[0].id}
          AND city != 'Austin'
      `;
      
      if (crossLocation.length > 0) {
        console.log(`\n📍 Found ${crossLocation.length} competitor(s) from outside Austin:`);
        crossLocation.forEach(c => {
          console.log(`   - ${c.business_name} from ${c.city}, ${c.state}`);
        });
      }
      
    } else {
      console.error('❌ Search record not found!');
    }
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCompetitorStorage();