import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string; name?: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = params.id || searchParams.get('id');
    const name = searchParams.get('name');
    const niche = searchParams.get('niche') || 'med spas';
    const city = searchParams.get('city') || 'Austin';

    const client = await pool.connect();

    try {
      // Load business data from database
      let query = '';
      let queryParams: any[] = [];

      if (id) {
        query = `
          SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count,
                 city, state, website, phone, street_address, email, email_type,
                 owner_name, medical_director_name, search_niche, lead_score,
                 pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                 is_expanding, is_hiring, founded_year
          FROM leads
          WHERE id = $1
        `;
        queryParams = [id];
      } else if (name) {
        if (city) {
          query = `
            SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count,
                   city, state, website, phone, street_address, email, email_type,
                   owner_name, medical_director_name, search_niche, lead_score,
                   pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                   is_expanding, is_hiring, founded_year
            FROM leads
            WHERE business_name ILIKE $1 AND city ILIKE $2
            ORDER BY review_count DESC NULLS LAST
            LIMIT 1
          `;
          queryParams = [`%${name}%`, `%${city}%`];
        } else {
          query = `
            SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count,
                   city, state, website, phone, street_address, email, email_type,
                   owner_name, medical_director_name, search_niche, lead_score,
                   pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                   is_expanding, is_hiring, founded_year
            FROM leads
            WHERE business_name ILIKE $1
            ORDER BY review_count DESC NULLS LAST
            LIMIT 1
          `;
          queryParams = [`%${name}%`];
        }
      }

      const result = await client.query(query, queryParams);
      const businessData = result.rows[0];

      if (!businessData) {
        return NextResponse.json({
          error: 'Business not found',
          business: getDemoBusiness()
        });
      }

      // Get competitor data
      const competitors = await getCompetitorData(client, niche, city, businessData.state, businessData.id, businessData.business_name);

      // Get market intelligence
      const marketIntel = await getMarketIntelligence(client, city, businessData.state, niche);

      // Calculate analysis results
      const analysis = await performCompetitiveAnalysis(businessData, competitors);

      // Format response similar to Python backend
      const response = {
        business: {
          name: businessData.business_name,
          rating: parseFloat(businessData.rating) || null,
          reviewCount: businessData.review_count || 0,
          city: businessData.city,
          state: businessData.state,
          niche: niche,
          website: businessData.website,
          phone: businessData.phone,
          address: businessData.street_address,
          ownerName: businessData.owner_name,
          medicalDirector: businessData.medical_director_name,
          leadScore: businessData.lead_score,
          socialMedia: {
            instagram: businessData.instagram_handle,
            facebook: businessData.facebook_handle,
          },
          pricing: {
            botox: businessData.pricing_botox,
            filler: businessData.pricing_filler,
          },
          businessIntel: {
            isExpanding: businessData.is_expanding,
            isHiring: businessData.is_hiring,
            foundedYear: businessData.founded_year,
          }
        },
        analysis: {
          currentRank: analysis.currentRanking,
          potentialTraffic: analysis.potentialTraffic,
          lostRevenue: analysis.lostRevenue,
          reviewDeficit: analysis.reviewDeficit,
          competitorsAvgReviews: analysis.avgReviews,
          painPoints: analysis.painPoints,
          competitors: analysis.competitors,
          competitorLocations: [],
          solutions: analysis.solutions,
          timeline: analysis.timeline,
          urgency: analysis.urgency,
          actionPlan: analysis.actionPlan,
          marketIntel: marketIntel,
          businessPercentile: await getBusinessPercentile(client, businessData.business_name, city, businessData.state)
        },
        pitch: {
          urgency: `Get ahead of competitors in ${city}`,
          valueProposition: `Rank #1 in Google Maps for "${niche}" in ${city}`,
          socialProof: `${competitors.length} competitors analyzed`,
        }
      };

      return NextResponse.json(response);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getCompetitorData(client: any, niche: string, city: string, state: string | null, excludeId: string | null, excludeName: string | null) {
  let whereClauses = [
    "search_niche = $1",
    "city ILIKE $2",
    "local_pack_rank BETWEEN 1 AND 3"
  ];
  let params = [niche, `%${city}%`];
  let paramIndex = 3;

  if (state) {
    whereClauses.push("state = $" + paramIndex);
    params.push(state);
    paramIndex++;
  }

  if (excludeId) {
    whereClauses.push("id <> $" + paramIndex);
    params.push(excludeId);
    paramIndex++;
  } else if (excludeName) {
    whereClauses.push("business_name <> $" + paramIndex);
    params.push(excludeName);
    paramIndex++;
  }

  const query = `
    SELECT
        id, business_name, local_pack_rank, rating, review_count::int AS review_count,
        city, state, website, phone, street_address
    FROM leads
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY local_pack_rank ASC
    LIMIT 3
  `;

  const result = await client.query(query, params);

  return result.rows.map((row: any) => ({
    id: row.id,
    business_name: row.business_name,
    rating: parseFloat(row.rating) || null,
    review_count: row.review_count || 0,
    city: row.city,
    state: row.state,
    website: row.website,
    phone: row.phone,
    street_address: row.street_address,
    local_pack_rank: row.local_pack_rank
  }));
}

async function getMarketIntelligence(client: any, city: string, state: string, niche: string) {
  const query = `
    SELECT
        COUNT(*) as total_businesses,
        AVG(rating) as avg_rating,
        AVG(review_count) as avg_reviews,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY review_count) as median_reviews,
        COUNT(CASE WHEN local_pack_rank <= 3 THEN 1 END) as top_3_count
    FROM leads
    WHERE city = $1 AND state = $2
    AND (search_niche ILIKE $3 OR search_niche IS NULL)
  `;

  const result = await client.query(query, [city, state, `%${niche}%`]);
  const row = result.rows[0];

  return {
    market_summary: {
      total_businesses: parseInt(row.total_businesses) || 0,
      avg_rating: parseFloat(row.avg_rating) || 0,
      avg_reviews: parseInt(row.avg_reviews) || 0,
      median_reviews: parseInt(row.median_reviews) || 0,
      top_3_count: parseInt(row.top_3_count) || 0
    }
  };
}

async function performCompetitiveAnalysis(businessData: any, competitors: any[]) {
  const avgReviews = competitors.length > 0
    ? competitors.reduce((sum, comp) => sum + (comp.review_count || 0), 0) / competitors.length
    : 0;

  const reviewDeficit = Math.max(0, Math.floor(avgReviews - (businessData.review_count || 0)));
  const currentRanking = businessData.local_pack_rank || 7;

  return {
    currentRanking,
    potentialTraffic: currentRanking > 3 ? 10000 : 0,
    lostRevenue: currentRanking > 3 ? 50000 : 0,
    reviewDeficit,
    avgReviews: Math.floor(avgReviews),
    painPoints: [
      { issue: 'Low Map Pack visibility', severity: 'high', impact: 'Competitors outrank you in Maps' },
      { issue: 'Review deficit vs. leaders', severity: 'high', impact: 'Fewer clicks and calls' }
    ],
    competitors: competitors.map(comp => ({
      name: comp.business_name,
      rank: comp.local_pack_rank || 0,
      reviews: comp.review_count || 0,
      rating: comp.rating || 0
    })),
    solutions: [
      'Implement review collection system',
      'Optimize Google Business Profile',
      'Build location-specific content'
    ],
    timeline: '90 days to #1',
    urgency: 'high',
    actionPlan: [
      'Week 1-2: Review collection setup',
      'Week 3-4: GBP optimization',
      'Week 5-12: Content and technical SEO'
    ]
  };
}

async function getBusinessPercentile(client: any, businessName: string, city: string, state: string) {
  const query = `
    SELECT
        PERCENT_RANK() OVER (ORDER BY review_count) as review_percentile,
        PERCENT_RANK() OVER (ORDER BY rating) as rating_percentile
    FROM leads
    WHERE business_name = $1 AND city = $2 AND state = $3
  `;

  const result = await client.query(query, [businessName, city, state]);
  const row = result.rows[0];

  return {
    review_percentile: row ? Math.round((row.review_percentile || 0) * 100) : 0,
    rating_percentile: row ? Math.round((row.rating_percentile || 0) * 100) : 0
  };
}

function getDemoBusiness() {
  return {
    business_name: 'Average Med Spa',
    rating: 4.2,
    review_count: 85,
    city: 'Austin',
    website: 'averagemedspa.com',
    phone: '512-555-0100'
  };
}
