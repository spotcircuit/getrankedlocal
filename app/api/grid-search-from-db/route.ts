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
        gc.place_id as competitor_place_id,
        gc.rating,
        gc.reviews
      FROM grid_point_results gpr
      JOIN grid_competitors gc ON gpr.competitor_id = gc.id
      WHERE gpr.search_id = ${search.id}
      ORDER BY gpr.grid_index, gpr.rank_position
    `;
    
    console.log(`Found ${gridPointResults.length} grid point results`);
    console.log(`Target business name: "${search.initiated_by_name}"`);
    
    // Build grid points array using stored grid dimensions and radius
    const gridPoints = [] as any[];

    // Calculate grid spacing for missing cells using stored settings
    const centerLat = parseFloat(search.center_lat);
    const centerLng = parseFloat(search.center_lng);
    const gridRows = Number(search.grid_rows) || 13;
    const gridCols = Number(search.grid_cols) || 13;
    const totalGridPoints = (Number(search.grid_size) || (gridRows * gridCols)) || (13 * 13);
    const storedRadius = Number(search.search_radius_miles) || 5;
    const radiusMiles = Math.min(storedRadius, 30); // cap at 30 miles
    const centerRow = Math.floor(gridRows / 2);
    const centerCol = Math.floor(gridCols / 2);
    const stepMilesRow = (radiusMiles * 2) / Math.max(gridRows - 1, 1);
    const stepMilesCol = (radiusMiles * 2) / Math.max(gridCols - 1, 1);
    const latStep = stepMilesRow / 69; // degrees per mile (lat)
    const lngStep = stepMilesCol / (69 * Math.abs(Math.cos(centerLat * Math.PI / 180)));
    
    // Initialize all grid points
    for (let i = 0; i < totalGridPoints; i++) {
      const row = Math.floor(i / gridCols);
      const col = i % gridCols;
      
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
        let targetRank = undefined as number | undefined;
        if (search.initiated_by_name || search.initiated_by_place_id) {
          // Prefer place_id match if available
          const targetPlaceId = (search.initiated_by_place_id || '').toString().trim();
          if (targetPlaceId) {
            const byPlace = (pointResults as any[]).find(r => (r.competitor_place_id || '').toString() === targetPlaceId);
            if (byPlace) targetRank = (byPlace as any).rank_position;
          }
          if (targetRank === undefined) {
            // Fuzzy name match: all significant words (len>2) must be present (case-insensitive)
            const targetName = (search.initiated_by_name || '').toString().toLowerCase();
            const words = targetName.split(/\s+/).filter((w: string) => w.length > 2);
            const byName = (pointResults as any[]).find(r => {
              const name = (r.competitor_name || '').toString().toLowerCase();
              return words.length ? words.every((w: string) => name.includes(w)) : name === targetName;
            });
            if (byName) targetRank = (byName as any).rank_position;
          }
          if (targetRank === undefined) {
            targetRank = 999; // Only set to 999 if we're looking for a target but didn't find it
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
        const lat = centerLat + ((row - centerRow) * latStep);
        const lng = centerLng + ((col - centerCol) * lngStep);
        
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
      competitorRankMatrix[comp.name] = new Array(totalGridPoints).fill(999);
    });
    
    // Fill in actual rankings from grid point results
    for (let gridIndex = 0; gridIndex < totalGridPoints; gridIndex++) {
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
          totalPoints: totalGridPoints,
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
