import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, niche, city, state, place_id, geometry } = body;

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
    const apiUrl = (process.env.RAILWAY_API_URL || 'https://leadfinderparallel-production.up.railway.app').trim();
    
    // Prepare the request payload
    // Validate keyword/niche is appropriate for the business
    const businessNameLower = cleanBusinessName.toLowerCase();
    const nicheLower = niche.toLowerCase();
    
    // Prevent inappropriate keyword combinations
    if ((businessNameLower.includes('hair') || businessNameLower.includes('salon') || businessNameLower.includes('barber')) 
        && (nicheLower === 'med spa' || nicheLower === 'med spas' || nicheLower === 'medical spa')) {
      console.error('❌ Invalid keyword combination: Hair/salon business with med spa keyword');
      return NextResponse.json({ 
        error: 'Invalid keyword combination',
        message: 'Please use an appropriate keyword for this business type (e.g., "hair salon", "barber shop", etc.)'
      }, { status: 400 });
    }
    
    const requestPayload = {
      niche: niche,
      location: `${city}, ${state}`,
      target_business: {
        name: cleanBusinessName,  // Use clean name without address
        place_id: place_id,       // Primary matching should use place_id
        original_name: business_name,  // Keep original for reference
        geometry: geometry       // Include coordinates for map display
      }
    };
    
    console.log('📤 SENDING TO RAILWAY API:', JSON.stringify(requestPayload, null, 2));
    
    // Step 1: Start the job with retry logic
    let startJobResponse;
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        startJobResponse = await fetch(`${apiUrl}/api/single-business-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        if (startJobResponse.ok) {
          break; // Success, exit retry loop
        }
        
        const errorText = await startJobResponse.text().catch(() => 'Unknown error');
        lastError = new Error(`Failed to start analysis: ${startJobResponse.status} - ${errorText}`);
        
      } catch (fetchError) {
        lastError = fetchError;
        console.error(`Fetch attempt failed (${4 - retries}/3):`, fetchError);
      }
      
      retries--;
      if (retries > 0) {
        console.log(`Retrying in 2 seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!startJobResponse || !startJobResponse.ok) {
      throw lastError || new Error('Failed to start analysis after 3 attempts');
    }

    const { job_id } = await startJobResponse.json();
    console.log(`📋 Job started with ID: ${job_id}`);

    // Step 2: Poll for results (max 3 minutes)
    const maxPollingTime = 180000; // 3 minutes
    const pollInterval = 3000; // Check every 3 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollingTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      let jobStatusResponse;
      try {
        jobStatusResponse = await fetch(`${apiUrl}/api/job/${job_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout for status checks
        });
      } catch (pollError) {
        console.error(`Failed to check job status (network error):`, pollError);
        continue; // Continue polling on network errors
      }

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
        
        // DETAILED LOGGING FOR DIAGNOSIS
        console.log('\n========== RAILWAY API RESPONSE DIAGNOSIS ==========');
        console.log('🔍 Top-level keys in jobData:', Object.keys(jobData));
        console.log('🔍 Keys in analysisData:', Object.keys(analysisData || {}));
        
        // Check for AI intelligence in various possible locations
        const possibleAILocations = [
          'ai_intelligence',
          'aiIntelligence', 
          'ai_data',
          'business_intelligence',
          'intelligence',
          'enrichment',
          'ai_enrichment'
        ];
        
        console.log('\n🤖 Checking for AI Intelligence data:');
        for (const key of possibleAILocations) {
          if (analysisData?.[key]) {
            console.log(`  ✅ Found at analysisData.${key}:`, typeof analysisData[key]);
            console.log(`     Keys:`, Object.keys(analysisData[key]));
            console.log(`     Sample:`, JSON.stringify(analysisData[key]).substring(0, 200) + '...');
          } else if (jobData?.[key]) {
            console.log(`  ✅ Found at jobData.${key}:`, typeof jobData[key]);
            console.log(`     Keys:`, Object.keys(jobData[key]));
            console.log(`     Sample:`, JSON.stringify(jobData[key]).substring(0, 200) + '...');
          }
        }
        
        // Check if AI data is nested within business object
        if (analysisData?.business) {
          console.log('\n🏢 Checking business object for AI data:');
          const businessKeys = Object.keys(analysisData.business);
          console.log('  Business object keys:', businessKeys);
          
          for (const key of possibleAILocations) {
            if (analysisData.business[key]) {
              console.log(`  ✅ Found at business.${key}:`, typeof analysisData.business[key]);
            }
          }
        }
        
        console.log('====================================================\n');
        
        // Log competitor data details
        console.log('🏢 Competitor data breakdown:');
        console.log('  - top_competitors count:', analysisData?.top_competitors?.length || 0);
        console.log('  - all_competitors count:', analysisData?.all_competitors?.length || 0);
        console.log('  - competitors count:', analysisData?.competitors?.length || 0);
        console.log('  - market_analysis.competitors count:', analysisData?.market_analysis?.competitors?.length || 0);
        console.log('  - Available keys:', Object.keys(analysisData || {}));
        console.log('  - AI Intelligence data:', analysisData?.ai_intelligence ? 'Present' : 'Missing');
        if (analysisData?.ai_intelligence) {
          console.log('  - AI Intelligence keys:', Object.keys(analysisData.ai_intelligence));
        }
        storeJobResults(job_id, analysisData);
        
        // Store competitor data in database
        try {
          const { storeCompetitorSearch } = await import('@/lib/competitor-db');
          const searchDestination = `${city}, ${state}`;
          
          // Extract AI intelligence data from wherever it might be
          const aiIntelligence = analysisData?.ai_intelligence || 
                                 analysisData?.aiIntelligence || 
                                 analysisData?.ai_data ||
                                 analysisData?.ai_raw_response ||
                                 analysisData?.business?.ai_intelligence ||
                                 null;
          
          if (aiIntelligence) {
            console.log('🤖 Found AI Intelligence data to store');
            console.log('   Type:', typeof aiIntelligence);
            if (typeof aiIntelligence === 'string') {
              console.log('   Length:', aiIntelligence.length, 'characters');
            } else {
              console.log('   Keys:', Object.keys(aiIntelligence));
            }
          }
          
          console.log('💾 Storing competitor data in database...');
          const storeResult = await storeCompetitorSearch({
            job_id,
            search_term: niche,
            search_destination: searchDestination,
            target_business: {
              name: analysisData?.business?.name || cleanBusinessName,
              place_id: analysisData?.business?.place_id || place_id,
              rank: analysisData?.business?.rank
            },
            competitors: analysisData?.all_competitors || analysisData?.competitors || [],
            market_analysis: analysisData?.market_analysis,
            ai_intelligence: aiIntelligence  // Pass the AI intelligence data
          });
          
          console.log('✅ Database storage result:', storeResult);
        } catch (dbError) {
          console.error('❌ Failed to store in database (non-critical):', dbError);
          // Continue even if database storage fails
        }
        
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
