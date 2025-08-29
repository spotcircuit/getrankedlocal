import { NextResponse } from 'next/server';

// Simple in-memory store for any job ID
const jobStore = new Map();

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  // Always return completed status for any job ID
  const job = {
    id: jobId,
    status: 'completed',
    progress: 100,
    message: 'Analysis complete!',
    analysis_available: true,
    results: {
      summary: 'Analysis finished successfully',
      recommendations: ['Optimize GMB', 'Get reviews', 'Improve SEO'],
      timeline: '90 days'
    },
    createdAt: new Date().toISOString()
  };

  // Store the job for consistency
  jobStore.set(jobId, job);

  console.log(`✅ Job ${jobId}: COMPLETED`);

  return NextResponse.json(job);
}
