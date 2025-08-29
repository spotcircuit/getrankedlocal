export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '5');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);

    // Search leads by business name, city, or state
    const searchTerm = query?.toLowerCase() || '';

    const leads = await sql`
      SELECT
        id::int AS id,
        business_name,
        city,
        state,
        CAST(rating AS float) AS rating,
        review_count::int AS review_count,
        website,
        phone,
        street_address,
        source_directory
      FROM leads
      WHERE
        LOWER(TRIM(business_name)) LIKE '%' || ${searchTerm} || '%' OR
        LOWER(TRIM(city)) LIKE '%' || ${searchTerm} || '%' OR
        LOWER(TRIM(state)) LIKE '%' || ${searchTerm} || '%' OR
        LOWER(TRIM(street_address)) LIKE '%' || ${searchTerm} || '%'
      ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST
      LIMIT ${limit}
    `;

    console.log(`✅ Search leads API: Found ${leads.length} results for query "${query}"`);

    return NextResponse.json({
      success: true,
      query: query,
      results: leads,
      count: leads.length,
      limit: limit
    });

  } catch (error: any) {
    console.error('Search leads API error:', error);
    return NextResponse.json(
      { error: 'Failed to search leads', message: error?.message },
      { status: 500 }
    );
  }
}
