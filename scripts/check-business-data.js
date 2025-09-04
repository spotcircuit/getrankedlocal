const sql = require('../lib/db').default;

async function checkBusinessData() {
  const placeId = 'ChIJt5aQN3o_tokRGBA8Ql77l1M'; // K&M HAIR LOUNGE
  
  console.log('🔍 Checking data for place_id:', placeId);
  console.log('=' .repeat(60));
  
  // Check in prospects table
  console.log('\n📊 PROSPECTS TABLE:');
  const prospects = await sql`
    SELECT 
      place_id,
      business_name,
      rating,
      review_count,
      created_at
    FROM prospects
    WHERE place_id = ${placeId}
  `;
  
  if (prospects.length > 0) {
    prospects.forEach(p => {
      console.log({
        business_name: p.business_name,
        rating: p.rating,
        review_count: p.review_count,
        created_at: p.created_at
      });
    });
  } else {
    console.log('❌ Not found in prospects table');
  }
  
  // Check in leads table
  console.log('\n📊 LEADS TABLE:');
  const leads = await sql`
    SELECT 
      place_id,
      business_name,
      rating,
      review_count,
      created_at
    FROM leads
    WHERE place_id = ${placeId}
  `;
  
  if (leads.length > 0) {
    leads.forEach(l => {
      console.log({
        business_name: l.business_name,
        rating: l.rating,
        review_count: l.review_count,
        created_at: l.created_at
      });
    });
  } else {
    console.log('❌ Not found in leads table');
  }
  
  // Check in search_prospects table
  console.log('\n📊 SEARCH_PROSPECTS TABLE (as target):');
  const searchProspects = await sql`
    SELECT 
      sp.search_id,
      sp.prospect_place_id,
      sp.is_target_business,
      sp.rank,
      p.business_name,
      p.rating,
      p.review_count,
      cs.search_term,
      cs.created_at
    FROM search_prospects sp
    JOIN prospects p ON p.place_id = sp.prospect_place_id
    JOIN competitor_searches cs ON cs.id = sp.search_id
    WHERE sp.prospect_place_id = ${placeId}
      AND sp.is_target_business = true
    ORDER BY cs.created_at DESC
  `;
  
  if (searchProspects.length > 0) {
    searchProspects.forEach(sp => {
      console.log({
        search_id: sp.search_id,
        search_term: sp.search_term,
        business_name: sp.business_name,
        rating: sp.rating,
        review_count: sp.review_count,
        rank: sp.rank,
        created_at: sp.created_at
      });
    });
  } else {
    console.log('❌ Not found as target in search_prospects');
  }
  
  // Check competitor_searches table
  console.log('\n📊 COMPETITOR_SEARCHES TABLE:');
  const searches = await sql`
    SELECT 
      id,
      target_business_name,
      target_business_place_id,
      target_business_rank,
      search_term,
      created_at
    FROM competitor_searches
    WHERE target_business_place_id = ${placeId}
    ORDER BY created_at DESC
    LIMIT 5
  `;
  
  if (searches.length > 0) {
    searches.forEach(s => {
      console.log({
        id: s.id,
        target_business_name: s.target_business_name,
        target_business_rank: s.target_business_rank,
        search_term: s.search_term,
        created_at: s.created_at
      });
    });
  } else {
    console.log('❌ Not found in competitor_searches');
  }
  
  process.exit(0);
}

checkBusinessData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});