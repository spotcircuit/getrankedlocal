import { NextRequest, NextResponse } from 'next/server';
// For DB persistence using raw grid results
import { saveGridSearch as saveGridSearchOptimized } from '@/lib/grid-search-storage-optimized';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      niche, 
      city, 
      state, 
      businessName,
      businessPlaceId,
      lat,  // From frontend
      lng,  // From frontend
      centerLat,  // Legacy support
      centerLng,  // Legacy support
      radiusMiles = 5,
      gridSize = 13 
    } = body;
    
    // Use lat/lng if provided, otherwise fall back to centerLat/centerLng
    const finalLat = lat !== undefined ? lat : centerLat;
    const finalLng = lng !== undefined ? lng : centerLng;

    if (!niche) {
      return NextResponse.json(
        { error: 'Search term (niche) is required' },
        { status: 400 }
      );
    }

    // Validate location parameters
    const hasCityState = city && state;
    const hasCoordinates = finalLat !== undefined && finalLng !== undefined;
    
    if (!hasCityState && !hasCoordinates) {
      return NextResponse.json(
        { error: 'Either city/state or centerLat/centerLng is required' },
        { status: 400 }
      );
    }

    // Prefer remote API if explicitly forced; otherwise try remote and fall back
    // Support a full URL override for convenience (e.g., https://host.tld/api/grid-search)
    const fullGridUrl = process.env.GRID_SEARCH_URL || process.env.NEXT_PUBLIC_GRID_SEARCH_URL || '';
    const apiUrl = process.env.RAILWAY_API_URL || process.env.NEXT_PUBLIC_LEADFINDER_API_URL;

    // Enforce max 30 miles radius
    const boundedRadius = Math.min(Number(radiusMiles) || 5, 30);

    // Get batch size from environment variable, default to 10 for safety
    const batchSize = parseInt(process.env.GRID_BATCH_SIZE || '10', 10);
    
    const searchParams = {
      niche,
      lat: finalLat,
      lng: finalLng,
      radius_miles: boundedRadius,
      grid_size: gridSize,
      batch_size: batchSize,
      business_name: businessName
    };

    console.log('🗺️ Initiating grid search:', searchParams);

    // Never hit remote when running on localhost/dev unless FORCE_REMOTE_GRID=1
    const hostHeader = request.headers.get('host') || '';
    const isHostLocal = /(^localhost(?::\d+)?$)|(^127\.0\.0\.1(?::\d+)?$)|((?:^|\.)local$)/i.test(hostHeader);
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
    const preferLocalRunner = (isDev || isHostLocal) && process.env.FORCE_REMOTE_GRID !== '1';

    if (preferLocalRunner) {
      console.log(`🧪 Local development detected (host: "${hostHeader}") – using local Python runner.`);
      const localResult = await tryLocalPython({
        niche,
        city,
        state,
        businessName,
        businessPlaceId,
        lat: finalLat,
        lng: finalLng,
        gridSize,
        radiusMiles: boundedRadius
      });
      if (localResult.ok) return NextResponse.json(localResult.payload);
      return NextResponse.json({ error: localResult.error || 'Grid search failed' }, { status: localResult.status || 500 });
    }

    // Try remote endpoint if configured; if FORCE_REMOTE_GRID=1, never use local runner
    if ((fullGridUrl || apiUrl) && process.env.FORCE_REMOTE_GRID === '1') {
      const urlToUse = fullGridUrl || `${apiUrl!.replace(/\/$/, '')}/api/grid-search`;
      console.log(`📡 Using Grid URL (forced): ${urlToUse}`);
      const remoteResult = await tryRemote(urlToUse, searchParams, true);
      if (remoteResult.ok) return NextResponse.json(remoteResult.payload);
      console.warn('Remote grid-search failed, not falling back because FORCE_REMOTE_GRID=1');
      return NextResponse.json({ error: remoteResult.error || 'Remote grid-search failed' }, { status: remoteResult.status || 502 });
    }

    if (fullGridUrl || apiUrl) {
      const urlToUse = fullGridUrl || `${apiUrl!.replace(/\/$/, '')}/api/grid-search`;
      console.log(`📡 Using Grid URL: ${urlToUse}`);
      const remoteResult = await tryRemote(urlToUse, searchParams, true);
      if (remoteResult.ok) return NextResponse.json(remoteResult.payload);
      // No fallback in production: surface remote error as-is
      return NextResponse.json({ error: remoteResult.error || 'Remote grid-search failed' }, { status: remoteResult.status || 502 });
    }

    // If no remote URL configured and not local/dev, return configuration error
    return NextResponse.json({ error: 'GRID_SEARCH_URL (or RAILWAY_API_URL) not configured' }, { status: 500 });
    
  } catch (error) {
    console.error('Grid search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform grid search' },
      { status: 500 }
    );
  }
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

// Attempt calling remote grid-search service. If it returns data in an unknown shape, we simply pass it through
async function tryRemote(url: string, searchParams: any, isFullUrl = false): Promise<{ ok: boolean; payload?: any; status?: number; error?: string; }> {
  try {
    const endpoint = isFullUrl ? url : `${url.replace(/\/$/, '')}/api/grid-search`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Grid search API error:', response.status, errorText);
      return { ok: false, status: response.status, error: errorText || response.statusText };
    }

    const data = await response.json();

    // Best-effort normalization to gridData shape if we detect raw_results-like structure
    if (data && (Array.isArray(data.raw_results) || Array.isArray(data.grid_results))) {
      const processed = processGridResultsFromRaw(data, searchParams.business_name);
      return { ok: true, payload: { success: true, gridData: processed } };
    }

    // Otherwise, return as-is; UI code should handle this or we can extend mapping later
    return { ok: true, payload: data };
  } catch (e: any) {
    console.error('Remote grid-search fetch failed:', e);
    return { ok: false, status: 502, error: e?.message || 'Network error' };
  }
}

// Run the local Python production script (only works off-Vercel/serverless)
async function tryLocalPython(opts: {
  niche: string;
  city?: string;
  state?: string;
  businessName?: string;
  businessPlaceId?: string;
  lat?: number;
  lng?: number;
  gridSize: number;
  radiusMiles: number;
}): Promise<{ ok: boolean; payload?: any; status?: number; error?: string; }> {
  try {
    // Guard for serverless/edge
    if (process.env.VERCEL || process.env.NEXT_RUNTIME === 'edge') {
      return { ok: false, status: 400, error: 'Local Python grid search is disabled in this environment. Configure RAILWAY_API_URL.' };
    }

    const sessionId = `grid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const scriptPath = path.join(process.cwd(), '..', 'production', 'grid_search_PROD.py');
    const configPath = path.join(process.cwd(), '..', 'production', 'temp_configs', `${sessionId}.json`);

    await fs.mkdir(path.dirname(configPath), { recursive: true });

    const config = {
      target_business: opts.businessName || null,
      location: (opts.lat && opts.lng) ? `${opts.lat},${opts.lng}` : `${opts.city || ''}, ${opts.state || ''}`.trim(),
      niche: opts.niche || 'business',
      session_id: sessionId,
      silent: true,
      headless: true,
      grid_size: opts.gridSize,
      radius_miles: Math.min(Number(opts.radiusMiles) || 5, 30),
      city: opts.city,
      state: opts.state,
      lat: opts.lat,
      lng: opts.lng,
      center_lat: opts.lat,
      center_lng: opts.lng
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // Execute Python script
    let cmd = `python3 "${scriptPath}" --config "${configPath}" --headless --silent`;
    try { await execAsync('which python3'); } catch { cmd = `python "${scriptPath}" --config "${configPath}" --headless --silent`; }
    const { stdout, stderr } = await execAsync(cmd, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 });
    if (stderr && !/WARNING/i.test(stderr)) console.error('Grid search stderr:', stderr);

    // Parse JSON emitted in silent mode
    let parsed: any;
    try {
      const match = stdout.match(/\{[\s\S]*\}\s*$/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = JSON.parse(stdout.trim());
    } catch (e) {
      console.error('Failed to parse stdout JSON. Last 500 chars:', stdout.slice(-500));
      throw new Error('Failed to parse grid search results');
    }

    // If we got a pointer to a results file, read it
    let results = parsed;
    if (parsed && parsed.success && parsed.results_file && !parsed.raw_results) {
      const content = await fs.readFile(parsed.results_file, 'utf-8');
      results = JSON.parse(content);
    }

    // Cleanup temp file
    await fs.unlink(configPath).catch(() => {});

    // Process to UI-friendly shape
    const gridData = processGridResultsFromRaw(results, opts.businessName);
    const payload = { success: true, sessionId, gridData, elapsedSeconds: results.execution?.duration_seconds || 0, raw: results };

    // Save to DB (fire-and-forget)
    const rawResults = Array.isArray(results.raw_results) ? results.raw_results : [];
    const gridRows = Math.max(...rawResults.map((p: any) => p?.point?.grid_row ?? 0)) + 1 || opts.gridSize;
    const gridCols = Math.max(...rawResults.map((p: any) => p?.point?.grid_col ?? 0)) + 1 || opts.gridSize;
    const totalGridPoints = gridRows * gridCols;
    saveGridSearchOptimized({
      searchTerm: opts.niche,
      centerLat: (results.config?.center_lat ?? opts.lat) as number,
      centerLng: (results.config?.center_lng ?? opts.lng) as number,
      city: opts.city,
      state: opts.state,
      searchMode: opts.businessName ? 'targeted' : 'all_businesses',
      initiatedBy: opts.businessName ? { name: opts.businessName, placeId: opts.businessPlaceId || undefined } : undefined,
      gridSize: totalGridPoints,
      gridRows,
      gridCols,
      searchRadiusMiles: Math.min(Number(opts.radiusMiles) || 5, 30),
      executionTime: results.execution?.duration_seconds || 0,
      sessionId,
      rawResults
    }).then((res) => {
      if (res.success) console.log(`✅ Grid search saved to database with ID: ${res.searchId}`);
      else console.error('⚠️ Failed to save grid search to database:', res.error);
    }).catch(err => console.error('⚠️ Database save error:', err));

    return { ok: true, payload };
  } catch (e: any) {
    console.error('Local Python grid search failed:', e);
    return { ok: false, status: 500, error: e?.message || 'Execution error' };
  }
}

// Convert raw results (either from Python PROD or similar) into the gridData shape expected by the UI
function processGridResultsFromRaw(results: any, targetBusinessName?: string | null) {
  const gridPoints: any[] = [];
  const rawPoints = Array.isArray(results.raw_results) ? results.raw_results : [];
  const targetBusiness = results.target_business || null;
  const searchTerm = results.search_params?.search_term || results.config?.search_term || results.search_term || 'business';

  // Compute grid size from data
  let gridRows = 0, gridCols = 0;
  rawPoints.forEach((p: any) => {
    if (!p?.point) return;
    if (typeof p.point.grid_row === 'number') gridRows = Math.max(gridRows, p.point.grid_row + 1);
    if (typeof p.point.grid_col === 'number') gridCols = Math.max(gridCols, p.point.grid_col + 1);
  });
  const totalPoints = gridRows * gridCols || (results.search_params?.total_searches ?? 0);

  // Build competitor appearance matrix for richer ranking data
  const competitorRankMatrix: Record<string, number[]> = {};

  for (const point of rawPoints) {
    if (!point?.success) continue;
    const idx = (point.point.grid_row || 0) * (gridCols || 13) + (point.point.grid_col || 0);

    // Compute target rank for this cell
    let targetRank = 999;
    if (targetBusiness && Array.isArray(targetBusiness.appearances) && Array.isArray(targetBusiness.ranks)) {
      const pos = targetBusiness.appearances.indexOf(idx);
      if (pos !== -1) targetRank = targetBusiness.ranks[pos] ?? 999;
    } else if (targetBusinessName) {
      const targetLower = targetBusinessName.toLowerCase();
      for (const biz of (point.results || [])) {
        const name = (biz.name || '').toLowerCase();
        const tokens = targetLower.split(/\s+/).filter(w => w.length > 2);
        const match = tokens.length ? tokens.every(t => name.includes(t)) : name.includes(targetLower);
        if (match) { targetRank = biz.rank ?? 999; break; }
      }
    }

    gridPoints.push({
      lat: point.point.lat,
      lng: point.point.lng,
      gridRow: point.point.grid_row,
      gridCol: point.point.grid_col,
      targetRank,
      totalResults: (point.results || []).length,
      topCompetitors: (point.results || []).slice(0, 20).map((b: any) => ({
        name: b.name,
        rank: b.rank,
        rating: b.rating || 0,
        reviews: b.reviews || 0
      }))
    });

    // Fill competitor rank matrix
    (point.results || []).slice(0, 50).forEach((b: any) => {
      if (!competitorRankMatrix[b.name]) competitorRankMatrix[b.name] = Array(totalPoints).fill(999);
      competitorRankMatrix[b.name][idx] = typeof b.rank === 'number' ? b.rank : 999;
    });
  }

  // Aggregate competitors
  const competitorMap = new Map<string, any>();
  for (const point of rawPoints) {
    if (!point?.success) continue;
    for (const biz of (point.results || [])) {
      const key = biz.name;
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
        if (!existing.rating && biz.rating) existing.rating = biz.rating;
        if (!existing.reviews && biz.reviews) existing.reviews = biz.reviews;
        if (!existing.address && biz.address) existing.address = biz.address;
        if (!existing.phone && biz.phone) existing.phone = biz.phone;
      }
    }
  }
  const competitors = Array.from(competitorMap.values()).map(c => ({
    ...c,
    avgRank: (c.totalRank / c.appearances).toFixed(1),
    coverage: ((c.appearances / (totalPoints || rawPoints.length || 1)) * 100).toFixed(1),
    rating: typeof c.rating === 'number' ? c.rating : parseFloat(c.rating) || 0,
    reviews: typeof c.reviews === 'number' ? c.reviews : parseInt(c.reviews) || 0
  })).sort((a, b) => b.appearances - a.appearances).slice(0, 50);

  // Center
  const successfulPoints = rawPoints.filter((p: any) => p?.success && typeof p.point?.lat === 'number' && typeof p.point?.lng === 'number');
  const avgLat = successfulPoints.length ? successfulPoints.reduce((s: number, p: any) => s + p.point.lat, 0) / successfulPoints.length : 0;
  const avgLng = successfulPoints.length ? successfulPoints.reduce((s: number, p: any) => s + p.point.lng, 0) / successfulPoints.length : 0;
  const centerLat = (results.config?.center_lat ?? results.raw_results?.[0]?.point?.center_lat ?? results.config?.lat ?? avgLat) as number;
  const centerLng = (results.config?.center_lng ?? results.raw_results?.[0]?.point?.center_lng ?? results.config?.lng ?? avgLng) as number;

  // Target details
  let targetRating: number | null = null;
  let targetReviews: number | null = null;
  if (targetBusinessName) {
    for (const point of rawPoints) {
      if (!point?.success) continue;
      for (const biz of (point.results || [])) {
        const nameLower = (biz.name || '').toLowerCase();
        const targetLower = targetBusinessName.toLowerCase();
        const tokens = targetLower.split(/\s+/).filter(w => w.length > 2);
        const match = tokens.length ? tokens.every(t => nameLower.includes(t)) : nameLower.includes(targetLower);
        if (match) { targetRating = biz.rating || null; targetReviews = biz.reviews || 0; break; }
      }
      if (targetRating !== null) break;
    }
  }

  const pointsWithBusiness = gridPoints.filter(gp => gp.targetRank < 999).length;
  const coverage = ((pointsWithBusiness / (totalPoints || gridPoints.length || 1)) * 100).toFixed(1);

  return {
    gridPoints,
    searchTerm,
    targetBusiness: targetBusinessName ? {
      name: targetBusinessName,
      lat: centerLat,
      lng: centerLng,
      rating: targetBusiness?.rating !== undefined ? targetBusiness.rating : targetRating,
      reviews: targetBusiness?.reviews !== undefined ? targetBusiness.reviews : targetReviews,
      coverage: parseFloat(coverage),
      pointsFound: targetBusiness?.appearances !== undefined ? targetBusiness.appearances : pointsWithBusiness,
      totalPoints: totalPoints || gridPoints.length,
      avgRank: targetBusiness?.avg_rank !== undefined ? targetBusiness.avg_rank : (targetBusiness && Array.isArray(targetBusiness.ranks) && targetBusiness.ranks.length > 0 ? targetBusiness.ranks.reduce((a: number, b: number) => a + b, 0) / targetBusiness.ranks.length : 999),
      bestRank: targetBusiness?.best_rank !== undefined ? targetBusiness.best_rank : (targetBusiness && Array.isArray(targetBusiness.ranks) && targetBusiness.ranks.length > 0 ? Math.min(...targetBusiness.ranks) : 999),
      worstRank: targetBusiness?.worst_rank !== undefined ? targetBusiness.worst_rank : (targetBusiness && Array.isArray(targetBusiness.ranks) && targetBusiness.ranks.length > 0 ? Math.max(...targetBusiness.ranks) : 999)
    } : null,
    competitors,
    competitorRankMatrix,
    summary: {
      totalUniqueBusinesses: competitors.length,
      successRate: ((results.execution?.successful || 0) / (totalPoints || 169) * 100).toFixed(1),
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
