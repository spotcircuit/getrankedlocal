import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, city, state, place_id } = body;

    // Validate required fields
    if (!business_name || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name, city, state' },
        { status: 400 }
      );
    }

    // Clean business name (remove address if present)
    const cleanBusinessName = business_name.split(',')[0].trim();
    
    console.log('🔍 Checking for existing searches:', {
      business_name: cleanBusinessName,
      city,
      state,
      place_id
    });

    // Check for existing searches by place_id (most accurate) or business name
    let existingSearches;
    
    if (place_id) {
      // Check by place_id first (most accurate)
      existingSearches = await sql`
        SELECT 
          cs.*,
          COUNT(sp.prospect_place_id) as competitor_count,
          l.email as lead_email,
          l.domain as lead_domain,
          l.owner_name as lead_owner,
          l.additional_data as lead_data
        FROM competitor_searches cs
        LEFT JOIN search_prospects sp ON sp.search_id = cs.id
        LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
        WHERE cs.target_business_place_id = ${place_id}
        GROUP BY cs.id, l.email, l.domain, l.owner_name, l.additional_data
        ORDER BY cs.created_at DESC
      `;
    } else {
      // Fallback to name and location matching
      existingSearches = await sql`
        SELECT 
          cs.*,
          COUNT(sp.prospect_place_id) as competitor_count,
          l.email as lead_email,
          l.domain as lead_domain,
          l.owner_name as lead_owner,
          l.additional_data as lead_data
        FROM competitor_searches cs
        LEFT JOIN search_prospects sp ON sp.search_id = cs.id
        LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
        WHERE LOWER(cs.target_business_name) = LOWER(${cleanBusinessName})
          AND cs.search_destination = ${`${city}, ${state}`}
        GROUP BY cs.id, l.email, l.domain, l.owner_name, l.additional_data
        ORDER BY cs.created_at DESC
      `;
    }

    if (existingSearches.length === 0) {
      console.log('❌ No existing searches found');
      return NextResponse.json({
        found: false,
        message: 'No existing searches found for this business'
      });
    }

    console.log(`✅ Found ${existingSearches.length} existing searches`);
    console.log('Search details:', existingSearches.map(s => ({
      id: s.id,
      term: s.search_term,
      date: s.created_at,
      competitors: s.competitor_count
    })));

    // Get unique search terms used, filtering out inappropriate ones for hair businesses
    let uniqueSearchTerms = Array.from(new Set(existingSearches.map(s => s.search_term)));
    
    // If this is a hair/salon business, filter out med spa keywords
    const businessNameLower = cleanBusinessName.toLowerCase();
    if (businessNameLower.includes('hair') || businessNameLower.includes('salon') || businessNameLower.includes('barber')) {
      uniqueSearchTerms = uniqueSearchTerms.filter(term => {
        const termLower = term.toLowerCase();
        return !termLower.includes('med spa') && !termLower.includes('medical spa');
      });
    }
    
    // Get the most recent search with the most data
    const bestSearch = existingSearches.reduce((best, current) => {
      // Prioritize searches with email data
      if (current.lead_email && !best.lead_email) return current;
      if (!current.lead_email && best.lead_email) return best;
      
      // Then by competitor count
      if (current.competitor_count > best.competitor_count) return current;
      if (current.competitor_count < best.competitor_count) return best;
      
      // Finally by recency
      return new Date(current.created_at) > new Date(best.created_at) ? current : best;
    }, existingSearches[0]);

    // Get the target business details from prospects or leads table
    let targetBusinessDetails = null;
    if (bestSearch.target_business_place_id) {
      // First check if it's in search_prospects as the target business
      const targetFromSearch = await sql`
        SELECT 
          p.*,
          sp.rank
        FROM search_prospects sp
        JOIN prospects p ON p.place_id = sp.prospect_place_id
        WHERE sp.search_id = ${bestSearch.id}
          AND sp.is_target_business = true
        LIMIT 1
      `;
      
      if (targetFromSearch.length > 0) {
        targetBusinessDetails = targetFromSearch[0];
        console.log('📊 Found target business in search_prospects table:', {
          name: targetBusinessDetails.business_name,
          rating: targetBusinessDetails.rating,
          review_count: targetBusinessDetails.review_count
        });
      } else {
        // Try leads table (has more enriched data)
        const leadResult = await sql`
          SELECT 
            business_name,
            rating,
            review_count,
            website,
            phone,
            street_address,
            city,
            state
          FROM leads
          WHERE place_id = ${bestSearch.target_business_place_id}
          LIMIT 1
        `;
        
        if (leadResult.length > 0) {
          targetBusinessDetails = leadResult[0];
          console.log('📊 Found target business in leads table:', {
            name: targetBusinessDetails.business_name,
            rating: targetBusinessDetails.rating,
            review_count: targetBusinessDetails.review_count
          });
        } else {
          // Fall back to prospects table
          const prospectResult = await sql`
            SELECT 
              business_name,
              rating,
              review_count,
              website,
              phone,
              street_address,
              city,
              state
            FROM prospects
            WHERE place_id = ${bestSearch.target_business_place_id}
            LIMIT 1
          `;
          
          if (prospectResult.length > 0) {
            targetBusinessDetails = prospectResult[0];
            console.log('📊 Found target business in prospects table:', {
              name: targetBusinessDetails.business_name,
              rating: targetBusinessDetails.rating,
              review_count: targetBusinessDetails.review_count
            });
          } else {
            console.log('⚠️ Target business not found in any table for place_id:', bestSearch.target_business_place_id);
          }
        }
      }
    }

    // Get competitors for the best search (limited sample for display)
    const competitors = await sql`
      SELECT 
        p.*,
        sp.rank
      FROM search_prospects sp
      JOIN prospects p ON p.place_id = sp.prospect_place_id
      WHERE sp.search_id = ${bestSearch.id}
        AND sp.is_target_business = false
      ORDER BY sp.rank ASC
      LIMIT 20
    `;
    
    // Get the actual total count of unique competitors across all searches
    let totalCompetitorCount = 0;
    try {
      const countResult = await sql`
        SELECT COUNT(DISTINCT sp.prospect_place_id) as total
        FROM search_prospects sp
        JOIN competitor_searches cs ON cs.id = sp.search_id
        WHERE LOWER(cs.target_business_name) = LOWER(${cleanBusinessName})
          AND cs.search_destination = ${`${city}, ${state}`}
          AND sp.is_target_business = false
      `;
      totalCompetitorCount = parseInt(countResult[0]?.total || '0');
      console.log(`📊 Total unique competitors across all searches: ${totalCompetitorCount}`);
    } catch (countError) {
      console.log('Could not get total competitor count:', countError);
      // Fallback to the count from the best search
      totalCompetitorCount = bestSearch.competitor_count || 0;
      console.log(`📊 Using fallback competitor count from best search: ${totalCompetitorCount}`);
    }

    // Parse AI intelligence if available
    let aiIntelligence = null;
    if (bestSearch.ai_intelligence) {
      try {
        aiIntelligence = typeof bestSearch.ai_intelligence === 'string' 
          ? JSON.parse(bestSearch.ai_intelligence)
          : bestSearch.ai_intelligence;
      } catch (e) {
        console.log('Could not parse AI intelligence');
      }
    }

    // Log the business data we're about to send
    console.log('📤 Business data being sent in response:', {
      name: bestSearch.target_business_name,
      place_id: bestSearch.target_business_place_id,
      rating: targetBusinessDetails?.rating || 0,
      review_count: targetBusinessDetails?.review_count || 0,
      targetBusinessDetails: targetBusinessDetails
    });

    const response = {
      found: true,
      searches: existingSearches.map(s => ({
        id: s.id,
        job_id: s.job_id,
        search_term: s.search_term,
        created_at: s.created_at,
        competitor_count: s.competitor_count,
        has_email: !!s.lead_email,
        has_owner: !!s.lead_owner
      })),
      bestResult: {
        search_id: bestSearch.id,
        job_id: bestSearch.job_id,
        search_term: bestSearch.search_term,
        created_at: bestSearch.created_at,
        business: {
          name: bestSearch.target_business_name,
          place_id: bestSearch.target_business_place_id,
          rank: bestSearch.target_business_rank,
          rating: targetBusinessDetails?.rating || 0,
          review_count: targetBusinessDetails?.review_count || 0,
          website: targetBusinessDetails?.website || bestSearch.lead_domain,
          phone: targetBusinessDetails?.phone,
          address: targetBusinessDetails?.street_address,
          city: targetBusinessDetails?.city,
          state: targetBusinessDetails?.state,
          email: bestSearch.lead_email,
          domain: bestSearch.lead_domain,
          owner: bestSearch.lead_owner,
          ai_intelligence: aiIntelligence
        },
        competitors: competitors,
        market_analysis: bestSearch.market_analysis
      },
      searchTermsUsed: uniqueSearchTerms,
      totalCompetitorCount: totalCompetitorCount,
      uniqueSearchCount: existingSearches.length,
      message: `Found ${existingSearches.length} previous searches for this business`
    };
    
    console.log('📤 Sending response:', {
      uniqueSearchCount: response.uniqueSearchCount,
      totalCompetitorCount: response.totalCompetitorCount,
      searchTermsUsed: response.searchTermsUsed,
      searchesFound: existingSearches.length
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking existing searches:', error);
    return NextResponse.json(
      { error: 'Failed to check existing searches' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve a specific search by job_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      );
    }

    const search = await sql`
      SELECT 
        cs.*,
        l.email as lead_email,
        l.domain as lead_domain,
        l.owner_name as lead_owner,
        l.additional_data as lead_data
      FROM competitor_searches cs
      LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
      WHERE cs.job_id = ${jobId}
    `;

    if (search.length === 0) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      );
    }

    // Get competitors
    const competitors = await sql`
      SELECT 
        p.*,
        sp.rank
      FROM search_prospects sp
      JOIN prospects p ON p.place_id = sp.prospect_place_id
      WHERE sp.search_id = ${search[0].id}
      ORDER BY sp.rank ASC
    `;

    return NextResponse.json({
      success: true,
      data: {
        ...search[0],
        competitors
      }
    });

  } catch (error) {
    console.error('Error retrieving search:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve search' },
      { status: 500 }
    );
  }
}