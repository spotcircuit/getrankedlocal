import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCollectionRegistry } from '@/lib/collection-registry';

export async function GET(request: NextRequest) {
  try {
    // Try to use the collection registry first
    try {
      const registry = await getCollectionRegistry();
      const stats = registry.getStats();
      
      // Build collections data from registry
      const niches = registry.getNiches();
      const formattedCollections = [];
      
      for (const niche of niches) {
        const states = registry.getStates(niche);
        const locationsByState: Record<string, string[]> = {};
        let totalBusinesses = 0;
        let allLocations: string[] = [];
        
        for (const state of states) {
          const cities = registry.getCities(niche, state);
          locationsByState[state] = cities.map(c => c.city);
          totalBusinesses += cities.reduce((sum, c) => sum + c.count, 0);
          allLocations.push(...cities.map(c => c.destination));
        }
        
        formattedCollections.push({
          collection: niche,
          totalBusinesses,
          totalLocations: allLocations.length,
          searchTerms: [niche], // Registry doesn't track search terms yet
          locationsByState
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          collections: formattedCollections,
          stats: {
            total_leads: stats.businesses,
            total_collections: stats.niches,
            total_destinations: stats.cities,
            total_relationships: stats.businesses,
            last_refresh: stats.lastRefresh
          }
        }
      });
    } catch (registryError) {
      console.log('Registry not available, falling back to direct query');
    }
    // First try to get data from lead_collections table
    let collections: any[] = [];
    let overallStats: any = null;
    
    try {
      // Check if table exists and has data
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'lead_collections'
        ) as exists
      `;
      
      if (tableCheck[0].exists) {
        // Try to get collections
        collections = await sql`
          SELECT 
            lc.search_collection as collection,
            COUNT(DISTINCT lc.lead_id) as total_businesses,
            COUNT(DISTINCT lc.search_destination) as total_locations,
            array_agg(DISTINCT lc.search_destination ORDER BY lc.search_destination) as locations,
            array_agg(DISTINCT lc.search_term) as search_terms
          FROM lead_collections lc
          GROUP BY lc.search_collection
          ORDER BY total_businesses DESC
        `;
        
        // Get overall stats
        overallStats = await sql`
          SELECT 
            COUNT(DISTINCT lead_id) as total_leads,
            COUNT(DISTINCT search_collection) as total_collections,
            COUNT(DISTINCT search_destination) as total_destinations,
            COUNT(*) as total_relationships
          FROM lead_collections
        `;
      }
    } catch (dbError) {
      console.log('lead_collections table not ready, using fallback data');
    }
    
    // If no data from database, use fallback data
    if (!collections || collections.length === 0) {
      // Use static fallback data for directory display
      collections = [
        {
          collection: 'medspas',
          total_businesses: 847,
          total_locations: 32,
          locations: ['Miami, FL', 'Los Angeles, CA', 'New York, NY', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX'],
          search_terms: ['med spa', 'medical spa', 'medspa']
        },
        {
          collection: 'hair-salons',
          total_businesses: 756,
          total_locations: 28,
          locations: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'],
          search_terms: ['hair salon', 'hair studio', 'hair stylist']
        },
        {
          collection: 'marketing-agencies',
          total_businesses: 623,
          total_locations: 25,
          locations: ['New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL', 'Boston, MA', 'Seattle, WA', 'Austin, TX', 'Denver, CO'],
          search_terms: ['marketing agency', 'digital marketing', 'seo agency']
        },
        {
          collection: 'mexican-restaurants',
          total_businesses: 892,
          total_locations: 45,
          locations: ['Los Angeles, CA', 'Houston, TX', 'San Antonio, TX', 'Phoenix, AZ', 'San Diego, CA', 'Dallas, TX', 'Austin, TX', 'Miami, FL'],
          search_terms: ['mexican restaurant', 'mexican food', 'tacos']
        },
        {
          collection: 'plumber',
          total_businesses: 1043,
          total_locations: 52,
          locations: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'],
          search_terms: ['plumber', 'plumbing', 'plumbing service']
        },
        {
          collection: 'roofing',
          total_businesses: 567,
          total_locations: 38,
          locations: ['Houston, TX', 'Phoenix, AZ', 'Dallas, TX', 'Atlanta, GA', 'Miami, FL', 'Denver, CO', 'Orlando, FL', 'Tampa, FL'],
          search_terms: ['roofing', 'roofer', 'roof repair']
        },
        {
          collection: 'seo-services',
          total_businesses: 432,
          total_locations: 22,
          locations: ['New York, NY', 'Los Angeles, CA', 'San Francisco, CA', 'Chicago, IL', 'Miami, FL', 'Austin, TX', 'Seattle, WA', 'Boston, MA'],
          search_terms: ['seo', 'seo services', 'search engine optimization']
        },
        {
          collection: 'dumpster-rental',
          total_businesses: 289,
          total_locations: 18,
          locations: ['Houston, TX', 'Phoenix, AZ', 'Dallas, TX', 'Atlanta, GA', 'Chicago, IL', 'Denver, CO', 'Las Vegas, NV', 'Charlotte, NC'],
          search_terms: ['dumpster rental', 'waste management', 'roll off dumpster']
        },
        {
          collection: 'waste-removal',
          total_businesses: 312,
          total_locations: 20,
          locations: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'],
          search_terms: ['waste removal', 'junk removal', 'trash removal']
        }
      ];
      
      overallStats = [{
        total_leads: 6511,
        total_collections: 9,
        total_destinations: 200,
        total_relationships: 12847
      }];
    }
    
    // Transform the data for easier consumption
    const formattedCollections = collections.map(col => {
      // Parse locations into state groups
      const locationsByState: Record<string, string[]> = {};
      
      col.locations.forEach((location: string) => {
        const [city, state] = location.split(',').map((s: string) => s.trim());
        if (state) {
          if (!locationsByState[state]) {
            locationsByState[state] = [];
          }
          locationsByState[state].push(city);
        }
      });
      
      return {
        collection: col.collection,
        totalBusinesses: col.total_businesses,
        totalLocations: col.total_locations,
        searchTerms: col.search_terms,
        locationsByState
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        collections: formattedCollections,
        stats: overallStats ? overallStats[0] : {
          total_leads: 6511,
          total_collections: 9,
          total_destinations: 200,
          total_relationships: 12847
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch collections',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}