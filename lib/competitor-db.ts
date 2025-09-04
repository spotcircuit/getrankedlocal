import sql from './db';
import { normalizeCollection, parseDestination } from './collection-utils';

interface CompetitorSearchData {
  job_id: string;
  search_term: string;
  search_destination: string;
  target_business: {
    name: string;
    place_id?: string;
    rank?: number;
    rating?: string | number;
    review_count?: number;
    reviews?: number;
    address?: string;
    street_address?: string;
    city?: string;
    state?: string;
    website?: string;
    phone?: string;
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
    console.log('💾 Storing competitor search data (v2)...');
    console.log('📍 Search destination:', data.search_destination);
    console.log('🔍 Search term:', data.search_term);
    console.log('🏢 Target business:', data.target_business.name);
    console.log('📊 Competitors found:', data.competitors.length);
    
    // Generate collection name
    const collection = formatCollection(data.search_term, data.search_destination);
    console.log('📁 Collection format:', collection);
    
    // Extract city and state
    const [city, state] = data.search_destination.split(',').map(s => s.trim());
    
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
      const aiKeys = typeof data.ai_intelligence === 'object' ? Object.keys(data.ai_intelligence) : [];
      console.log('   Type:', typeof data.ai_intelligence);
      console.log('   Keys:', aiKeys);
    } else {
      console.log('⚠️ No AI Intelligence data provided');
    }
    
    // 1. Insert search record into competitor_searches
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
    
    // 2. Insert/Update the searched business in leads table (enriched)
    if (data.target_business.place_id && data.ai_intelligence) {
      try {
        // Parse AI intelligence data
        let aiData: any = {};
        try {
          aiData = typeof data.ai_intelligence === 'string' 
            ? JSON.parse(data.ai_intelligence) 
            : data.ai_intelligence;
        } catch (e) {
          console.log('⚠️ Could not parse AI intelligence data');
          aiData = data.ai_intelligence;
        }

        // Extract structured data from AI intelligence
        const extractedEmail = aiData.contacts?.emails?.[0] || 
                              aiData.contact?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || 
                              null;
        const extractedDomain = aiData.domain || null;
        const extractedOwner = aiData.owner?.name || 
                              aiData.owner?.names?.join(', ') ||
                              (typeof aiData.staff === 'string' ? aiData.staff?.match(/founders?[^:]*?:\s*([A-Z][a-z]+ [A-Z][a-z]+)/)?.[1] : null) || 
                              null;
        
        console.log("📧 Extracted email:", extractedEmail);
        console.log("👤 Extracted owner:", extractedOwner);
        console.log("🌐 Domain:", extractedDomain);

        // Check if already exists in leads
        const existingLead = await sql`
          SELECT id FROM leads 
          WHERE place_id = ${data.target_business.place_id}
        `;

        if (existingLead.length > 0) {
          // Update existing lead including rating and review_count
          await sql`
            UPDATE leads SET
              email = COALESCE(email, ${extractedEmail}),
              domain = COALESCE(domain, ${extractedDomain}),
              owner_name = COALESCE(owner_name, ${extractedOwner}),
              business_name = ${data.target_business.name},
              rating = COALESCE(rating, ${data.target_business.rating ? parseFloat(String(data.target_business.rating)) : null}),
              review_count = GREATEST(COALESCE(review_count, 0), ${data.target_business.review_count || data.target_business.reviews || 0}),
              street_address = COALESCE(street_address, ${data.target_business.address || data.target_business.street_address || null}),
              city = COALESCE(city, ${data.target_business.city || city}),
              state = COALESCE(state, ${data.target_business.state || state}),
              website = COALESCE(website, ${data.target_business.website || extractedDomain || null}),
              phone = COALESCE(phone, ${data.target_business.phone || null}),
              search_city = ${city},
              search_state = ${state},
              search_niche = ${data.search_term},
              source_directory = ${collection},
              additional_data = ${JSON.stringify(aiData)},
              updated_at = CURRENT_TIMESTAMP
            WHERE place_id = ${data.target_business.place_id}
          `;
          console.log('✅ Updated existing lead for searched business with rating/reviews');
        } else {
          // Insert new lead with correct column mapping
          await sql`
            INSERT INTO leads (
              place_id,
              email,
              domain,
              owner_name,
              business_name,
              rating,
              review_count,
              street_address,
              city,
              state,
              website,
              phone,
              search_city,
              search_state,
              search_niche,
              source_directory,
              additional_data,
              lead_score,
              email_enrichment_status,
              outreach_status
            ) VALUES (
              ${data.target_business.place_id},
              ${extractedEmail},
              ${extractedDomain},
              ${extractedOwner},
              ${data.target_business.name},
              ${data.target_business.rating ? parseFloat(String(data.target_business.rating)) : null},
              ${data.target_business.review_count || data.target_business.reviews || 0},
              ${data.target_business.address || data.target_business.street_address || null},
              ${data.target_business.city || city},
              ${data.target_business.state || state},
              ${data.target_business.website || extractedDomain || null},
              ${data.target_business.phone || null},
              ${city},
              ${state},
              ${data.search_term},
              ${collection},
              ${JSON.stringify(aiData)},
              100,
              'completed',
              'not_started'
            )
            ON CONFLICT (place_id) 
            DO UPDATE SET
              email = COALESCE(leads.email, EXCLUDED.email),
              domain = COALESCE(leads.domain, EXCLUDED.domain),
              owner_name = COALESCE(leads.owner_name, EXCLUDED.owner_name),
              rating = COALESCE(leads.rating, EXCLUDED.rating),
              review_count = GREATEST(leads.review_count, EXCLUDED.review_count),
              search_city = EXCLUDED.search_city,
              search_state = EXCLUDED.search_state,
              search_niche = EXCLUDED.search_niche,
              additional_data = EXCLUDED.additional_data,
              updated_at = CURRENT_TIMESTAMP
          `;
          console.log('✅ Inserted searched business into leads table with rating/reviews');
        }
        
        // Insert into lead_collections for the target business
        // First, get the lead ID
        const leadResult = await sql`
          SELECT id FROM leads WHERE place_id = ${data.target_business.place_id}
        `;
        
        if (leadResult.length > 0) {
          const leadId = leadResult[0].id;
          const normalizedCollection = normalizeCollection(data.search_term);
          
          console.log(`📁 Adding to lead_collections: ${normalizedCollection} in ${data.search_destination}`);
          
          await sql`
            INSERT INTO lead_collections (
              lead_id,
              search_collection,
              search_destination,
              search_term
            ) VALUES (
              ${leadId},
              ${normalizedCollection},
              ${data.search_destination},
              ${data.search_term}
            )
            ON CONFLICT (lead_id, search_collection, search_destination)
            DO UPDATE SET
              search_term = EXCLUDED.search_term,
              updated_at = CURRENT_TIMESTAMP
          `;
          console.log('✅ Added lead to lead_collections');
        }
      } catch (leadError) {
        console.error('⚠️ Error processing lead:', leadError);
      }
    }
    
    // 3. Insert competitors into prospects table (unenriched, deduplicated)
    let successCount = 0;
    let skipCount = 0;
    
    for (let idx = 0; idx < data.competitors.length; idx++) {
      const c = data.competitors[idx];
      
      // Skip if no place_id (can't dedupe without it)
      if (!c.place_id || !c.place_id.startsWith('Ch')) {
        console.log(`⚠️ Skipping competitor without valid place_id: ${c.name || c.business_name}`);
        skipCount++;
        continue;
      }
      
      // Skip if it's the target business itself
      if (c.place_id === data.target_business.place_id) {
        console.log(`⚠️ Skipping target business from competitors: ${c.name}`);
        continue;
      }
      
      try {
        // Insert or update in prospects table
        await sql`
          INSERT INTO prospects (
            place_id,
            business_name,
            rating,
            review_count,
            street_address,
            city,
            state,
            latitude,
            longitude,
            phone,
            website,
            search_city,
            search_state,
            search_niche,
            source_directory,
            enrichment_status
          ) VALUES (
            ${c.place_id},
            ${c.name || c.business_name},
            ${c.rating ? parseFloat(c.rating) : null},
            ${c.reviews || c.review_count || 0},
            ${c.address || c.street_address || c.formatted_address || null},
            ${c.city || city},
            ${c.state || state},
            ${c.latitude ? parseFloat(c.latitude) : null},
            ${c.longitude ? parseFloat(c.longitude) : null},
            ${c.phone || null},
            ${c.website || null},
            ${city},
            ${state},
            ${data.search_term},
            ${collection},
            'pending'
          )
          ON CONFLICT (place_id) 
          DO UPDATE SET
            rating = COALESCE(prospects.rating, EXCLUDED.rating),
            review_count = GREATEST(prospects.review_count, EXCLUDED.review_count),
            latitude = COALESCE(prospects.latitude, EXCLUDED.latitude),
            longitude = COALESCE(prospects.longitude, EXCLUDED.longitude),
            updated_at = CURRENT_TIMESTAMP
        `;
        
        // Track the relationship in junction table
        await sql`
          INSERT INTO search_prospects (
            search_id,
            prospect_place_id,
            rank,
            is_target_business
          ) VALUES (
            ${searchId},
            ${c.place_id},
            ${c.rank || idx + 1},
            ${false}
          )
          ON CONFLICT (search_id, prospect_place_id) 
          DO NOTHING
        `;
        
        successCount++;
      } catch (competitorError) {
        console.error(`❌ Error inserting competitor ${c.name}:`, competitorError);
        skipCount++;
      }
    }
    
    console.log(`✅ Inserted ${successCount} competitors into prospects table`);
    console.log(`⚠️ Skipped ${skipCount} competitors`);
    
    return {
      success: true,
      searchId: searchId,
      message: `Search stored successfully. Lead: ${data.target_business.name}, Prospects: ${successCount}`,
      stats: {
        searchId,
        leadProcessed: !!data.target_business.place_id,
        prospectsInserted: successCount,
        prospectsSkipped: skipCount
      }
    };
    
  } catch (error) {
    console.error('Error storing competitor search:', error);
    throw error;
  }
}

// Get competitor analysis by job_id with new table structure
export async function getCompetitorAnalysisByJobId(jobId: string) {
  try {
    // Get the search record
    const searches = await sql`
      SELECT * FROM competitor_searches 
      WHERE job_id = ${jobId}
    `;
    
    if (searches.length === 0) {
      return null;
    }
    
    const search = searches[0];
    
    // Get all prospects for this search from junction table
    const competitors = await sql`
      SELECT 
        p.*,
        sp.rank,
        sp.is_target_business
      FROM search_prospects sp
      JOIN prospects p ON p.place_id = sp.prospect_place_id
      WHERE sp.search_id = ${search.id}
      ORDER BY sp.rank ASC
    `;
    
    // Get the lead data if it exists
    let leadData = null;
    if (search.target_business_place_id) {
      const leads = await sql`
        SELECT * FROM leads 
        WHERE place_id = ${search.target_business_place_id}
      `;
      if (leads.length > 0) {
        leadData = leads[0];
      }
    }
    
    return {
      search,
      competitors,
      lead: leadData
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
        COUNT(sp.prospect_place_id) as competitor_count
      FROM competitor_searches cs
      LEFT JOIN search_prospects sp ON sp.search_id = cs.id
      WHERE LOWER(cs.search_term) = LOWER(${searchTerm})
      GROUP BY cs.id
      ORDER BY cs.created_at DESC
    `;
  } catch (error) {
    console.error('Error fetching searches by term:', error);
    throw error;
  }
}

// Get prospect by place_id across all searches
export async function getProspectByPlaceId(placeId: string) {
  try {
    return await sql`
      SELECT 
        p.*,
        cs.search_term,
        cs.search_destination,
        cs.created_at as search_date,
        sp.rank
      FROM prospects p
      JOIN search_prospects sp ON sp.prospect_place_id = p.place_id
      JOIN competitor_searches cs ON cs.id = sp.search_id
      WHERE p.place_id = ${placeId}
      ORDER BY cs.created_at DESC
    `;
  } catch (error) {
    console.error('Error fetching prospect by place_id:', error);
    throw error;
  }
}

// Export other functions for compatibility
export { 
  getProspectByPlaceId as getCompetitorByPlaceId,
  formatCollection 
};