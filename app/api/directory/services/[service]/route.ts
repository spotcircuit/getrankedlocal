export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ service: string }> }
) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug');
  const { service } = await params;

  try {
    // Map service slug to collection names in lead_collections
    // Handle both URL formats (medical-spas) and DB formats (medspas)
    const serviceMapping: Record<string, string> = {
      'medical-spas': 'medspas',
      'medspas': 'medspas',
      'plumbers': 'plumber',
      'plumber': 'plumber',
      'dental-practices': 'dentist',
      'dentist': 'dentist',
      'law-firms': 'lawyer',
      'lawyer': 'lawyer',
      'marketing-agencies': 'marketing-agencies',
      'home-services': 'contractor',
      'contractor': 'contractor',
      'wellness-centers': 'wellness',
      'wellness': 'wellness',
      'aesthetic-clinics': 'aesthetic',
      'aesthetic': 'aesthetic',
      'health-clinics': 'health',
      'health': 'health',
      'roofing': 'roofing',
      'hair-salons': 'hair-salons',
      'mexican-restaurants': 'mexican-restaurants',
      'seo-services': 'seo-services',
      'dumpster-rental': 'dumpster-rental',
      'waste-removal': 'waste-removal'
    };

    const collectionName = serviceMapping[service] || service;

    // Get states that have businesses in this service collection
    // Use search_destination from lead_collections to determine state
    const statesResult = await sql`
      SELECT 
        SPLIT_PART(lc.search_destination, ', ', 2) as state,
        COUNT(DISTINCT l.id) as business_count,
        AVG(CAST(l.rating AS float)) as avg_rating,
        SUM(CAST(l.review_count AS int)) as total_reviews
      FROM leads l
      INNER JOIN lead_collections lc ON l.id = lc.lead_id
      WHERE lc.search_collection = ${collectionName}
        AND lc.search_destination IS NOT NULL
        AND lc.search_destination LIKE '%, %'
      GROUP BY SPLIT_PART(lc.search_destination, ', ', 2)
      HAVING COUNT(DISTINCT l.id) > 0
      ORDER BY business_count DESC
    `;

    // Get top cities for each state in this service collection
    // Use search_destination to determine state and city
    const topCitiesResult = await sql`
      SELECT 
        SPLIT_PART(lc.search_destination, ', ', 2) as state,
        SPLIT_PART(lc.search_destination, ', ', 1) as city,
        COUNT(DISTINCT l.id) as city_business_count
      FROM leads l
      INNER JOIN lead_collections lc ON l.id = lc.lead_id
      WHERE lc.search_collection = ${collectionName}
        AND lc.search_destination IS NOT NULL
        AND lc.search_destination LIKE '%, %'
      GROUP BY lc.search_destination
      ORDER BY SPLIT_PART(lc.search_destination, ', ', 2), city_business_count DESC
    `;

    // Group cities by state
    const citiesByState = new Map<string, string[]>();
    topCitiesResult.forEach(row => {
      if (!citiesByState.has(row.state)) {
        citiesByState.set(row.state, []);
      }
      const cities = citiesByState.get(row.state)!;
      if (cities.length < 3) {
        cities.push(row.city);
      }
    });

    // State names mapping
    const stateNames: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming'
    };

    // Format states data
    const states = statesResult.map(row => {
      const growthRates = ['18%', '23%', '31%', '27%', '15%', '42%', '35%', '52%'];
      const randomGrowth = '+' + growthRates[Math.floor(Math.random() * growthRates.length)];
      
      return {
        code: row.state,
        name: stateNames[row.state] || row.state,
        businessCount: Number(row.business_count),
        averageRating: Number(row.avg_rating) || 4.7,
        totalReviews: Number(row.total_reviews) || 0,
        topCities: citiesByState.get(row.state) || [],
        growth: randomGrowth,
        featured: ['TX', 'CA', 'FL', 'NY'].includes(row.state)
      };
    });

    // Calculate overall stats
    const stats = {
      totalBusinesses: states.reduce((sum, state) => sum + state.businessCount, 0),
      totalStates: states.length,
      totalCities: Array.from(citiesByState.values()).flat().length,
      averageRating: states.reduce((sum, state) => sum + state.averageRating, 0) / (states.length || 1),
      totalReviews: states.reduce((sum, state) => sum + state.totalReviews, 0)
    };

    const response: any = {
      success: true,
      service,
      states,
      stats
    };

    if (debug === '1') {
      response.debug = {
        normalizedCollection: collectionName,
        sampleStates: statesResult.slice(0, 5),
        topCitiesCount: topCitiesResult.length
      };
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error(`Service ${service} API error:`, error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch service data' 
    }, { status: 500 });
  }
}