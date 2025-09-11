/**
 * API to fetch the latest grid search from database
 * This replaces the test data file approach
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get query params for optional filtering
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const searchTerm = searchParams.get('searchTerm');
    
    // Build query to get the latest search
    let query;
    if (city && searchTerm) {
      query = sql`
        SELECT * FROM grid_searches 
        WHERE LOWER(city) = ${city.toLowerCase()} 
        AND LOWER(search_term) = ${searchTerm.toLowerCase()}
        ORDER BY created_at DESC 
        LIMIT 1
      `;
    } else if (city) {
      query = sql`
        SELECT * FROM grid_searches 
        WHERE LOWER(city) = ${city.toLowerCase()}
        ORDER BY created_at DESC 
        LIMIT 1
      `;
    } else {
      // Just get the latest search
      query = sql`
        SELECT * FROM grid_searches 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
    }
    
    const searches = await query;
    
    if (searches.length === 0) {
      return NextResponse.json(
        { error: 'No grid searches found in database' },
        { status: 404 }
      );
    }
    
    const search = searches[0];
    
    // Get all grid points for this search
    const gridCells = await sql`
      SELECT * FROM grid_cells 
      WHERE search_id = ${search.id}
      ORDER BY grid_row, grid_col
    `;
    
    // Get all competitors, filtering out UI elements
    const competitors = await sql`
      SELECT * FROM grid_competitors 
      WHERE search_id = ${search.id}
      AND name NOT LIKE 'Visit %'
      AND name NOT LIKE 'Get directions%'
      AND name NOT LIKE 'Call %'
      AND name NOT LIKE 'Save %'
      AND name NOT LIKE 'Share %'
      AND name NOT LIKE 'Website %'
      ORDER BY coverage_percent DESC
      LIMIT 50
    `;
    
    // Get grid point results for building the grid visualization
    const gridPointResults = await sql`
      SELECT 
        gpr.*,
        gc.name as competitor_name,
        gc.rating,
        gc.reviews
      FROM grid_point_results gpr
      JOIN grid_competitors gc ON gpr.competitor_id = gc.id
      WHERE gpr.search_id = ${search.id}
      ORDER BY gpr.grid_index, gpr.rank_position
    `;
    
    console.log(`Found ${gridPointResults.length} grid point results`);
    console.log(`Target business name: "${search.initiated_by_name}"`);
    
    // Build grid points array (13x13 = 169 points)
    const gridPoints = [];
    
    // Calculate grid spacing for missing cells
    const centerLat = parseFloat(search.center_lat);
    const centerLng = parseFloat(search.center_lng);
    const radiusMiles = 5;
    const gridSize = 13;
    const centerIdx = Math.floor(gridSize / 2); // 6
    const stepSize = (radiusMiles * 2) / (gridSize - 1);
    const latStep = stepSize / 69; // degrees per mile
    const lngStep = stepSize / (69 * Math.abs(Math.cos(centerLat * Math.PI / 180)));
    
    // Initialize all 169 grid points
    for (let i = 0; i < 169; i++) {
      const row = Math.floor(i / 13);
      const col = i % 13;
      
      const cell = gridCells.find(c => c.grid_row === row && c.grid_col === col);
      
      if (cell) {
        // Get results at this grid point
        const pointResults = gridPointResults.filter(r => r.grid_index === i);
        
        // Get top competitors at this point (increased to 20 for heat map switching)
        const topCompetitors = pointResults.slice(0, 20).map(r => ({
          name: r.competitor_name,
          rank: r.rank_position,
          rating: r.rating || 0,
          reviews: r.reviews || 0
        }));
        
        // Find target business rank at this point if we have one
        let targetRank = undefined;
        if (search.initiated_by_name || search.initiated_by_place_id) {
          // Look for the target business in this grid point's results
          const targetResult = pointResults.find(r => 
            r.competitor_name === search.initiated_by_name
          );
          if (targetResult) {
            targetRank = targetResult.rank_position;
            if (i < 5) { // Log first 5 for debugging
              console.log(`Grid ${i}: Found ${search.initiated_by_name} at rank ${targetRank}`);
            }
          } else {
            targetRank = 999; // Only set to 999 if we're looking for a target but didn't find it
            if (i < 5 && pointResults.length > 0) {
              console.log(`Grid ${i}: Target not found. Names at this point:`, pointResults.slice(0, 3).map(r => r.competitor_name));
            }
          }
        }
        
        const gridPoint: any = {
          lat: parseFloat(cell.lat),
          lng: parseFloat(cell.lng),
          gridRow: row,
          gridCol: col,
          totalResults: cell.total_businesses,
          topCompetitors
        };
        
        // Only add targetRank if we're in targeted mode
        if (targetRank !== undefined) {
          gridPoint.targetRank = targetRank;
        }
        
        gridPoints.push(gridPoint);
      } else {
        // Cell is missing - create a placeholder with calculated position
        const lat = centerLat + ((row - centerIdx) * latStep);
        const lng = centerLng + ((col - centerIdx) * lngStep);
        
        const gridPoint: any = {
          lat: lat,
          lng: lng,
          gridRow: row,
          gridCol: col,
          totalResults: 0,
          topCompetitors: []
        };
        
        // Only add targetRank if we're in targeted mode
        if (search.initiated_by_name || search.initiated_by_place_id) {
          gridPoint.targetRank = 999; // No data for this point
        }
        
        gridPoints.push(gridPoint);
      }
    }
    
    // Deduplicate competitors by name (keeping the one with highest coverage)
    const competitorMap = new Map();
    competitors.forEach(c => {
      const existing = competitorMap.get(c.name);
      if (!existing || parseFloat(c.coverage_percent) > parseFloat(existing.coverage_percent)) {
        competitorMap.set(c.name, c);
      }
    });
    
    // Format deduplicated competitors for display
    const formattedCompetitors = Array.from(competitorMap.values())
      .sort((a, b) => parseFloat(b.coverage_percent) - parseFloat(a.coverage_percent))
      .slice(0, 20)  // Take top 20 after deduplication
      .map(c => ({
      name: c.name,
      place_id: c.place_id,
      rating: parseFloat(c.rating || 0),
      reviews: parseInt(c.reviews || 0),
      appearances: c.appearances,
      avgRank: parseFloat(c.avg_rank).toFixed(1),
      coverage: parseFloat(c.coverage_percent).toFixed(1),
      address: c.address,
      lat: c.business_lat ? parseFloat(c.business_lat) : null,
      lng: c.business_lng ? parseFloat(c.business_lng) : null
    }));
    
    // Build complete ranking matrix for top 20 competitors
    // This will be a map of competitor name -> array of 169 rankings
    const competitorRankMatrix: Record<string, number[]> = {};
    
    // Initialize all competitors with 999 (not found) for all grid points
    formattedCompetitors.forEach(comp => {
      competitorRankMatrix[comp.name] = new Array(169).fill(999);
    });
    
    // Fill in actual rankings from grid point results
    for (let gridIndex = 0; gridIndex < 169; gridIndex++) {
      const pointResults = gridPointResults.filter(r => r.grid_index === gridIndex);
      
      pointResults.forEach(result => {
        // If this competitor is in our top 20, record their rank at this grid point
        if (competitorRankMatrix.hasOwnProperty(result.competitor_name)) {
          competitorRankMatrix[result.competitor_name][gridIndex] = result.rank_position;
        }
      });
    }
    
    // Get target business stats if we have one
    let targetBusinessData = null;
    if (search.initiated_by_name) {
      // Find the target business in competitors
      const targetCompetitor = formattedCompetitors.find(c => c.name === search.initiated_by_name);
      
      if (targetCompetitor) {
        // Count how many grid points have the target business
        const pointsWithTarget = gridPoints.filter(p => p.targetRank !== undefined && p.targetRank < 999).length;
        
        // Get all ranks for the target
        const targetRanks = gridPoints
          .filter(p => p.targetRank !== undefined && p.targetRank < 999)
          .map(p => p.targetRank);
        
        targetBusinessData = {
          name: search.initiated_by_name,
          lat: targetCompetitor.lat || parseFloat(search.center_lat),
          lng: targetCompetitor.lng || parseFloat(search.center_lng),
          rating: targetCompetitor.rating,
          reviews: targetCompetitor.reviews,
          coverage: parseFloat(targetCompetitor.coverage),
          pointsFound: pointsWithTarget,
          totalPoints: 169,
          avgRank: targetRanks.length > 0 ? 
            targetRanks.reduce((a, b) => a + b, 0) / targetRanks.length : 999,
          bestRank: targetRanks.length > 0 ? Math.min(...targetRanks) : 999,
          worstRank: targetRanks.length > 0 ? Math.max(...targetRanks) : 999
        };
      } else {
        // Target business was specified but not found in results
        console.log(`Warning: Target business "${search.initiated_by_name}" not found in competitors`);
      }
    }
    
    // Build response matching the expected format
    const gridData = {
      gridPoints,
      searchTerm: search.search_term,
      targetBusiness: targetBusinessData,
      competitors: formattedCompetitors,
      competitorRankMatrix, // Add the complete ranking matrix
      summary: {
        totalUniqueBusinesses: search.total_unique_businesses,
        successRate: `${Math.round(search.success_rate)}%`,
        executionTime: search.execution_time_seconds,
        elapsedTime: search.execution_time_seconds
      },
      location: {
        city: search.city,
        state: search.state,
        centerLat: parseFloat(search.center_lat),
        centerLng: parseFloat(search.center_lng)
      }
    };
    
    return NextResponse.json({
      success: true,
      gridData,
      searchId: search.id,
      createdAt: search.created_at
    });
    
  } catch (error: any) {
    console.error('Database fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid search data', details: error.message },
      { status: 500 }
    );
  }
}