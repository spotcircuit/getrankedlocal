import sql from './db';

interface SponsoredResult {
  businessName: string;
  placeId?: string;
  lat: number;
  lng: number;
  sponsoredRank: number;
  overallPosition: number;
  rating?: number;
  reviews?: number;
  phone?: string;
  address?: string;
}

export async function trackSponsoredResults(
  gridSearchId: number,
  searchTerm: string,
  centerLat: number,
  centerLng: number,
  city: string,
  state: string,
  rawResults: any[]
) {
  // Collect all sponsored results from the grid search
  const sponsoredByBusiness = new Map<string, {
    appearances: SponsoredResult[];
    placeId?: string;
    totalRating: number;
    totalReviews: number;
    ratingCount: number;
    reviewCount: number;
  }>();

  // Process each grid point
  for (const gridResult of rawResults) {
    if (!gridResult.success || !gridResult.results) continue;
    
    const point = gridResult.point;
    
    // Find sponsored results at this grid point
    for (const business of gridResult.results) {
      if (business.is_sponsored) {
        const sponsored: SponsoredResult = {
          businessName: business.name,
          placeId: business.place_id,
          lat: point.lat,
          lng: point.lng,
          sponsoredRank: business.sponsored_rank || 0,
          overallPosition: business.rank,
          rating: business.rating,
          reviews: business.reviews,
          phone: business.phone,
          address: business.address
        };
        
        // Track in sponsored_results table
        const [insertedResult] = await sql`
          INSERT INTO sponsored_results (
            grid_search_id,
            business_name,
            place_id,
            lat,
            lng,
            search_term,
            city,
            state,
            sponsored_rank,
            overall_position,
            rating,
            reviews,
            phone,
            address
          ) VALUES (
            ${gridSearchId},
            ${sponsored.businessName},
            ${sponsored.placeId || null},
            ${sponsored.lat},
            ${sponsored.lng},
            ${searchTerm},
            ${city},
            ${state},
            ${sponsored.sponsoredRank},
            ${sponsored.overallPosition},
            ${sponsored.rating || null},
            ${sponsored.reviews || null},
            ${sponsored.phone || null},
            ${sponsored.address || null}
          )
          RETURNING id
        `;
        
        // Aggregate for summary
        const key = business.place_id || business.name;
        if (!sponsoredByBusiness.has(key)) {
          sponsoredByBusiness.set(key, {
            appearances: [],
            placeId: business.place_id,
            totalRating: 0,
            totalReviews: 0,
            ratingCount: 0,
            reviewCount: 0
          });
        }
        
        const bizData = sponsoredByBusiness.get(key)!;
        bizData.appearances.push(sponsored);
        
        if (sponsored.rating) {
          bizData.totalRating += sponsored.rating;
          bizData.ratingCount++;
        }
        if (sponsored.reviews) {
          bizData.totalReviews += sponsored.reviews;
          bizData.reviewCount++;
        }
      }
    }
  }
  
  // Create rollup summaries for each sponsored business
  const totalGridPoints = rawResults.filter(r => r.success).length;
  
  sponsoredByBusiness.forEach(async (bizData, key) => {
    const appearances = bizData.appearances;
    const appearanceCount = appearances.length;
    
    if (appearanceCount === 0) return;
    
    // Calculate statistics
    const sponsoredRanks = appearances.map((a: SponsoredResult) => a.sponsoredRank).filter((r: number) => r > 0);
    const overallPositions = appearances.map((a: SponsoredResult) => a.overallPosition);
    
    const avgSponsoredRank = sponsoredRanks.length > 0 
      ? sponsoredRanks.reduce((a: number, b: number) => a + b, 0) / sponsoredRanks.length 
      : null;
    
    const avgOverallPosition = overallPositions.length > 0
      ? overallPositions.reduce((a: number, b: number) => a + b, 0) / overallPositions.length
      : null;
    
    const avgRating = bizData.ratingCount > 0 
      ? bizData.totalRating / bizData.ratingCount 
      : null;
    
    const avgReviews = bizData.reviewCount > 0
      ? Math.round(bizData.totalReviews / bizData.reviewCount)
      : null;
    
    // Insert summary
    await sql`
      INSERT INTO sponsored_summary (
        grid_search_id,
        business_name,
        place_id,
        search_term,
        center_lat,
        center_lng,
        city,
        state,
        appearances_count,
        total_grid_points,
        coverage_percentage,
        avg_sponsored_rank,
        min_sponsored_rank,
        max_sponsored_rank,
        avg_overall_position,
        avg_rating,
        avg_reviews,
        search_date
      ) VALUES (
        ${gridSearchId},
        ${appearances[0].businessName},
        ${bizData.placeId || null},
        ${searchTerm},
        ${centerLat},
        ${centerLng},
        ${city},
        ${state},
        ${appearanceCount},
        ${totalGridPoints},
        ${(appearanceCount / totalGridPoints * 100).toFixed(2)},
        ${avgSponsoredRank},
        ${sponsoredRanks.length > 0 ? Math.min(...sponsoredRanks) : null},
        ${sponsoredRanks.length > 0 ? Math.max(...sponsoredRanks) : null},
        ${avgOverallPosition},
        ${avgRating},
        ${avgReviews},
        CURRENT_DATE
      )
      ON CONFLICT (grid_search_id, place_id) 
      DO UPDATE SET
        appearances_count = EXCLUDED.appearances_count,
        coverage_percentage = EXCLUDED.coverage_percentage,
        avg_sponsored_rank = EXCLUDED.avg_sponsored_rank,
        min_sponsored_rank = EXCLUDED.min_sponsored_rank,
        max_sponsored_rank = EXCLUDED.max_sponsored_rank,
        avg_overall_position = EXCLUDED.avg_overall_position,
        avg_rating = EXCLUDED.avg_rating,
        avg_reviews = EXCLUDED.avg_reviews
    `;
  });
  
  return {
    totalSponsors: sponsoredByBusiness.size,
    sponsorDetails: Array.from(sponsoredByBusiness.entries()).map(([key, data]) => ({
      business: key,
      placeId: data.placeId,
      appearances: data.appearances.length,
      coverage: `${data.appearances.length}/${totalGridPoints} (${(data.appearances.length / totalGridPoints * 100).toFixed(1)}%)`,
      avgSponsoredRank: data.appearances.reduce((a, b) => a + b.sponsoredRank, 0) / data.appearances.length
    }))
  };
}

// Query function to get sponsor insights
export async function getSponsorInsights(searchTerm: string, city?: string) {
  const baseQuery = city 
    ? sql`
        SELECT 
          business_name,
          place_id,
          AVG(coverage_percentage) as avg_coverage,
          AVG(avg_sponsored_rank) as avg_rank,
          COUNT(*) as search_count,
          MAX(search_date) as last_seen
        FROM sponsored_summary
        WHERE search_term = ${searchTerm} AND city = ${city}
        GROUP BY business_name, place_id
        ORDER BY avg_coverage DESC
      `
    : sql`
        SELECT 
          business_name,
          place_id,
          city,
          state,
          AVG(coverage_percentage) as avg_coverage,
          AVG(avg_sponsored_rank) as avg_rank,
          COUNT(*) as search_count,
          MAX(search_date) as last_seen
        FROM sponsored_summary
        WHERE search_term = ${searchTerm}
        GROUP BY business_name, place_id, city, state
        ORDER BY avg_coverage DESC
      `;
  
  return await baseQuery;
}
