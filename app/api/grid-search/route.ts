import { NextRequest, NextResponse } from 'next/server';
import { saveGridSearch } from '@/lib/grid-search-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      niche, 
      city, 
      state, 
      businessName,
      centerLat,
      centerLng,
      radiusMiles = 5,
      gridSize = 13 
    } = body;

    if (!niche) {
      return NextResponse.json(
        { error: 'Search term (niche) is required' },
        { status: 400 }
      );
    }

    // Validate location parameters
    const hasCityState = city && state;
    const hasCoordinates = centerLat !== undefined && centerLng !== undefined;
    
    if (!hasCityState && !hasCoordinates) {
      return NextResponse.json(
        { error: 'Either city/state or centerLat/centerLng is required' },
        { status: 400 }
      );
    }

    // Call Python grid search orchestrator via Railway API
    const railwayUrl = process.env.RAILWAY_API_URL || process.env.NEXT_PUBLIC_LEADFINDER_API_URL;
    
    if (!railwayUrl) {
      console.error('Railway API URL not configured');
      return NextResponse.json(
        { error: 'Search service not configured' },
        { status: 500 }
      );
    }

    const searchParams = {
      niche,
      city: hasCityState ? city : undefined,
      state: hasCityState ? state : undefined,
      center_lat: hasCoordinates ? centerLat : undefined,
      center_lng: hasCoordinates ? centerLng : undefined,
      radius_miles: radiusMiles,
      grid_size: gridSize,
      business_name: businessName,
      use_city_bounds: hasCityState
    };

    console.log('🗺️ Initiating grid search:', searchParams);

    const response = await fetch(`${railwayUrl}/api/grid-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grid search API error:', response.status, errorText);
      
      return NextResponse.json(
        { error: `Search failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Process and format the results for the frontend
    const formattedResults = formatGridResults(data, businessName);
    
    // Save to database if we have raw results
    if (data.grid_results && data.grid_results.length > 0) {
      console.log('💾 Saving grid search to database...');
      
      // Create session ID
      const sessionId = `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Transform grid_results to match our expected format
      const rawResults = data.grid_results.map((result: any) => ({
        success: true,
        point: {
          lat: result.lat,
          lng: result.lng,
          grid_row: result.grid_row,
          grid_col: result.grid_col
        },
        results: result.businesses.map((biz: any, idx: number) => ({
          name: biz.name,
          place_id: biz.place_id,
          rating: biz.rating,
          reviews: biz.reviews,
          address: biz.address,
          lat: biz.lat,
          lng: biz.lng,
          rank: idx + 1
        }))
      }));
      
      const dbSaveResult = await saveGridSearch({
        searchTerm: niche,
        centerLat: data.center?.lat || centerLat,
        centerLng: data.center?.lng || centerLng,
        city: data.location?.city || city,
        state: data.location?.state || state,
        initiatedBy: businessName ? {
          name: businessName
        } : undefined,
        gridSize: gridSize * gridSize,
        gridRows: gridSize,
        gridCols: gridSize,
        executionTime: Math.round((Date.now() - new Date(data.timestamp).getTime()) / 1000),
        sessionId,
        rawResults
      });
      
      if (dbSaveResult.success) {
        console.log(`✅ Grid search saved to database with ID: ${dbSaveResult.searchId}`);
        formattedResults.databaseSaveResult = dbSaveResult;
      } else {
        console.error('⚠️ Failed to save grid search to database:', dbSaveResult.error);
      }
    }
    
    return NextResponse.json(formattedResults);
    
  } catch (error) {
    console.error('Grid search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform grid search' },
      { status: 500 }
    );
  }
}

function formatGridResults(rawData: any, targetBusinessName?: string) {
  // Extract heat map data for visualization
  const { aggregated, grid_results, location, center, grid_dimension } = rawData;
  
  if (!aggregated || !aggregated.top_businesses) {
    return {
      error: 'No businesses found in search area',
      location,
      center
    };
  }

  // Find target business if specified
  let targetBusiness = null;
  let targetHeatMap = null;
  
  if (targetBusinessName) {
    const cleanTarget = targetBusinessName.toLowerCase();
    targetBusiness = aggregated.top_businesses.find((b: any) => 
      b.business.name.toLowerCase().includes(cleanTarget)
    );
    
    if (targetBusiness) {
      targetHeatMap = generateHeatMapForBusiness(
        targetBusiness, 
        grid_dimension,
        grid_results
      );
    }
  }

  // Get top 3 competitors heat maps
  const topCompetitors = aggregated.top_businesses
    .filter((b: any) => !targetBusinessName || 
      !b.business.name.toLowerCase().includes(targetBusinessName.toLowerCase()))
    .slice(0, 3)
    .map((b: any) => generateHeatMapForBusiness(b, grid_dimension, grid_results));

  return {
    success: true,
    location,
    center,
    gridSize: grid_dimension,
    totalBusinesses: aggregated.total_unique_businesses,
    targetBusiness: targetHeatMap,
    topCompetitors,
    coverageStats: aggregated.business_count_by_coverage,
    searchDetails: {
      niche: rawData.search_term,
      totalPoints: rawData.grid_points,
      timestamp: rawData.timestamp
    }
  };
}

function generateHeatMapForBusiness(businessStat: any, gridSize: number, gridResults: any[]) {
  // Initialize empty grid
  const grid: (any | null)[][] = Array(gridSize).fill(null)
    .map(() => Array(gridSize).fill(null));
  
  // Fill in rankings for this business
  businessStat.grid_rankings.forEach((ranking: any) => {
    const { grid_row, grid_col, rank, lat, lng } = ranking;
    
    let color: string;
    if (rank <= 3) {
      color = 'green';
    } else if (rank <= 10) {
      color = 'yellow';
    } else if (rank <= 20) {
      color = 'orange';
    } else {
      color = 'red';
    }
    
    grid[grid_row][grid_col] = {
      rank,
      color,
      lat,
      lng
    };
  });

  // Calculate additional stats
  const ranks = businessStat.grid_rankings.map((r: any) => r.rank);
  const top3Percentage = (ranks.filter((r: number) => r <= 3).length / ranks.length * 100).toFixed(1);

  return {
    business: {
      name: businessStat.business.name,
      place_id: businessStat.business.place_id,
      rating: businessStat.business.rating,
      reviews: businessStat.business.reviews,
      address: businessStat.business.address,
      phone: businessStat.business.phone,
      website: businessStat.business.website
    },
    stats: {
      coverage: `${businessStat.coverage_percentage.toFixed(1)}%`,
      average_rank: businessStat.average_rank.toFixed(1),
      best_rank: businessStat.best_rank,
      worst_rank: businessStat.worst_rank,
      top3_percentage: `${top3Percentage}%`,
      total_appearances: businessStat.total_appearances,
      top3_count: businessStat.top3_count,
      top10_count: businessStat.top10_count
    },
    grid
  };
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Grid Search API',
    endpoints: {
      POST: {
        description: 'Perform grid-based local search',
        requiredParams: ['niche', 'city/state OR centerLat/centerLng'],
        optionalParams: ['businessName', 'radiusMiles', 'gridSize']
      }
    }
  });
}