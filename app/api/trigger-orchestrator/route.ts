import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, niche, city, state, place_id } = body;

    // Validate required fields
    if (!business_name || !niche || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name, niche, city, state' },
        { status: 400 }
      );
    }

    // Extract just the business name (remove address if present)
    const cleanBusinessName = business_name.split(',')[0].trim();
    
    console.log('🚀 Calling single business analysis service for:', {
      original_business_name: business_name,
      clean_business_name: cleanBusinessName,
      niche,
      city,
      state,
      place_id
    });

    // Call the Railway job-based API
    const apiUrl = process.env.RAILWAY_API_URL || 'https://leadfinderparallel-production.up.railway.app';
    
    // Prepare the request payload
    const requestPayload = {
      niche: niche,
      location: `${city}, ${state}`,
      target_business: {
        name: cleanBusinessName,  // Use clean name without address
        place_id: place_id,       // Primary matching should use place_id
        original_name: business_name  // Keep original for reference
      }
    };
    
    console.log('📤 SENDING TO RAILWAY API:', JSON.stringify(requestPayload, null, 2));
    
    // Step 1: Start the job
    const startJobResponse = await fetch(`${apiUrl}/api/single-business-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!startJobResponse.ok) {
      const errorText = await startJobResponse.text().catch(() => 'Unknown error');
      throw new Error(`Failed to start analysis: ${startJobResponse.status} - ${errorText}`);
    }

    const { job_id } = await startJobResponse.json();
    console.log(`📋 Job started with ID: ${job_id}`);

    // Step 2: Poll for results (max 3 minutes)
    const maxPollingTime = 180000; // 3 minutes
    const pollInterval = 3000; // Check every 3 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollingTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const jobStatusResponse = await fetch(`${apiUrl}/api/job/${job_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!jobStatusResponse.ok) {
        console.error(`Failed to check job status: ${jobStatusResponse.status}`);
        continue;
      }

      const jobData = await jobStatusResponse.json();
      console.log(`⏳ Job status: ${jobData.status} (elapsed: ${jobData.elapsed || 0}s)`);

      if (jobData.status === 'completed') {
        console.log(`✅ Single business analysis complete for ${business_name}`);
        
        // Log the entire job data to see its structure
        console.log('🔍 FULL JOB DATA STRUCTURE:', JSON.stringify(jobData, null, 2));
        
        // Store the results in the shared job store
        const { storeJobResults } = await import('@/lib/job-store');
        
        // The actual data might be in jobData directly, not jobData.result
        const analysisData = jobData.result || jobData.data || jobData;
        console.log('📦 Storing analysis data:', analysisData?.business?.name || 'Unknown structure');
        
        // Log competitor data details
        console.log('🏢 Competitor data breakdown:');
        console.log('  - top_competitors count:', analysisData?.top_competitors?.length || 0);
        console.log('  - all_competitors count:', analysisData?.all_competitors?.length || 0);
        console.log('  - competitors count:', analysisData?.competitors?.length || 0);
        console.log('  - market_analysis.competitors count:', analysisData?.market_analysis?.competitors?.length || 0);
        console.log('  - Available keys:', Object.keys(analysisData || {}));
        storeJobResults(job_id, analysisData);
        
        return NextResponse.json({
          success: true,
          analysis: analysisData,
          job_id: job_id,
          processing_time: jobData.processing_time,
          message: 'Single business analysis completed successfully'
        });
      }

      if (jobData.status === 'failed') {
        throw new Error(`Analysis failed: ${jobData.error || 'Unknown error'}`);
      }
    }

    throw new Error('Analysis timeout: Job did not complete within 3 minutes');

  } catch (error) {
    console.error('Single business analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform single business analysis';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
