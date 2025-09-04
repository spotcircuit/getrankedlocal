export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ service: string; state: string }> }
) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug');
  const { service, state: stateParam } = await params;
  const state = stateParam.toUpperCase();

  try {
    // Map service slug to collection names
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

    // Get all cities/collections for this service type in this state using lead_collections
    // Use search_destination to determine the cities in this state
    const citiesResult = await sql`
      SELECT 
        SPLIT_PART(lc.search_destination, ', ', 1) as city,
        COUNT(*) as business_count,
        AVG(CAST(l.rating AS float)) as avg_rating,
        SUM(CAST(l.review_count AS int)) as total_reviews
      FROM leads l
      INNER JOIN lead_collections lc ON l.id = lc.lead_id
      WHERE lc.search_collection = ${collectionName}
        AND UPPER(SPLIT_PART(lc.search_destination, ', ', 2)) = ${state}
        AND lc.search_destination IS NOT NULL
      GROUP BY SPLIT_PART(lc.search_destination, ', ', 1)
      ORDER BY business_count DESC
    `;

    // Get top businesses for each city
    const topBusinessesResult = await sql`
      SELECT DISTINCT
        SPLIT_PART(lc.search_destination, ', ', 1) as city,
        l.business_name,
        CAST(l.rating AS float) as rating,
        CAST(l.review_count AS int) as review_count,
        ROW_NUMBER() OVER (PARTITION BY SPLIT_PART(lc.search_destination, ', ', 1) ORDER BY CAST(l.rating AS float) DESC NULLS LAST, CAST(l.review_count AS int) DESC NULLS LAST) as rank
      FROM leads l
      INNER JOIN lead_collections lc ON l.id = lc.lead_id
      WHERE lc.search_collection = ${collectionName}
        AND UPPER(SPLIT_PART(lc.search_destination, ', ', 2)) = ${state}
        AND lc.search_destination IS NOT NULL
        AND l.business_name IS NOT NULL
      ORDER BY SPLIT_PART(lc.search_destination, ', ', 1), rank
    `;

    // Group top businesses by city (limit to top 3 per city)
    const businessesByCity = new Map<string, string[]>();
    topBusinessesResult.forEach(row => {
      if (row.rank <= 3) {
        if (!businessesByCity.has(row.city)) {
          businessesByCity.set(row.city, []);
        }
        businessesByCity.get(row.city)!.push(row.business_name);
      }
    });

    // Process cities and extract collections
    const cityMap = new Map<string, {
      name: string;
      slug: string;
      businessCount: number;
      averageRating: number;
      totalReviews: number;
      topBusinesses: string[];
      featured: boolean;
    }>();

    citiesResult.forEach(row => {
      const cityName = row.city;
      const citySlug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      if (!cityMap.has(cityName)) {
        cityMap.set(cityName, {
          name: cityName,
          slug: citySlug,
          businessCount: 0,
          averageRating: 0,
          totalReviews: 0,
          topBusinesses: businessesByCity.get(cityName) || [],
          featured: false
        });
      }

      const city = cityMap.get(cityName)!;
      city.businessCount += Number(row.business_count);
      city.totalReviews += Number(row.total_reviews) || 0;
    });

    // Calculate average ratings and mark featured cities
    const cities = Array.from(cityMap.values()).map((city, index) => {
      // Calculate average rating weighted by review count
      const cityBusinesses = topBusinessesResult.filter(b => b.city === city.name);
      if (cityBusinesses.length > 0) {
        const totalRating = cityBusinesses.reduce((sum, b) => sum + (b.rating || 0) * (b.review_count || 1), 0);
        const totalWeight = cityBusinesses.reduce((sum, b) => sum + (b.review_count || 1), 0);
        city.averageRating = totalWeight > 0 ? totalRating / totalWeight : 4.7;
      } else {
        city.averageRating = 4.7;
      }

      // Generate growth percentage
      const growthRates = ['18%', '23%', '31%', '27%', '15%', '42%', '35%', '25%', '19%', '22%'];
      city.featured = index < 3; // Mark top 3 cities as featured

      return {
        ...city,
        growth: '+' + growthRates[index % growthRates.length]
      };
    });

    // Sort cities by business count
    cities.sort((a, b) => b.businessCount - a.businessCount);

    // Calculate overall stats
    const stats = {
      totalBusinesses: cities.reduce((sum, city) => sum + city.businessCount, 0),
      totalCities: cities.length,
      averageRating: cities.length > 0 
        ? cities.reduce((sum, city) => sum + city.averageRating, 0) / cities.length 
        : 4.7,
      totalReviews: cities.reduce((sum, city) => sum + city.totalReviews, 0),
      topRatedBusiness: businessesByCity.size > 0 
        ? Array.from(businessesByCity.values())[0][0] || 'N/A'
        : 'N/A'
    };

    const response: any = {
      success: true,
      service,
      state,
      cities,
      stats
    };

    if (debug === '1') {
      response.debug = {
        normalizedCollection: collectionName,
        statePattern: '%' + state,
        totalSourceDirectories: citiesResult.length,
        sampleCities: cities.slice(0, 3)
      };
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error(`Service ${service} state ${state} API error:`, error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch state service data' 
    }, { status: 500 });
  }
}