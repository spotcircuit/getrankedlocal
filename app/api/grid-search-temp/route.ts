/**
 * Temporary Grid Search API for businesses not in database
 * This runs a real-time grid search and saves results for immediate display
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { saveGridSearch } from '@/lib/grid-search-storage-optimized';

const execAsync = promisify(exec);

export const maxDuration = 300; // 5 minutes max for grid search

export async function POST(request: NextRequest) {
  try {
    const { businessName, businessPlaceId, city, state, niche, lat, lng, gridSize, radiusMiles } = await request.json();
    
    if (!city || !state) {
      return NextResponse.json(
        { error: 'City and state are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting grid search for: ${businessName || niche || 'all businesses'} in ${city}, ${state}`);
    console.log(`📍 Received coordinates: lat=${lat}, lng=${lng}`);
    
    // For targeted searches, coordinates are REQUIRED
    if (businessName && (!lat || !lng)) {
      console.warn('⚠️  WARNING: Targeted search without coordinates! This will use city center instead of business location.');
    }
    
    // Enforce max 30 miles coverage radius
    const boundedRadius = Math.min(Number(radiusMiles) || 5, 30);

    // Create a unique session ID for this search
    const sessionId = `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare the Python script path - using PRODUCTION version
    const scriptPath = path.join(
      process.cwd(),
      '..',
      'production',
      'grid_search_PROD.py'
    );
    
    // Create a temporary config file for the search
    const configPath = path.join(
      process.cwd(),
      '..',
      'production',
      'temp_configs',
      `${sessionId}.json`
    );
    
    // Ensure temp directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    
    // Write config for the Python script (matching grid_search_api.py format)
    const config = {
      target_business: businessName || null,  // Optional now
      location: lat && lng ? `${lat},${lng}` : `${city}, ${state}`,  // Use coords if available
      search_term: niche || 'business',  // grid_search_api uses 'search_term' not 'niche'
      niche: niche || 'business',  // Keep both for compatibility
      session_id: sessionId,
      silent: true,  // Suppress output for cleaner logs
      headless: true,  // Run browser in headless mode
      // Grid configuration from modal
      grid_size: gridSize || 13,  // Default to 13x13
      radius_miles: boundedRadius || 5,  // Default to 5 miles, capped at 30
      // Store original location info for display/storage
      city,
      state,
      lat,
      lng,
      // Also store explicit center fields for downstream usage
      center_lat: lat,
      center_lng: lng
    };
    
    console.log(`🎯 Config location being sent: ${config.location}`);
    console.log(`📌 Location source: ${lat && lng ? 'Business coordinates from autocomplete' : 'City/State string (will use city center)'}`);
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Run the Python script with the config
    console.log(`⚡ Executing grid search with session ${sessionId}`);
    
    // Track start time for elapsed calculation
    const startTime = Date.now();
    
    try {
      // Modified to pass config file instead of interactive input
      // Try python3 first, then python
      let command = `python3 "${scriptPath}" --config "${configPath}" --headless --silent`;
      try {
        await execAsync('which python3');
      } catch {
        // If python3 not found, try python
        command = `python "${scriptPath}" --config "${configPath}" --headless --silent`;
      }
      
      const { stdout, stderr } = await execAsync(
        command,
        {
          timeout: 180000, // 3 minutes timeout
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('Grid search stderr:', stderr);
      }
      
      // Parse results directly from stdout (Python now returns JSON to stdout in silent mode)
      let results;
      try {
        // Try to find a complete JSON object in the output
        // Look for the main output structure that starts with search_params
        const jsonMatch = stdout.match(/\{[^{}]*"search_params"[\s\S]*\}(?=\s*$)/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          results = JSON.parse(jsonStr);
        } else {
          // Fallback: try to parse the entire stdout if it's valid JSON
          try {
            results = JSON.parse(stdout.trim());
          } catch {
            // Last resort: try to find any JSON object at the end
            const lastBrace = stdout.lastIndexOf('}');
            const firstBrace = stdout.lastIndexOf('{', lastBrace - 1);
            
            if (firstBrace >= 0 && lastBrace >= 0) {
              // Find the matching opening brace by counting
              let openCount = 0;
              let startPos = lastBrace;
              
              for (let i = lastBrace; i >= 0; i--) {
                if (stdout[i] === '}') openCount++;
                if (stdout[i] === '{') openCount--;
                if (openCount === 0) {
                  startPos = i;
                  break;
                }
              }
              
              const possibleJson = stdout.substring(startPos, lastBrace + 1);
              results = JSON.parse(possibleJson);
            } else {
              console.error('No valid JSON structure found in output');
              throw new Error('Grid search did not return valid JSON');
            }
          }
        }
      } catch (parseError) {
        console.error('Failed to parse grid search output:', parseError);
        console.error('Stdout length:', stdout.length);
        console.error('Last 500 chars:', stdout.slice(-500));
        throw new Error('Failed to parse grid search results');
      }
      
      // If we got a simple success response with file path, read the actual results
      if (results.success && results.results_file && !results.raw_results) {
        console.log('Reading results from file:', results.results_file);
        const resultsContent = await fs.readFile(results.results_file, 'utf-8');
        results = JSON.parse(resultsContent);
      }
      
      // Clean up temp files
      await fs.unlink(configPath).catch(() => {});
      
      // Calculate elapsed time
      const elapsedMs = Date.now() - startTime;
      const elapsedSeconds = Math.round(elapsedMs / 1000);
      
      // Process results for frontend display
      const processedResults = processGridResults(results, businessName);
      
      // Add elapsed time to processed results (loosen typing)
      ((processedResults as any).summary as any).elapsedTime = elapsedSeconds;
      
      console.log(`✅ Grid search completed in ${elapsedSeconds} seconds`);
      
      // Return results immediately to frontend
      const response = NextResponse.json({
        success: true,
        sessionId,
        gridData: processedResults,
        elapsedSeconds,
        raw: results
      });
      
      // Save to database asynchronously (don't wait for it)
      console.log('💾 Queueing database save...');
      
      // Get center coordinates from the first result or config
      const centerLat = results.config?.center_lat || 
                       results.raw_results?.[0]?.point?.center_lat ||
                       results.config?.lat ||
                       (processedResults.targetBusiness ? processedResults.targetBusiness.lat : 0);
      const centerLng = results.config?.center_lng || 
                       results.raw_results?.[0]?.point?.center_lng ||
                       results.config?.lng ||
                       (processedResults.targetBusiness ? processedResults.targetBusiness.lng : 0);
      
      // Derive grid dimensions from results
      let gridRows = 13;
      let gridCols = 13;
      try {
        const pts = (results.raw_results || []).filter((p: any) => p && p.point && Number.isInteger(p.point.grid_row) && Number.isInteger(p.point.grid_col));
        if (pts.length > 0) {
          const maxRow = pts.reduce((m: number, p: any) => Math.max(m, p.point.grid_row), 0);
          const maxCol = pts.reduce((m: number, p: any) => Math.max(m, p.point.grid_col), 0);
          gridRows = (maxRow + 1) || gridRows;
          gridCols = (maxCol + 1) || gridCols;
        }
      } catch {}
      const totalGridPoints = gridRows * gridCols;

      // Fire and forget - save to DB in background
      saveGridSearch({
        searchTerm: niche || 'business',
        centerLat,
        centerLng,
        city,
        state,
        searchMode: businessName ? 'targeted' : 'all_businesses',
        initiatedBy: businessName ? {
          name: businessName,
          placeId: businessPlaceId || null
        } : undefined,
        gridSize: totalGridPoints,
        gridRows,
        gridCols,
        searchRadiusMiles: boundedRadius,
        executionTime: results.execution?.duration_seconds || processedResults.summary.executionTime,
        sessionId,
        rawResults: results.raw_results || []
      }).then(dbSaveResult => {
        if (dbSaveResult.success) {
          console.log(`✅ Grid search saved to database with ID: ${dbSaveResult.searchId}`);
        } else {
          console.error('⚠️ Failed to save grid search to database:', dbSaveResult.error);
        }
      }).catch(error => {
        console.error('⚠️ Database save error:', error);
      });
      
      return response;
      
    } catch (execError: any) {
      console.error('Grid search execution failed:', execError);
      
      // Clean up on error
      await fs.unlink(configPath).catch(() => {});
      
      return NextResponse.json(
        { 
          error: 'Grid search failed', 
          details: execError.message,
          sessionId 
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Grid search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function processGridResults(results: any, targetBusinessName: string | null | undefined) {
  // Extract grid data for visualization
  const gridPoints = [];
  const targetBusiness = results.target_business || null;
  const searchTerm = results.search_params?.search_term || results.config?.search_term || 'business';
  
  // Log first point to debug
  if (results.raw_results && results.raw_results.length > 0) {
    console.log('First grid point data:', JSON.stringify(results.raw_results[0], null, 2));
  }
  
  // If we have target business data from Python, log it
  if (targetBusiness) {
    console.log(`Target business from Python: ${targetBusiness.name}, appearances: ${targetBusiness.appearances?.length || targetBusiness.appearances || 0}`);
    console.log(`Target business data:`, targetBusiness);
  }
  
  // Process each grid point
  for (const point of results.raw_results || []) {
    if (!point.success) continue;
    
    // Find target business rank at this point
    let targetRank = 999; // Not found
    
    // Check if this grid point index is in the target business appearances
    if (targetBusiness && Array.isArray(targetBusiness.appearances) && targetBusiness.appearances.length > 0) {
      const gridIndex = point.point.grid_row * 13 + point.point.grid_col;
      const appearanceIndex = targetBusiness.appearances.indexOf(gridIndex);
      if (appearanceIndex !== -1 && targetBusiness.ranks) {
        targetRank = targetBusiness.ranks[appearanceIndex];
        console.log(`Found target at grid point ${gridIndex} (${point.point.grid_row},${point.point.grid_col}) with rank ${targetRank}`);
      }
    } else if (targetBusinessName) {
      // Fallback: search through results if no target business data from Python
      for (const biz of point.results) {
        // More flexible matching - check if business name contains key words
        const bizNameLower = biz.name.toLowerCase();
        const targetNameLower = targetBusinessName.toLowerCase();
        
        // Split target name into words and check if all significant words are present
        const targetWords = targetNameLower.split(/\s+/).filter(w => w.length > 2);
        const matchesAllWords = targetWords.every(word => bizNameLower.includes(word));
        
        if (matchesAllWords || bizNameLower.includes(targetNameLower)) {
          targetRank = biz.rank;
          console.log(`Found target "${targetBusinessName}" at rank ${targetRank} (grid ${point.point.grid_row},${point.point.grid_col})`);
          break;
        }
      }
    }
    
    gridPoints.push({
      lat: point.point.lat,
      lng: point.point.lng,
      gridRow: point.point.grid_row,
      gridCol: point.point.grid_col,
      targetRank,
      totalResults: point.results.length,
      topCompetitors: point.results.slice(0, 20).map((b: any) => ({
        name: b.name,
        rank: b.rank,
        rating: b.rating,
        reviews: b.reviews
      }))
    });
  }
  
  // Calculate coverage stats from the actual data
  const totalPoints = gridPoints.length;
  const pointsWithBusiness = targetBusiness && Array.isArray(targetBusiness.appearances) ? 
    targetBusiness.appearances.length : 
    gridPoints.filter(p => p.targetRank < 999).length;
  const coverage = pointsWithBusiness > 0 ? 
    (pointsWithBusiness / totalPoints * 100).toFixed(1) : 
    '0.0';
  
  // Get unique competitors across all points - USE PLACE_ID for deduplication
  const competitorMap = new Map();
  for (const point of results.raw_results || []) {
    if (!point.success) continue;
    for (const biz of point.results) {
      // Use place_id if available, otherwise fall back to name
      const key = biz.place_id || biz.name;
      
      if (!competitorMap.has(key)) {
        competitorMap.set(key, {
          name: biz.name,
          place_id: biz.place_id,
          rating: biz.rating || 0,
          reviews: biz.reviews || 0,
          address: biz.address,
          phone: biz.phone,
          business_type: biz.business_type,
          lat: biz.lat,
          lng: biz.lng,
          appearances: 1,
          totalRank: biz.rank
        });
      } else {
        const existing = competitorMap.get(key);
        existing.appearances++;
        existing.totalRank += biz.rank;
        // Update with better data if available
        if (!existing.rating && biz.rating) existing.rating = biz.rating;
        if (!existing.reviews && biz.reviews) existing.reviews = biz.reviews;
        if (!existing.address && biz.address) existing.address = biz.address;
        if (!existing.phone && biz.phone) existing.phone = biz.phone;
      }
    }
  }
  
  // Sort competitors by coverage
  const competitors = Array.from(competitorMap.values())
    .map(c => ({
      ...c,
      avgRank: (c.totalRank / c.appearances).toFixed(1),
      coverage: ((c.appearances / totalPoints) * 100).toFixed(1),
      // Ensure rating and reviews are numbers for display
      rating: typeof c.rating === 'number' ? c.rating : parseFloat(c.rating) || 0,
      reviews: typeof c.reviews === 'number' ? c.reviews : parseInt(c.reviews) || 0
    }))
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 20);
  
  // Derive a robust center for map/target marker
  const rawPoints = Array.isArray(results.raw_results) ? results.raw_results : [];
  const successfulPoints = rawPoints.filter((p: any) => p && p.success && p.point && typeof p.point.lat === 'number' && typeof p.point.lng === 'number');
  const avgLat = successfulPoints.length ? successfulPoints.reduce((s: number, p: any) => s + p.point.lat, 0) / successfulPoints.length : 0;
  const avgLng = successfulPoints.length ? successfulPoints.reduce((s: number, p: any) => s + p.point.lng, 0) / successfulPoints.length : 0;
  const centerLat = (results.config?.center_lat ?? results.raw_results?.[0]?.point?.center_lat ?? results.config?.lat ?? avgLat) as number;
  const centerLng = (results.config?.center_lng ?? results.raw_results?.[0]?.point?.center_lng ?? results.config?.lng ?? avgLng) as number;
  
  // Find target business rating and reviews from raw results
  let targetRating = null;
  let targetReviews = null;
  if (targetBusinessName) {
    for (const point of results.raw_results || []) {
      if (!point.success) continue;
      for (const biz of point.results) {
        const bizNameLower = biz.name.toLowerCase();
        const targetNameLower = targetBusinessName.toLowerCase();
        
        // Check if this is our target business
        const targetWords = targetNameLower.split(/\s+/).filter(w => w.length > 2);
        const matchesAllWords = targetWords.every(word => bizNameLower.includes(word));
        
        if (matchesAllWords || bizNameLower.includes(targetNameLower)) {
          targetRating = biz.rating || null;
          targetReviews = biz.reviews || 0;
          console.log(`Found target business rating: ${targetRating}, reviews: ${targetReviews}`);
          break;
        }
      }
      if (targetRating !== null) break;
    }
  }
  
  return {
    gridPoints,
    searchTerm,
    targetBusiness: targetBusinessName ? {
      name: targetBusinessName,
      lat: centerLat,
      lng: centerLng,
      rating: targetBusiness?.rating !== undefined ? targetBusiness.rating : targetRating,
      reviews: targetBusiness?.reviews !== undefined ? targetBusiness.reviews : targetReviews,
      coverage: targetBusiness?.coverage !== undefined ? targetBusiness.coverage : parseFloat(coverage),
      pointsFound: targetBusiness?.appearances !== undefined ? targetBusiness.appearances : pointsWithBusiness,
      totalPoints,
      avgRank: targetBusiness?.avg_rank !== undefined ? targetBusiness.avg_rank : 
        (targetBusiness && Array.isArray(targetBusiness.ranks) && targetBusiness.ranks.length > 0 ? 
          targetBusiness.ranks.reduce((a: number, b: number) => a + b, 0) / targetBusiness.ranks.length : 999),
      bestRank: targetBusiness?.best_rank !== undefined ? targetBusiness.best_rank :
        (targetBusiness && Array.isArray(targetBusiness.ranks) && targetBusiness.ranks.length > 0 ? 
          Math.min(...targetBusiness.ranks) : 999),
      worstRank: targetBusiness?.worst_rank !== undefined ? targetBusiness.worst_rank :
        (targetBusiness && Array.isArray(targetBusiness.ranks) && targetBusiness.ranks.length > 0 ? 
          Math.max(...targetBusiness.ranks) : 999)
    } : null,
    competitors,
    summary: {
      totalUniqueBusinesses: competitorMap.size,
      successRate: ((results.execution?.successful || 0) / 169 * 100).toFixed(1),
      executionTime: results.execution?.duration_seconds || 0
    },
    location: {
      city: results.config?.city || results.search_params?.city || '',
      state: results.config?.state || results.search_params?.state || '',
      centerLat,
      centerLng
    }
  };
}
