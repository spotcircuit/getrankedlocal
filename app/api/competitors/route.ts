import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompetitorAnalysisByJobId, 
  getSearchesByTerm,
  getCompetitorByPlaceId
} from '@/lib/competitor-db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const searchTerm = searchParams.get('search_term');
    const placeId = searchParams.get('place_id');
    
    // Get by job_id
    if (jobId) {
      const data = await getCompetitorAnalysisByJobId(jobId);
      if (!data) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(data);
    }
    
    // Get all searches for a term
    if (searchTerm) {
      const searches = await getSearchesByTerm(searchTerm);
      return NextResponse.json({
        search_term: searchTerm,
        total_searches: searches.length,
        searches
      });
    }
    
    // Get competitor across all searches
    if (placeId) {
      const appearances = await getCompetitorByPlaceId(placeId);
      return NextResponse.json({
        place_id: placeId,
        total_appearances: appearances.length,
        appearances
      });
    }
    
    
    return NextResponse.json({
      message: 'Competitor API',
      endpoints: {
        'GET /api/competitors?job_id={id}': 'Get analysis by job ID',
        'GET /api/competitors?search_term={term}': 'Get all searches for a term',
        'GET /api/competitors?place_id={id}': 'Get prospect appearances across searches',
      }
    });
    
  } catch (error) {
    console.error('Competitor API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitor data' },
      { status: 500 }
    );
  }
}