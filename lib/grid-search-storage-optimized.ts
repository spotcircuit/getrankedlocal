/**
 * Optimized Grid Search Storage for Neon Database
 * Uses bulk inserts for better performance
 */

import sql from './db';

export interface GridSearchData {
  searchTerm: string;
  centerLat: number;
  centerLng: number;
  city?: string;
  state?: string;
  searchMode?: 'targeted' | 'all_businesses';
  initiatedBy?: {
    placeId?: string;
    name?: string;
  };
  gridSize: number;
  gridRows: number;
  gridCols: number;
  executionTime: number;
  sessionId: string;
  rawResults: any[];
}

export async function saveGridSearch(data: GridSearchData) {
  try {
    console.log('📊 Processing grid search data for storage...');
    
    // 1. Process raw results to extract all unique businesses
    const allBusinesses = new Map<string, any>();
    const gridPointData: any[] = [];
    
    // Process each grid point
    data.rawResults.forEach((point) => {
      if (!point.success || !point.results) return;
      
      const gridRow = point.point.grid_row;
      const gridCol = point.point.grid_col;
      
      // Track which businesses we've seen at this grid point to avoid duplicates
      const seenAtThisPoint = new Set<string>();
      
      // Process each business at this grid point
      point.results.forEach((biz: any) => {
        // Use name as primary key for deduplication to avoid duplicates with different place_ids
        const businessKey = biz.name;
        const placeId = biz.place_id || biz.name;
        
        // Skip if we've already processed this business at this grid point
        const gridPointKey = `${businessKey}_${gridRow}_${gridCol}`;
        if (seenAtThisPoint.has(gridPointKey)) return;
        seenAtThisPoint.add(gridPointKey);
        
        // Store business info with all extracted data (dedupe by name, not place_id)
        if (!allBusinesses.has(businessKey)) {
          allBusinesses.set(businessKey, {
            placeId,  // Store the first place_id we encounter
            name: biz.name,
            rating: biz.rating || null,
            reviews: biz.reviews || 0,
            appearances: 0,
            ranks: [],
            gridPoints: [],
            businessLat: biz.lat || null,
            businessLng: biz.lng || null,
            address: biz.address || null,
            phone: biz.phone || null,
            businessType: biz.business_type || null,
            priceLevel: biz.price_level || null,
            currentlyOpen: biz.currently_open || null,
            cid: biz.cid || null
          });
        }
        
        // Update business stats
        const business = allBusinesses.get(businessKey);
        business.appearances++;
        business.ranks.push(biz.rank);
        business.gridPoints.push({ gridRow, gridCol, rank: biz.rank });
        
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
          distanceFromBusiness: null // Skip distance calc for speed
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
      const center = biz.gridPoints.filter((p: any) => 
        p.gridRow >= 5 && p.gridRow <= 7 && p.gridCol >= 5 && p.gridCol <= 7
      ).length;
      
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
        centerAppearances: center
      };
    });
    
    // 3. Save to database with BULK inserts
    console.log(`💾 Saving grid search data:`);
    console.log(`   - ${competitors.length} unique businesses found`);
    console.log(`   - ${gridPointData.length} total business appearances`);
    
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
        search_mode,
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
        ${5.0},
        ${data.gridSize},
        ${data.gridRows},
        ${data.gridCols},
        ${data.searchMode || 'targeted'},
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
    
    // Bulk insert competitors
    if (competitors.length > 0) {
      // Deduplicate competitors by place_id before inserting
      const uniqueCompetitors = new Map();
      competitors.forEach(c => {
        const key = `${searchId}_${c.placeId}`;
        if (!uniqueCompetitors.has(key) || c.appearances > uniqueCompetitors.get(key).appearances) {
          uniqueCompetitors.set(key, c);
        }
      });
      
      const competitorValues = Array.from(uniqueCompetitors.values()).map(c => ({
        search_id: searchId,
        place_id: c.placeId,
        name: c.name,
        rating: c.rating,
        reviews: c.reviews,
        business_lat: c.businessLat,
        business_lng: c.businessLng,
        address: c.address,
        appearances: c.appearances,
        coverage_percent: c.coverage,
        avg_rank: c.avgRank,
        best_rank: c.bestRank,
        worst_rank: c.worstRank,
        top_3_count: c.top3Count,
        top_10_count: c.top10Count,
        first_place_count: c.firstPlaceCount,
        north_appearances: c.northAppearances,
        south_appearances: c.southAppearances,
        east_appearances: c.eastAppearances,
        west_appearances: c.westAppearances,
        center_appearances: c.centerAppearances
      }));
      
      // Bulk insert competitors without ON CONFLICT since we've already deduped
      const competitorResults = await sql`
        INSERT INTO grid_competitors (
          search_id, place_id, name, rating, reviews,
          business_lat, business_lng, address, appearances,
          coverage_percent, avg_rank, best_rank, worst_rank,
          top_3_count, top_10_count, first_place_count,
          north_appearances, south_appearances, east_appearances,
          west_appearances, center_appearances
        )
        SELECT * FROM UNNEST(
          ${competitorValues.map(c => c.search_id)}::uuid[],
          ${competitorValues.map(c => c.place_id)}::varchar[],
          ${competitorValues.map(c => c.name)}::varchar[],
          ${competitorValues.map(c => c.rating)}::decimal[],
          ${competitorValues.map(c => c.reviews)}::integer[],
          ${competitorValues.map(c => c.business_lat)}::decimal[],
          ${competitorValues.map(c => c.business_lng)}::decimal[],
          ${competitorValues.map(c => c.address)}::text[],
          ${competitorValues.map(c => c.appearances)}::integer[],
          ${competitorValues.map(c => c.coverage_percent)}::decimal[],
          ${competitorValues.map(c => c.avg_rank)}::decimal[],
          ${competitorValues.map(c => c.best_rank)}::integer[],
          ${competitorValues.map(c => c.worst_rank)}::integer[],
          ${competitorValues.map(c => c.top_3_count)}::integer[],
          ${competitorValues.map(c => c.top_10_count)}::integer[],
          ${competitorValues.map(c => c.first_place_count)}::integer[],
          ${competitorValues.map(c => c.north_appearances)}::integer[],
          ${competitorValues.map(c => c.south_appearances)}::integer[],
          ${competitorValues.map(c => c.east_appearances)}::integer[],
          ${competitorValues.map(c => c.west_appearances)}::integer[],
          ${competitorValues.map(c => c.center_appearances)}::integer[]
        )
        RETURNING id, place_id
      `;
      
      console.log(`✅ Bulk inserted ${competitorResults.length} competitors`);
      
      // Create a map of place_id to competitor_id
      const competitorIdMap = new Map();
      competitorResults.forEach(r => {
        competitorIdMap.set(r.place_id, r.id);
      });
      
      // Prepare grid point results for bulk insert
      const gridPointValues = gridPointData.map(gp => ({
        search_id: searchId,
        competitor_id: competitorIdMap.get(gp.placeId),
        grid_row: gp.gridRow,
        grid_col: gp.gridCol,
        grid_index: gp.gridIndex,
        lat: gp.lat,
        lng: gp.lng,
        rank_position: gp.rank,
        total_results_at_point: gp.totalResults,
        distance_from_business_miles: gp.distanceFromBusiness
      })).filter(gp => gp.competitor_id); // Only include if we have a valid competitor_id
      
      // Bulk insert grid point results in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < gridPointValues.length; i += batchSize) {
        const batch = gridPointValues.slice(i, i + batchSize);
        await sql`
          INSERT INTO grid_point_results (
            search_id, competitor_id, grid_row, grid_col, grid_index,
            lat, lng, rank_position, total_results_at_point,
            distance_from_business_miles
          )
          SELECT * FROM UNNEST(
            ${batch.map(b => b.search_id)}::uuid[],
            ${batch.map(b => b.competitor_id)}::uuid[],
            ${batch.map(b => b.grid_row)}::integer[],
            ${batch.map(b => b.grid_col)}::integer[],
            ${batch.map(b => b.grid_index)}::integer[],
            ${batch.map(b => b.lat)}::decimal[],
            ${batch.map(b => b.lng)}::decimal[],
            ${batch.map(b => b.rank_position)}::integer[],
            ${batch.map(b => b.total_results_at_point)}::integer[],
            ${batch.map(b => b.distance_from_business_miles)}::decimal[]
          )
        `;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(gridPointValues.length / batchSize)}`);
      }
    }
    
    // Bulk insert grid cells
    const gridCellValues = data.rawResults
      .filter(point => point.success)
      .map(point => {
        const top3 = point.results.slice(0, 3).map((b: any) => ({
          placeId: b.place_id || `${b.name}_${point.point.lat}_${point.point.lng}`.replace(/\s+/g, '_'),
          name: b.name,
          rank: b.rank
        }));
        
        return {
          search_id: searchId,
          grid_row: point.point.grid_row,
          grid_col: point.point.grid_col,
          lat: point.point.lat,
          lng: point.point.lng,
          total_businesses: point.results.length,
          competition_level: point.results.length <= 5 ? 'low' : 
                           point.results.length <= 10 ? 'medium' : 
                           point.results.length <= 15 ? 'high' : 'very_high',
          top_3_competitors: JSON.stringify(top3)
        };
      });
    
    if (gridCellValues.length > 0) {
      await sql`
        INSERT INTO grid_cells (
          search_id, grid_row, grid_col, lat, lng,
          total_businesses, competition_level, top_3_competitors
        )
        SELECT * FROM UNNEST(
          ${gridCellValues.map(g => g.search_id)}::uuid[],
          ${gridCellValues.map(g => g.grid_row)}::integer[],
          ${gridCellValues.map(g => g.grid_col)}::integer[],
          ${gridCellValues.map(g => g.lat)}::decimal[],
          ${gridCellValues.map(g => g.lng)}::decimal[],
          ${gridCellValues.map(g => g.total_businesses)}::integer[],
          ${gridCellValues.map(g => g.competition_level)}::varchar[],
          ${gridCellValues.map(g => g.top_3_competitors)}::jsonb[]
        )
      `;
      console.log(`✅ Bulk inserted ${gridCellValues.length} grid cells`);
    }
    
    console.log(`✅ Grid search data saved successfully!`);
    
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