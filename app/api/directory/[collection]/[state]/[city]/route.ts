import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; state: string; city: string }> }
) {
  try {
    const { collection, state, city } = await params;
    
    // Decode URL parameters
    const decodedCollection = decodeURIComponent(collection);
    const decodedState = decodeURIComponent(state).toUpperCase();
    const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');
    
    // Construct search destination (e.g., "Ashburn, VA")
    const searchDestination = `${decodedCity}, ${decodedState}`;
    
    console.log('📁 Fetching directory:', {
      collection: decodedCollection,
      state: decodedState,
      city: decodedCity,
      searchDestination
    });
    
    // Get all leads for this collection and destination
    const leads = await sql`
      SELECT DISTINCT
        l.*,
        lc.search_collection,
        lc.search_destination,
        lc.search_term
      FROM lead_collections lc
      JOIN leads l ON l.id = lc.lead_id
      WHERE lc.search_collection = ${decodedCollection}
        AND lc.search_destination = ${searchDestination}
      ORDER BY l.rating DESC NULLS LAST, l.review_count DESC NULLS LAST
    `;
    
    // Get collection statistics
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT lc.lead_id) as total_businesses,
        COUNT(DISTINCT lc.search_destination) as total_locations,
        AVG(l.rating) as avg_rating,
        SUM(l.review_count) as total_reviews
      FROM lead_collections lc
      JOIN leads l ON l.id = lc.lead_id
      WHERE lc.search_collection = ${decodedCollection}
    `;
    
    // Get nearby cities with the same collection
    const nearbyCities = await sql`
      SELECT DISTINCT
        lc.search_destination,
        COUNT(DISTINCT lc.lead_id) as business_count
      FROM lead_collections lc
      WHERE lc.search_collection = ${decodedCollection}
        AND lc.search_destination != ${searchDestination}
      GROUP BY lc.search_destination
      ORDER BY business_count DESC
      LIMIT 10
    `;
    
    return NextResponse.json({
      success: true,
      data: {
        collection: decodedCollection,
        location: {
          city: decodedCity,
          state: decodedState,
          full: searchDestination
        },
        stats: stats[0],
        leads,
        nearbyCities: nearbyCities.map(city => ({
          destination: city.search_destination,
          count: city.business_count
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching directory data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch directory data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}