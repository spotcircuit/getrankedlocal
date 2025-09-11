/**
 * Grid Search Storage for Neon Database
 * Stores ALL businesses found in grid searches with comprehensive metrics
 */

import sql from './db';

/**
 * DATA BEING STORED:
 * 
 * 1. grid_searches - Main search record with overall stats
 * 2. grid_competitors - EVERY business found (with place_id as key)
 * 3. grid_point_results - Each business at each grid point (169+ records per business)
 * 4. competitor_summaries - Rollup stats across multiple searches
 * 5. grid_cells - Metadata about each grid cell
 */

export interface GridSearchData {
  searchTerm: string;
  centerLat: number;
  centerLng: number;
  city?: string;
  state?: string;
  initiatedBy?: {
    placeId?: string;
    name?: string;
  };
  gridSize: number;
  gridRows: number;
  gridCols: number;
  searchRadiusMiles?: number;
  executionTime: number;
  sessionId: string;
  rawResults: any[];  // Raw data from Python script
}

export async function saveGridSearch(data: GridSearchData) {
  try {
    console.log('📊 Processing grid search data for storage...');
    
    // 1. Process raw results to extract all unique businesses
    const allBusinesses = new Map<string, any>();
    const gridPointData: any[] = [];
    
    // Process each grid point
    data.rawResults.forEach((point, index) => {
      if (!point.success || !point.results) return;
      
      const gridRow = point.point.grid_row;
      const gridCol = point.point.grid_col;
      
      // Process each business at this grid point
      point.results.forEach((biz: any) => {
        // Generate a place_id if not available (use name + location as fallback)
        const placeId = biz.place_id || `${biz.name}_${point.point.lat}_${point.point.lng}`.replace(/\s+/g, '_');
        
        // Store business info
        if (!allBusinesses.has(placeId)) {
          allBusinesses.set(placeId, {
            placeId,
            name: biz.name,
            rating: biz.rating || null,
            reviews: biz.reviews || 0,
            appearances: 0,
            ranks: [],
            gridPoints: [],
            businessLat: biz.lat || null,
            businessLng: biz.lng || null,
            address: biz.address || null
          });
        }
        
        // Update business stats
        const business = allBusinesses.get(placeId);
        business.appearances++;
        business.ranks.push(biz.rank);
        business.gridPoints.push({ gridRow, gridCol, rank: biz.rank });
        
        // Calculate distance from business to grid point (if we have business coordinates)
        let distanceFromBusiness = null;
        if (biz.lat && biz.lng) {
          // Haversine formula
          const R = 3959; // Earth's radius in miles
          const dLat = (point.point.lat - biz.lat) * Math.PI / 180;
          const dLon = (point.point.lng - biz.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(biz.lat * Math.PI / 180) * Math.cos(point.point.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distanceFromBusiness = R * c;
        }
        
        // Store grid point data
        gridPointData.push({
          placeId,
          gridRow,
          gridCol,
          gridIndex: gridRow * data.gridCols + gridCol,
          lat: point.point.lat,
          lng: point.point.lng,
          rank: biz.rank,
          totalResults: point.results.length,
          distanceFromBusiness
        });
      });
    });
    
    // 2. Calculate statistics for each business
    const competitors = Array.from(allBusinesses.values()).map(biz => {
      const ranks = biz.ranks;
      const avgRank = ranks.reduce((a: number, b: number) => a + b, 0) / ranks.length;
      const bestRank = Math.min(...ranks);
      const worstRank = Math.max(...ranks);
      const coverage = (biz.appearances / data.gridSize) * 100;
      
      // Calculate geographic distribution
      const north = biz.gridPoints.filter((p: any) => p.gridRow < 6).length;
      const south = biz.gridPoints.filter((p: any) => p.gridRow > 6).length;
      const east = biz.gridPoints.filter((p: any) => p.gridCol > 6).length;
      const west = biz.gridPoints.filter((p: any) => p.gridCol < 6).length;
      const center = biz.gridPoints.filter((p: any) => p.gridRow >= 5 && p.gridRow <= 7 && p.gridCol >= 5 && p.gridCol <= 7).length;
      
      // Calculate ranking radius metrics
      const distanceData = gridPointData
        .filter(gp => gp.placeId === biz.placeId && gp.distanceFromBusiness !== null)
        .map(gp => ({ distance: gp.distanceFromBusiness, rank: gp.rank }));
      
      let maxRankingRadius = 0;
      let effectiveRadius = 0; // Distance where still in top 10
      let dominanceRadius = 0; // Distance where still in top 3
      
      if (distanceData.length > 0) {
        maxRankingRadius = Math.max(...distanceData.map(d => d.distance));
        const top10Points = distanceData.filter(d => d.rank <= 10);
        const top3Points = distanceData.filter(d => d.rank <= 3);
        
        effectiveRadius = top10Points.length > 0 ? 
          Math.max(...top10Points.map(d => d.distance)) : 0;
        dominanceRadius = top3Points.length > 0 ? 
          Math.max(...top3Points.map(d => d.distance)) : 0;
      }
      
      return {
        ...biz,
        avgRank,
        bestRank,
        worstRank,
        coverage,
        top3Count: ranks.filter((r: number) => r <= 3).length,
        top10Count: ranks.filter((r: number) => r <= 10).length,
        firstPlaceCount: ranks.filter((r: number) => r === 1).length,
        northAppearances: north,
        southAppearances: south,
        eastAppearances: east,
        westAppearances: west,
        centerAppearances: center,
        maxRankingRadius,
        effectiveRadius,
        dominanceRadius
      };
    });
    
    // 3. Save to database
    console.log(`💾 Saving ${competitors.length} unique businesses from ${gridPointData.length} grid point results...`);
    
    // Insert main search record
    const searchResult = await sql`
      INSERT INTO grid_searches (
        search_term,
        center_lat,
        center_lng,
        search_radius_miles,
        grid_size,
        grid_rows,
        grid_cols,
        initiated_by_place_id,
        initiated_by_name,
        city,
        state,
        total_unique_businesses,
        avg_businesses_per_point,
        max_businesses_per_point,
        min_businesses_per_point,
        total_search_results,
        execution_time_seconds,
        success_rate,
        session_id,
        raw_config
      ) VALUES (
        ${data.searchTerm},
        ${data.centerLat},
        ${data.centerLng},
        ${Math.min(Number(data.searchRadiusMiles || 5), 30)},
        ${data.gridSize},
        ${data.gridRows},
        ${data.gridCols},
        ${data.initiatedBy?.placeId || null},
        ${data.initiatedBy?.name || null},
        ${data.city || null},
        ${data.state || null},
        ${competitors.length},
        ${gridPointData.length / data.gridSize},
        ${Math.max(...data.rawResults.map(p => p.results?.length || 0))},
        ${Math.min(...data.rawResults.filter(p => p.results).map(p => p.results.length))},
        ${gridPointData.length},
        ${Math.round(data.executionTime)},
        ${(data.rawResults.filter(p => p.success).length / data.gridSize) * 100},
        ${data.sessionId},
        ${JSON.stringify(data)}
      )
      RETURNING id
    `;
    
    const searchId = searchResult[0].id;
    console.log(`✅ Created search record: ${searchId}`);
    
    // Insert competitors
    for (const competitor of competitors) {
      const competitorResult = await sql`
        INSERT INTO grid_competitors (
          search_id,
          place_id,
          name,
          rating,
          reviews,
          business_lat,
          business_lng,
          address,
          appearances,
          coverage_percent,
          avg_rank,
          best_rank,
          worst_rank,
          top_3_count,
          top_10_count,
          first_place_count,
          north_appearances,
          south_appearances,
          east_appearances,
          west_appearances,
          center_appearances
        ) VALUES (
          ${searchId},
          ${competitor.placeId},
          ${competitor.name},
          ${competitor.rating},
          ${competitor.reviews},
          ${competitor.businessLat},
          ${competitor.businessLng},
          ${competitor.address},
          ${competitor.appearances},
          ${competitor.coverage},
          ${competitor.avgRank},
          ${competitor.bestRank},
          ${competitor.worstRank},
          ${competitor.top3Count},
          ${competitor.top10Count},
          ${competitor.firstPlaceCount},
          ${competitor.northAppearances},
          ${competitor.southAppearances},
          ${competitor.eastAppearances},
          ${competitor.westAppearances},
          ${competitor.centerAppearances}
        )
        RETURNING id
      `;
      
      const competitorId = competitorResult[0].id;
      
      // Insert grid point results for this competitor
      const competitorGridPoints = gridPointData.filter(gp => gp.placeId === competitor.placeId);
      for (const gridPoint of competitorGridPoints) {
        await sql`
          INSERT INTO grid_point_results (
            search_id,
            competitor_id,
            grid_row,
            grid_col,
            grid_index,
            lat,
            lng,
            rank_position,
            total_results_at_point,
            distance_from_business_miles
          ) VALUES (
            ${searchId},
            ${competitorId},
            ${gridPoint.gridRow},
            ${gridPoint.gridCol},
            ${gridPoint.gridIndex},
            ${gridPoint.lat},
            ${gridPoint.lng},
            ${gridPoint.rank},
            ${gridPoint.totalResults},
            ${gridPoint.distanceFromBusiness}
          )
        `;
      }
    }
    
    // Insert grid cells metadata
    for (const point of data.rawResults) {
      if (!point.success) continue;
      
      const top3 = point.results.slice(0, 3).map((b: any) => ({
        placeId: b.place_id || `${b.name}_${point.point.lat}_${point.point.lng}`.replace(/\s+/g, '_'),
        name: b.name,
        rank: b.rank
      }));
      
      await sql`
        INSERT INTO grid_cells (
          search_id,
          grid_row,
          grid_col,
          lat,
          lng,
          total_businesses,
          competition_level,
          top_3_competitors
        ) VALUES (
          ${searchId},
          ${point.point.grid_row},
          ${point.point.grid_col},
          ${point.point.lat},
          ${point.point.lng},
          ${point.results.length},
          ${point.results.length <= 5 ? 'low' : point.results.length <= 10 ? 'medium' : point.results.length <= 15 ? 'high' : 'very_high'},
          ${JSON.stringify(top3)}
        )
      `;
    }
    
    console.log(`✅ Grid search data saved successfully!`);
    console.log(`   - ${competitors.length} unique businesses`);
    console.log(`   - ${gridPointData.length} grid point results`);
    console.log(`   - ${data.gridSize} grid cells analyzed`);
    
    return {
      success: true,
      searchId,
      stats: {
        uniqueBusinesses: competitors.length,
        totalGridPoints: data.gridSize,
        totalResults: gridPointData.length,
        avgCompetitionDensity: gridPointData.length / data.gridSize
      }
    };
    
  } catch (error) {
    console.error('❌ Error saving grid search:', error);
    return { success: false, error };
  }
}

// Get recent searches
export async function getRecentSearches(limit = 10) {
  const results = await sql`
    SELECT 
      id,
      search_term,
      center_lat,
      center_lng,
      city,
      state,
      total_unique_businesses,
      avg_businesses_per_point,
      execution_time_seconds,
      created_at
    FROM grid_searches
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  
  return results;
}

// Get competitor summary across all searches
export async function getCompetitorSummary(placeId: string) {
  const results = await sql`
    SELECT * FROM competitor_summaries
    WHERE place_id = ${placeId}
  `;
  
  return results[0] || null;
}

// Get head-to-head comparison
export async function getCompetitorComparison(placeId1: string, placeId2: string, searchTerm?: string) {
  let query = sql`
    SELECT 
      gs.search_term,
      gs.created_at,
      gc1.name as business_1_name,
      gc1.coverage_percent as business_1_coverage,
      gc1.avg_rank as business_1_avg_rank,
      gc1.appearances as business_1_appearances,
      gc2.name as business_2_name,
      gc2.coverage_percent as business_2_coverage,
      gc2.avg_rank as business_2_avg_rank,
      gc2.appearances as business_2_appearances
    FROM grid_competitors gc1
    JOIN grid_competitors gc2 ON gc1.search_id = gc2.search_id
    JOIN grid_searches gs ON gc1.search_id = gs.id
    WHERE gc1.place_id = ${placeId1}
      AND gc2.place_id = ${placeId2}
  `;
  
  if (searchTerm) {
    query = sql`${query} AND gs.search_term = ${searchTerm}`;
  }
  
  query = sql`${query} ORDER BY gs.created_at DESC`;
  
  return await query;
}
