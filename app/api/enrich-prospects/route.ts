import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const niche = searchParams.get('niche');
    const limit = searchParams.get('limit') || '10';
    const minReviews = searchParams.get('minReviews');
    const minRating = searchParams.get('minRating');
    const topRanked = searchParams.get('topRanked');
    
    // Build query to get prospects
    let query = `
      SELECT DISTINCT ON (p.place_id)
        p.*,
        sp.rank as search_rank
      FROM prospects p
      LEFT JOIN search_prospects sp ON p.place_id = sp.prospect_place_id
      WHERE p.enrichment_status = 'pending'
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (city) {
      conditions.push(`LOWER(p.search_city) = LOWER($${paramCount})`);
      values.push(city);
      paramCount++;
    }
    
    if (niche) {
      conditions.push(`LOWER(p.search_niche) = LOWER($${paramCount})`);
      values.push(niche);
      paramCount++;
    }
    
    if (minReviews) {
      conditions.push(`p.review_count >= $${paramCount}`);
      values.push(parseInt(minReviews));
      paramCount++;
    }
    
    if (minRating) {
      conditions.push(`p.rating >= $${paramCount}`);
      values.push(parseFloat(minRating));
      paramCount++;
    }
    
    if (topRanked) {
      conditions.push(`sp.rank <= $${paramCount}`);
      values.push(parseInt(topRanked));
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY p.place_id, sp.rank`;
    
    // Wrap in subquery for final ordering
    const finalQuery = `
      SELECT * FROM (${query}) AS filtered
      ORDER BY 
        review_count DESC NULLS LAST,
        rating DESC NULLS LAST,
        search_rank ASC NULLS LAST
      LIMIT $${paramCount}
    `;
    values.push(parseInt(limit));
    
    // Execute query
    const result = await sql.query(finalQuery, values);
    const prospects = result.rows;
    
    // Get statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN enrichment_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN enrichment_status = 'enriched' THEN 1 END) as enriched,
        COUNT(CASE WHEN enrichment_status = 'failed' THEN 1 END) as failed
      FROM prospects
    `;
    
    return NextResponse.json({
      prospects,
      stats: stats.rows[0],
      filters: {
        city,
        niche,
        limit,
        minReviews,
        minRating,
        topRanked
      }
    });
    
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prospects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, useAI = true, batchSize = 10 } = body;
    
    // Build command arguments
    const args: string[] = [];
    
    if (filters.city) args.push(`--city "${filters.city}"`);
    if (filters.niche) args.push(`--niche "${filters.niche}"`);
    if (filters.limit) args.push(`--limit ${filters.limit}`);
    if (filters.minReviews) args.push(`--min-reviews ${filters.minReviews}`);
    if (filters.minRating) args.push(`--min-rating ${filters.minRating}`);
    if (filters.topRanked) args.push(`--top-ranked ${filters.topRanked}`);
    if (!useAI) args.push('--no-ai');
    args.push(`--batch-size ${batchSize}`);
    
    // Path to the Python script
    const scriptPath = path.join(
      process.cwd(),
      '..',
      'production',
      'prospect_enrichment_orchestrator.py'
    );
    
    // Execute the enrichment script
    const command = `python3 "${scriptPath}" ${args.join(' ')}`;
    console.log('Executing:', command);
    
    // Start the enrichment process (non-blocking)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Enrichment error:', error);
      }
      console.log('Enrichment output:', stdout);
      if (stderr) {
        console.error('Enrichment stderr:', stderr);
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Enrichment process started',
      command
    });
    
  } catch (error) {
    console.error('Error starting enrichment:', error);
    return NextResponse.json(
      { error: 'Failed to start enrichment process' },
      { status: 500 }
    );
  }
}