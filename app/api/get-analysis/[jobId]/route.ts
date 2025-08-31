import { NextResponse } from 'next/server';
import { getJobResults, hasJobResults } from '@/lib/job-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  console.log(`🔍 Looking for results for job ${jobId}`);

  // Check if results exist for this job
  if (!hasJobResults(jobId)) {
    console.log(`❌ No results found for job ${jobId}`);
    return NextResponse.json(
      { error: 'Analysis results not available' },
      { status: 404 }
    );
  }

  const results = getJobResults(jobId);
  console.log(`✅ Found results for job ${jobId}:`, results.business?.name);
  console.log('🟢 DATA BEING RETURNED:', JSON.stringify(results, null, 2).substring(0, 1000));

  return NextResponse.json(results);
}
