export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ service: string; state: string; city: string }> }
) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug');
  const { service, state: stateParam, city: cityParam } = await params;
  const state = stateParam.toUpperCase();
  const city = cityParam.replace(/-/g, ' ');

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
    
    // Normalize collection name to match what's stored
    const normalizedCollection = collectionName.replace(/_/g, '-');

    // Get businesses from BOTH leads (promoted) and prospects (not promoted yet)
    // This ensures we show all businesses found in searches
    const businessesResult = await sql`
      WITH combined_businesses AS (
        -- Get promoted leads from lead_collections
        SELECT 
          CAST(l.id AS VARCHAR) as id,
          l.place_id,
          l.business_name,
          l.street_address,
          l.city,
          l.state,
          l.phone,
          l.website,
          l.email,
          l.owner_name,
          CAST(l.rating AS float) as rating,
          CAST(l.review_count AS int) as review_count,
          l.latitude,
          l.longitude,
          l.additional_data,
          'lead' as business_type,
          1 as priority
        FROM leads l
        INNER JOIN lead_collections lc ON l.id = lc.lead_id
        WHERE lc.search_collection = ${normalizedCollection}
          AND UPPER(SPLIT_PART(lc.search_destination, ', ', 2)) = ${state}
          AND LOWER(SPLIT_PART(lc.search_destination, ', ', 1)) = LOWER(${city})
          AND l.business_name IS NOT NULL
        
        UNION ALL
        
        -- Get prospects that haven't been promoted yet
        SELECT 
          p.place_id as id,  -- prospects use place_id as primary key
          p.place_id,
          p.business_name,
          p.street_address,
          p.city,
          p.state,
          p.phone,
          p.website,
          p.email,
          p.owner_name,
          CAST(p.rating AS float) as rating,
          CAST(p.review_count AS int) as review_count,
          p.latitude,
          p.longitude,
          p.additional_data,
          'prospect' as business_type,
          2 as priority
        FROM prospects p
        WHERE (
            -- Match normalized collection name - handle various formats
            p.search_niche = ${normalizedCollection.replace(/-/g, ' ')}  -- "hair-salons" -> "hair salons"
            OR p.search_niche = ${normalizedCollection}  -- exact match
            OR p.search_niche = ${normalizedCollection === 'medspas' ? 'med spas' : normalizedCollection}  -- special case for medspas
            OR p.source_directory LIKE ${normalizedCollection.replace(/-/g, '_') + '%'}
          )
          AND LOWER(p.search_city) = LOWER(${city})
          AND p.search_state = ${state}
          AND p.business_name IS NOT NULL
          AND p.enrichment_status != 'promoted'
          -- Exclude if already in leads
          AND NOT EXISTS (
            SELECT 1 FROM leads l WHERE l.place_id = p.place_id
          )
      )
      SELECT * FROM combined_businesses
      ORDER BY 
        priority,  -- Show leads first
        rating DESC NULLS LAST,
        review_count DESC NULLS LAST
      LIMIT 100
    `;

    // Process businesses and extract top performers
    const businesses = businessesResult.map((business, index) => ({
      id: business.id,
      placeId: business.place_id,
      name: business.business_name,
      rank: index + 1,
      address: business.street_address,
      city: business.city,
      state: business.state,
      zipCode: business.zip_code || '',
      phone: business.phone,
      website: business.website,
      email: business.email,
      ownerName: business.owner_name,
      rating: business.rating || 0,
      reviewCount: business.review_count || 0,
      latitude: business.latitude,
      longitude: business.longitude,
      featured: index < 3, // Top 3 are featured
      verified: !!business.email, // Verified if we have email
      category: service.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      businessType: business.business_type, // 'lead' or 'prospect'
      isProspect: business.business_type === 'prospect'
    }));

    // Calculate city stats
    const totalBusinesses = businesses.length;
    const averageRating = businesses.length > 0
      ? businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length
      : 4.5;
    const totalReviews = businesses.reduce((sum, b) => sum + (b.reviewCount || 0), 0);

    // Get top performers
    const topBusinesses = businesses.slice(0, 5).map(b => ({
      name: b.name,
      rating: b.rating,
      reviewCount: b.reviewCount,
      rank: b.rank
    }));

    // Get category breakdown (mock data for now - could be enhanced)
    const categories = [
      { name: 'Premium Services', count: Math.floor(totalBusinesses * 0.3) },
      { name: 'Standard Services', count: Math.floor(totalBusinesses * 0.5) },
      { name: 'Budget-Friendly', count: Math.floor(totalBusinesses * 0.2) }
    ];

    // Create response
    const response: any = {
      success: true,
      service,
      state,
      city: city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      businesses,
      stats: {
        totalBusinesses,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        topBusinesses,
        categories,
        lastUpdated: new Date().toISOString()
      },
      meta: {
        title: `${businesses[0]?.category || 'Services'} in ${city}, ${state}`,
        description: `Find the best ${service.replace(/-/g, ' ')} in ${city}, ${state}. Compare ${totalBusinesses} verified businesses with ${totalReviews} reviews.`,
        keywords: [service, city, state, 'near me', 'best', 'top rated'].join(', ')
      }
    };

    if (debug === '1') {
      response.debug = {
        normalizedCollection,
        queryCity: city,
        queryState: state,
        totalFound: businessesResult.length,
        sampleBusinesses: businesses.slice(0, 3)
      };
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error(`Service ${service} city ${city}, ${state} API error:`, error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch city service data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}