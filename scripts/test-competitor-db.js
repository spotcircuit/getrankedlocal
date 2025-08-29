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

async function testDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    console.log('🧪 Testing competitor database...\n');
    
    // Test 1: Check tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('competitor_searches', 'competitors')
      ORDER BY table_name
    `;
    
    console.log('✅ Tables found:', tables.map(t => t.table_name).join(', '));
    
    // Test 2: Insert test search
    const testJobId = `test_${Date.now()}`;
    const searchResult = await sql`
      INSERT INTO competitor_searches (
        job_id, search_term, search_destination, 
        target_business_name, target_business_rank, total_competitors_found
      ) VALUES (
        ${testJobId},
        'med spa',
        'Austin, TX',
        'Test Med Spa',
        5,
        4
      ) RETURNING id
    `;
    
    const searchId = searchResult[0].id;
    console.log('✅ Created test search with ID:', searchId);
    
    // Test 3: Insert test competitors
    const competitorData = [
      { search_id: searchId, place_id: 'test_001', business_name: 'Elite Spa', rank: 1, rating: 4.9, review_count: 500, is_top_3: true },
      { search_id: searchId, place_id: 'test_002', business_name: 'Glow Spa', rank: 2, rating: 4.8, review_count: 400, is_top_3: true },
      { search_id: searchId, place_id: 'test_003', business_name: 'Radiance Spa', rank: 3, rating: 4.7, review_count: 300, is_top_3: true },
      { search_id: searchId, place_id: 'test_004', business_name: 'Luxe Spa', rank: 4, rating: 4.6, review_count: 200, is_top_3: false }
    ];
    
    for (const comp of competitorData) {
      await sql`
        INSERT INTO competitors (
          search_id, place_id, business_name, rank, 
          rating, review_count, is_top_3
        ) VALUES (
          ${comp.search_id}, ${comp.place_id}, ${comp.business_name}, 
          ${comp.rank}, ${comp.rating}, ${comp.review_count}, ${comp.is_top_3}
        )
      `;
    }
    
    console.log('✅ Inserted', competitorData.length, 'test competitors');
    
    // Test 4: Query the data
    const competitors = await sql`
      SELECT * FROM competitors 
      WHERE search_id = ${searchId}
      ORDER BY rank
    `;
    
    console.log('\n📊 Retrieved competitors:');
    competitors.forEach(c => {
      console.log(`   #${c.rank} ${c.business_name} - ${c.rating}★ (${c.review_count} reviews)`);
    });
    
    // Test 5: Test duplicate prevention
    try {
      await sql`
        INSERT INTO competitor_searches (job_id, search_term, search_destination) 
        VALUES (${testJobId}, 'med spa', 'Austin, TX')
      `;
      console.error('❌ Duplicate prevention failed!');
    } catch (err) {
      if (err.code === '23505') {
        console.log('✅ Duplicate prevention working (job_id unique constraint)');
      } else {
        throw err;
      }
    }
    
    // Clean up test data
    await sql`DELETE FROM competitors WHERE search_id = ${searchId}`;
    await sql`DELETE FROM competitor_searches WHERE id = ${searchId}`;
    console.log('\n🧹 Cleaned up test data');
    
    console.log('\n✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabase();