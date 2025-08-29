import sql from './db';

interface CompetitorSearchData {
  job_id: string;
  search_term: string;
  search_destination: string;
  target_business: {
    name: string;
    place_id?: string;
    rank?: number;
  };
  competitors: any[];
  market_analysis?: any;
  ai_intelligence?: any;  // Raw AI intelligence data for the searched business
}

// Format collection name similar to lead database format
function formatCollection(searchTerm: string, destination: string): string {
  // Extract city and state from destination (e.g., "Austin, TX" -> "austin_TX")
  const parts = destination.split(',').map(s => s.trim());
  const city = parts[0]?.toLowerCase().replace(/\s+/g, '_') || '';
  const state = parts[1]?.toUpperCase() || '';
  
  // Format search term (e.g., "med spa" -> "med_spas")
  const term = searchTerm.toLowerCase().replace(/\s+/g, '_');
  const pluralTerm = term.endsWith('s') ? term : term + 's';
  
  // Combine in format: term_city_state (e.g., "med_spas_austin_TX")
  return `${pluralTerm}_${city}_${state}`;
}

export async function storeCompetitorSearch(data: CompetitorSearchData) {
  try {
    console.log('💾 Storing competitor search data...');
    console.log('📍 Search destination:', data.search_destination);
    console.log('🔍 Search term:', data.search_term);
    console.log('🏢 Target business:', data.target_business.name);
    console.log('📊 Competitors found:', data.competitors.length);
    
    // Generate collection name
    const collection = formatCollection(data.search_term, data.search_destination);
    console.log('📁 Collection format:', collection);
    
    // Check for existing search by job_id
    const existing = await sql`
      SELECT id FROM competitor_searches 
      WHERE job_id = ${data.job_id}
    `;
    
    if (existing.length > 0) {
      console.log('⚠️ Search already exists for job_id:', data.job_id);
      return { 
        success: true, 
        searchId: existing[0].id,
        message: 'Search already exists'
      };
    }
    
    // Log AI intelligence if present
    if (data.ai_intelligence) {
      console.log('🤖 AI Intelligence data present for storage');
      console.log('   Keys:', Object.keys(data.ai_intelligence));
    } else {
      console.log('⚠️ No AI Intelligence data provided');
    }
    
    // Insert search record
    const searchResult = await sql`
      INSERT INTO competitor_searches (
        job_id, 
        search_term, 
        search_destination, 
        search_collection,
        target_business_name, 
        target_business_place_id, 
        target_business_rank, 
        total_competitors_found, 
        market_analysis,
        ai_intelligence
      ) VALUES (
        ${data.job_id},
        ${data.search_term},
        ${data.search_destination},
        ${collection},
        ${data.target_business.name},
        ${data.target_business.place_id || null},
        ${data.target_business.rank || null},
        ${data.competitors.length},
        ${JSON.stringify(data.market_analysis || {})},
        ${JSON.stringify(data.ai_intelligence || null)}
      ) RETURNING id
    `;
    
    const searchId = searchResult[0].id;
    console.log('✅ Created search record with ID:', searchId);
    
    // Prepare competitor records
    let successCount = 0;
    let skipCount = 0;
    
    for (let idx = 0; idx < data.competitors.length; idx++) {
      const c = data.competitors[idx];
      
      // Skip if no place_id (can't dedupe without it)
      if (!c.place_id) {
        console.log(`⚠️ Skipping competitor without place_id: ${c.name}`);
        skipCount++;
        continue;
      }
      
      const competitorData = {
        search_id: searchId,
        place_id: c.place_id,
        business_name: c.name || c.business_name,
        rank: c.rank || idx + 1,
        rating: c.rating ? parseFloat(c.rating) : null,
        review_count: c.reviews || c.review_count || 0,
        street_address: c.address || c.street_address || c.formatted_address || null,
        city: c.city || null,
        state: c.state || null,
        phone: c.phone || null,
        website: c.website || null,
        snippet: c.snippet || null,
        book_online_link: c.book_online_link || c.booking_link || null,
        search_destination: data.search_destination,
        source_directory: collection,
        is_top_3: idx < 3
      };
      
      try {
        await sql`
          INSERT INTO competitors (
            search_id, place_id, business_name, rank, rating, review_count,
            street_address, city, state, phone, website, snippet, 
            book_online_link, search_destination, source_directory, is_top_3
          ) VALUES (
            ${competitorData.search_id}, ${competitorData.place_id}, 
            ${competitorData.business_name}, ${competitorData.rank}, 
            ${competitorData.rating}, ${competitorData.review_count},
            ${competitorData.street_address}, ${competitorData.city}, 
            ${competitorData.state}, ${competitorData.phone}, 
            ${competitorData.website}, ${competitorData.snippet},
            ${competitorData.book_online_link}, ${competitorData.search_destination},
            ${competitorData.source_directory}, ${competitorData.is_top_3}
          )
          ON CONFLICT (search_id, place_id) 
          DO UPDATE SET
            rank = EXCLUDED.rank,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            is_top_3 = EXCLUDED.is_top_3,
            snippet = COALESCE(EXCLUDED.snippet, competitors.snippet),
            website = COALESCE(EXCLUDED.website, competitors.website),
            phone = COALESCE(EXCLUDED.phone, competitors.phone)
        `;
        successCount++;
        
        if (idx < 3) {
          console.log(`✅ Stored top competitor #${idx + 1}: ${c.name}`);
        }
      } catch (err) {
        console.error(`❌ Failed to store competitor ${c.name}:`, err);
      }
    }
    
    console.log(`\n📊 Storage complete:`);
    console.log(`   - Stored: ${successCount} competitors`);
    console.log(`   - Skipped: ${skipCount} (no place_id)`);
    console.log(`   - Search ID: ${searchId}`);
    
    return {
      success: true,
      searchId,
      stored: successCount,
      skipped: skipCount,
      total: data.competitors.length
    };
    
  } catch (error) {
    console.error('❌ Failed to store competitor search:', error);
    throw error;
  }
}

// Get competitor analysis by job_id
export async function getCompetitorAnalysisByJobId(jobId: string) {
  try {
    const searches = await sql`
      SELECT 
        cs.*,
        COUNT(c.id) as competitor_count
      FROM competitor_searches cs
      LEFT JOIN competitors c ON c.search_id = cs.id
      WHERE cs.job_id = ${jobId}
      GROUP BY cs.id
    `;
    
    if (searches.length === 0) {
      return null;
    }
    
    const search = searches[0];
    
    // Get all competitors for this search
    const competitors = await sql`
      SELECT * FROM competitors 
      WHERE search_id = ${search.id}
      ORDER BY rank ASC
    `;
    
    return {
      search,
      competitors
    };
  } catch (error) {
    console.error('Error fetching competitor analysis:', error);
    throw error;
  }
}

// Get all searches for a search term
export async function getSearchesByTerm(searchTerm: string) {
  try {
    return await sql`
      SELECT 
        cs.*,
        COUNT(c.id) as competitor_count
      FROM competitor_searches cs
      LEFT JOIN competitors c ON c.search_id = cs.id
      WHERE LOWER(cs.search_term) = LOWER(${searchTerm})
      GROUP BY cs.id
      ORDER BY cs.created_at DESC
    `;
  } catch (error) {
    console.error('Error fetching searches by term:', error);
    throw error;
  }
}

// Get competitor by place_id across all searches
export async function getCompetitorByPlaceId(placeId: string) {
  try {
    return await sql`
      SELECT 
        c.*,
        cs.search_term,
        cs.search_destination,
        cs.created_at as search_date
      FROM competitors c
      JOIN competitor_searches cs ON c.search_id = cs.id
      WHERE c.place_id = ${placeId}
      ORDER BY cs.created_at DESC
    `;
  } catch (error) {
    console.error('Error fetching competitor by place_id:', error);
    throw error;
  }
}

// Get businesses that appear in searches outside their actual location
export async function getCrossLocationCompetitors() {
  try {
    return await sql`
      SELECT DISTINCT
        c.place_id,
        c.business_name,
        c.city as actual_city,
        c.state as actual_state,
        c.search_destination,
        COUNT(*) as appearance_count
      FROM competitors c
      WHERE c.search_destination != CONCAT(c.city, ', ', c.state)
        AND c.city IS NOT NULL
        AND c.state IS NOT NULL
      GROUP BY c.place_id, c.business_name, c.city, c.state, c.search_destination
      ORDER BY appearance_count DESC
    `;
  } catch (error) {
    console.error('Error fetching cross-location competitors:', error);
    throw error;
  }
}