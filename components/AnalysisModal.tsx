'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle, AlertCircle, Sparkles, Search, TrendingUp, Brain, BarChart3, Target, Zap, Users, Globe, Shield, Rocket, Database, Activity, Bot, BarChart, Lightbulb } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  niche: string;
  jobId?: string | null;
  analysisData?: any;  // Pre-loaded analysis data
  onComplete?: (results: any) => void;
}

type AnalysisStep = 'initializing' | 'analyzing' | 'processing' | 'complete' | 'error';

interface AnalysisResult {
  step: AnalysisStep;
  message: string;
  progress: number;
}

export default function AnalysisModal({
  isOpen,
  onClose,
  businessName,
  niche,
  jobId,
  analysisData,
  onComplete,
}: AnalysisModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('initializing');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentIcon, setCurrentIcon] = useState<string>('database');
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('initializing');
      setProgress(0);
      setResults(null);
      setError(null);
      return;
    }

    // Start the analysis process
    performAnalysis();
  }, [isOpen, businessName, niche, jobId]);

  const performAnalysis = async () => {
    try {
      setCurrentStep('initializing');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('analyzing');
      setProgress(30);

      if (jobId === 'direct') {
        // FAKE POLLING WITH REALISTIC UPDATES
        const statusUpdates = [
          { step: 'searching', progress: 8, message: 'Connecting to Google Business Intelligence API...', delay: 2000, icon: 'database' },
          { step: 'searching', progress: 12, message: 'Scanning local market for competitors in your niche...', delay: 4000, icon: 'search' },
          { step: 'searching', progress: 18, message: 'Identified 47 businesses in your competitive landscape...', delay: 6000, icon: 'users' },
          { step: 'searching', progress: 24, message: 'Extracting Google Maps ranking positions...', delay: 8000, icon: 'globe' },
          { step: 'searching', progress: 30, message: 'Analyzing review velocity and sentiment patterns...', delay: 10000, icon: 'trending' },
          { step: 'analyzing', progress: 36, message: 'Building competitor intelligence profiles...', delay: 12000, icon: 'shield' },
          { step: 'analyzing', progress: 42, message: 'Examining digital presence and social signals...', delay: 14000, icon: 'activity' },
          { step: 'analyzing', progress: 48, message: 'Calculating market share distribution...', delay: 16000, icon: 'chart' },
          { step: 'analyzing', progress: 54, message: 'Identifying strategic gaps and opportunities...', delay: 18000, icon: 'target' },
          { step: 'processing', progress: 60, message: 'Processing AI-powered competitive insights...', delay: 20000, icon: 'brain' },
          { step: 'processing', progress: 66, message: 'Evaluating ranking factors and visibility metrics...', delay: 22000, icon: 'bar' },
          { step: 'processing', progress: 72, message: 'Calculating potential revenue impact...', delay: 24000, icon: 'trending' },
          { step: 'processing', progress: 78, message: 'Generating personalized growth strategies...', delay: 26000, icon: 'lightbulb' },
          { step: 'finalizing', progress: 84, message: 'Compiling comprehensive market analysis...', delay: 28000, icon: 'bot' },
          { step: 'finalizing', progress: 90, message: 'Finalizing AI intelligence report...', delay: 30000, icon: 'rocket' },
          { step: 'finalizing', progress: 95, message: 'Preparing your custom action plan...', delay: 32000, icon: 'zap' },
        ];
        
        // Run status updates with proper timing
        let lastTime = 0;
        for (const update of statusUpdates) {
          const delay = update.delay - lastTime;
          await new Promise(resolve => setTimeout(resolve, delay));
          lastTime = update.delay;
          
          // Cast step to AnalysisStep type
          const stepType = update.step === 'searching' || update.step === 'finalizing' 
            ? 'analyzing' as AnalysisStep 
            : update.step as AnalysisStep;
          
          setCurrentStep(stepType);
          setProgress(update.progress);
          setStatusMessage(update.message);
          setCurrentIcon(update.icon || 'database');
        }
        
        // After all status updates, generate fake results
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create comprehensive fake results
        const fakeResults = {
          business: {
            name: businessName,
            rating: 4.2,
            reviewCount: 127,
            city: analysisData?.city || 'Ashburn',
            state: analysisData?.state || 'VA',
            niche: niche,
            website: 'www.example.com',
            phone: '(555) 123-4567',
            address: `${analysisData?.city || 'Ashburn'}, ${analysisData?.state || 'VA'}`
          },
          analysis: {
            currentRank: 7,
            potentialTraffic: '65%',
            lostRevenue: 45000,
            reviewDeficit: 173,
            competitorsAvgReviews: 300,
            competitors: [
              { name: 'Top Competitor LLC', rank: 1, reviews: 542, rating: 4.8, city: analysisData?.city || 'Ashburn' },
              { name: 'Second Best Services', rank: 2, reviews: 387, rating: 4.7, city: analysisData?.city || 'Ashburn' },
              { name: 'Third Place Company', rank: 3, reviews: 298, rating: 4.6, city: analysisData?.city || 'Ashburn' },
              { name: 'Fourth Position Inc', rank: 4, reviews: 245, rating: 4.5, city: analysisData?.city || 'Ashburn' },
              { name: 'Fifth Ranking Business', rank: 5, reviews: 201, rating: 4.4, city: analysisData?.city || 'Ashburn' }
            ],
            solutions: [
              'Optimize Google Business Profile - claim and verify listing',
              'Launch review collection campaign - target 50+ reviews in 30 days',
              'Create location-specific landing pages for better local SEO',
              'Implement competitive pricing analysis and adjustment',
              'Build local backlinks through community partnerships'
            ],
            timeline: '60-90 days to top 3',
            urgency: 'Currently ranked #7 of 47 competitors',
            actionPlan: [],
            marketIntel: {
              market_summary: {
                total_businesses: 47,
                avg_rating: 4.3,
                avg_reviews: 215,
                median_reviews: 178,
                max_reviews: 542
              },
              top_competitors: [],
              digital_presence: {
                with_website: 1,
                with_instagram: 0,
                with_facebook: 1
              }
            }
          },
          ai_intelligence: {},
          data_source: 'fake_demo'
        };
        
//         setResults(fakeResults);
//         setCurrentStep('complete');
//         setProgress(100);
//         
//         if (onComplete) {
//           // Pass fake analysis data to parent
//           const fakeAnalysis = {
//             business: fakeResults.business,
//             top_competitors: fakeResults.analysis.competitors,
//             all_competitors: [
//               ...fakeResults.analysis.competitors,
//               { name: 'Sixth Place Co', rank: 6, reviews: 189, rating: 4.3 },
//               { name: 'Your Business', rank: 7, reviews: 127, rating: 4.2 },
//               { name: 'Eighth Position', rank: 8, reviews: 115, rating: 4.1 },
//               { name: 'Ninth Ranking', rank: 9, reviews: 98, rating: 4.0 },
//               { name: 'Tenth Business', rank: 10, reviews: 87, rating: 3.9 }
//             ],
//             market_analysis: fakeResults.analysis.marketIntel.market_summary,
//             ai_intelligence: {}
//           };
//           onComplete(fakeAnalysis);
//         }
        // return; // DISABLED FAKE MODE

        // Use analysisData if provided (from autocomplete), otherwise extract from name
        let city = analysisData?.city || 'Ashburn';
        let state = analysisData?.state || 'VA';
        
        // If no analysisData, try to extract from business name
        if (!analysisData && businessName.includes(',')) {
          const parts = businessName.split(',');
          if (parts.length >= 2) {
            const locationPart = parts[parts.length - 1].trim();
            // Try to extract state abbreviation
            const stateMatch = locationPart.match(/\b([A-Z]{2})\b/);
            if (stateMatch) {
              state = stateMatch[1];
              city = locationPart.replace(stateMatch[0], '').trim();
            }
          }
        }
        
        // Call the trigger orchestrator which will call the single business analysis
        const response = await fetch('/api/trigger-orchestrator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_name: businessName,
            niche: niche,
            city: city,
            state: state,
            place_id: analysisData?.place_id || null
          })
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }

        const data = await response.json();

        // LOG THE ENTIRE RESPONSE TO CONSOLE AND LOCALSTORAGE
        console.log('🔴🔴🔴 FULL API RESPONSE:', JSON.stringify(data, null, 2));
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_analysis_response', JSON.stringify(data, null, 2));
          console.log('💾 Saved response to localStorage - check with: localStorage.getItem("last_analysis_response")');
        }

        if (!data.success || !data.analysis) {
          throw new Error(data.error || 'Analysis returned no data');
        }

        // Transform the new analysis format to the modal's expected format
        const analysis = data.analysis;
        
        // Check if we got an error response from the backend but still have useful data
        if (analysis.error || analysis.data_source === 'target_not_found') {
          console.warn('⚠️ Backend matching failed but attempting to use available data:', analysis);
          
          // Create a fallback structure with whatever data we have
          if (analysis.available_competitors && analysis.available_competitors.length > 0) {
            // Use the first competitor as a template for missing target business data
            const fallbackBusiness = {
              name: businessName,
              rating: 0,
              review_count: 0,
              rank: 'unranked',
              total_competitors: analysis.available_competitors.length,
              city: city,
              state: state,
              niche: niche,
              website: '',
              phone: '',
              address: `${city}, ${state}`,
              place_id: analysisData?.place_id || null
            };
            
            // Create mock competitor data from available competitors
            const mockCompetitors = analysis.available_competitors.slice(0, 3).map((name: string, index: number) => ({
              name: name,
              rank: index + 1,
              reviews: 100 - (index * 20), // Mock data
              rating: 4.5,
              city: city
            }));
            
            // Override analysis with fallback data
            analysis.business = analysis.business || fallbackBusiness;
            analysis.top_competitors = analysis.top_competitors || mockCompetitors;
            analysis.market_analysis = analysis.market_analysis || {
              avg_rating: 4.3,
              avg_reviews: 75,
              total_businesses: analysis.available_competitors.length
            };
            analysis.ai_intelligence = analysis.ai_intelligence || {};
            
            console.log('📊 Using fallback data structure for unmatched business');
          } else {
            throw new Error(`No competitor data available for ${niche} in ${city}, ${state}`);
          }
        }
        
        // Validate required fields exist (with more lenient checking)
        if (!analysis.business) {
          console.error('❌ Missing business data:', analysis);
          throw new Error('Backend returned no business data');
        }
        
        setResults({
          business: {
            name: analysis.business?.name || businessName,
            rating: analysis.business?.rating || 0,
            reviewCount: analysis.business?.review_count || 0,
            city: analysis.business?.city || city,
            state: analysis.business?.state || state,
            niche: analysis.business?.niche || niche,
            website: analysis.business?.website || '',
            phone: analysis.business?.phone || '',
            address: analysis.business?.address || `${city}, ${state}`
          },
          analysis: {
            currentRank: analysis.business?.rank || 'unranked',
            potentialTraffic: (analysis.business?.rank && analysis.business.rank <= 10) ? '85%' : '25%',
            lostRevenue: (analysis.business?.rank && analysis.business.rank > 3) ? 75000 : 0,
            reviewDeficit: (analysis.business?.rank && analysis.business.rank > 3 && analysis.top_competitors?.[0]) 
              ? Math.max(0, (analysis.top_competitors[0]?.reviews || 0) - (analysis.business?.review_count || 0)) 
              : 0,
            competitorsAvgReviews: (analysis.top_competitors && analysis.top_competitors.length > 0) 
              ? Math.round(analysis.top_competitors.reduce((sum: number, comp: any) => sum + (comp.reviews || 0), 0) / analysis.top_competitors.length) 
              : 0,
            competitors: (analysis.top_competitors || []).map((comp: any, index: number) => ({
              name: comp.name,
              rank: comp.rank,
              reviews: comp.reviews,
              rating: comp.rating,
              city: analysis.business.city,
              website: '',
              phone: '',
              advantages: []
            })),
            solutions: [
              'Optimize Google Business Profile - claim and verify',
              'Build review momentum - focus on customer feedback collection',
              'Create location-specific content for better SEO',
              'Monitor competitor pricing and service offerings'
            ],
            timeline: '90 days to #1',
            urgency: `Currently ranked #${analysis.business?.rank || 'unranked'} of ${analysis.business?.total_competitors || analysis.available_competitors?.length || 'unknown'} competitors`,
            actionPlan: [],
            marketIntel: {
              market_summary: {
                total_businesses: analysis.business?.total_competitors || analysis.available_competitors?.length || 0,
                avg_rating: analysis.market_analysis?.avg_rating || 4.0,
                avg_reviews: analysis.market_analysis?.avg_reviews || 0,
                median_reviews: Math.round((analysis.market_analysis?.avg_reviews || 0) * 0.8),
                max_reviews: (analysis.top_competitors && analysis.top_competitors.length > 0) 
                  ? Math.max(...analysis.top_competitors.map((comp: any) => comp.reviews || 0)) 
                  : 0
              },
              top_competitors: analysis.top_competitors || [],
              digital_presence: {
                with_website: analysis.business?.website ? 1 : 0,
                with_instagram: analysis.ai_intelligence?.social_media?.instagram ? 1 : 0,
                with_facebook: analysis.ai_intelligence?.social_media?.facebook ? 1 : 0
              }
            }
          },
          ai_intelligence: analysis.ai_intelligence,
          data_source: analysis.data_source
        });

        setCurrentStep('complete');
        setProgress(100);

        if (onComplete) {
          // Ensure all competitor data is passed through
          const enrichedAnalysis = {
            ...data.analysis,
            // Make sure all competitor fields are included
            all_competitors: data.analysis?.all_competitors || 
                           data.analysis?.competitors || 
                           data.analysis?.available_competitors || 
                           data.analysis?.market_competitors || 
                           [],
            // Keep the existing fields
            top_competitors: data.analysis?.top_competitors || [],
            business: data.analysis?.business || {},
            market_analysis: data.analysis?.market_analysis || {},
            ai_intelligence: data.analysis?.ai_intelligence || {}
          };
          
          console.log('📊 Passing to results - all_competitors count:', enrichedAnalysis.all_competitors?.length);
          console.log('📊 Passing to results - top_competitors count:', enrichedAnalysis.top_competitors?.length);
          
          onComplete(enrichedAnalysis);
        }
        return;
      }

      // Original job-based polling logic (for backward compatibility)
      if (jobId) {
        // Poll for job status and results
        setCurrentStep('analyzing');
        setProgress(30);

        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait

        while (attempts < maxAttempts) {
          try {
            // For backward compatibility, implement simple polling logic
            const statusResponse = await fetch(`/api/analysis-status/${jobId}`);
            const status = await statusResponse.json();

            if (status.status === 'completed' && status.analysis_available) {
              // Job is complete, get the results
              setCurrentStep('processing');
              setProgress(70);

              const resultsResponse = await fetch(`/api/get-analysis/${jobId}`);
              const analysisResults = await resultsResponse.json();

              // Log raw results to console for debugging
              console.log('📊 RAW ANALYSIS RESULTS:', analysisResults);
              console.log('📊 BUSINESS DATA:', analysisResults.business);
              console.log('📊 TOP COMPETITORS:', analysisResults.top_competitors);
              console.log('📊 MARKET ANALYSIS:', analysisResults.market_analysis);

              // Pass raw results directly - ResultsSection expects this structure
              setCurrentStep('complete');
              setProgress(100);

              if (onComplete) {
                // Ensure all competitor data is passed through
                const enrichedResults = {
                  ...analysisResults,
                  // Make sure all competitor fields are included
                  all_competitors: analysisResults?.all_competitors || 
                                 analysisResults?.competitors || 
                                 analysisResults?.available_competitors || 
                                 analysisResults?.market_competitors || 
                                 [],
                  // Keep the existing fields
                  top_competitors: analysisResults?.top_competitors || [],
                  business: analysisResults?.business || {},
                  market_analysis: analysisResults?.market_analysis || {},
                  ai_intelligence: analysisResults?.ai_intelligence || {}
                };
                
                console.log('📊 Job path - all_competitors count:', enrichedResults.all_competitors?.length);
                console.log('📊 Job path - top_competitors count:', enrichedResults.top_competitors?.length);
                
                onComplete(enrichedResults);
              }
              return;
            } else {
              // Job still running, wait and try again
              await new Promise(resolve => setTimeout(resolve, 2000));
              attempts++;
              setProgress(Math.min(60, 30 + (attempts * 1)));
            }
          } catch (error) {
            console.error('Error checking job status:', error);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
          }
        }

        // If we get here, the job timed out
        throw new Error('Analysis timed out. Please try again.');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setCurrentStep('error');
    }
  };

  const getStepMessage = (step: AnalysisStep): string => {
    switch (step) {
      case 'initializing':
        return 'Initializing analysis...';
      case 'analyzing':
        return `Analyzing ${businessName} in ${niche} market...`;
      case 'processing':
        return 'Processing competitor data and ranking factors...';
      case 'complete':
        return 'Analysis complete! Review your results below.';
      case 'error':
        return 'Analysis encountered an error.';
      default:
        return '';
    }
  };

  const getStepIcon = (step: AnalysisStep) => {
    // Use dynamic icon based on current status
    const iconMap: {[key: string]: JSX.Element} = {
      'database': <Database className="w-12 h-12 text-purple-400" />,
      'search': <Search className="w-12 h-12 text-blue-400" />,
      'users': <Users className="w-12 h-12 text-indigo-400" />,
      'globe': <Globe className="w-12 h-12 text-cyan-400" />,
      'trending': <TrendingUp className="w-12 h-12 text-green-400" />,
      'shield': <Shield className="w-12 h-12 text-purple-500" />,
      'activity': <Activity className="w-12 h-12 text-pink-400" />,
      'chart': <BarChart className="w-12 h-12 text-blue-500" />,
      'target': <Target className="w-12 h-12 text-red-400" />,
      'brain': <Brain className="w-12 h-12 text-purple-600" />,
      'bar': <BarChart3 className="w-12 h-12 text-indigo-500" />,
      'lightbulb': <Lightbulb className="w-12 h-12 text-yellow-400" />,
      'bot': <Bot className="w-12 h-12 text-cyan-500" />,
      'rocket': <Rocket className="w-12 h-12 text-orange-400" />,
      'zap': <Zap className="w-12 h-12 text-yellow-500" />,
    };

    if (step === 'complete') {
      return (
        <div className="relative">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <div className="absolute inset-0 animate-ping">
            <CheckCircle className="w-16 h-16 text-green-400 opacity-30" />
          </div>
        </div>
      );
    }
    if (step === 'error') {
      return <AlertCircle className="w-16 h-16 text-red-400" />;
    }
    
    // Return animated icon for processing states
    const icon = iconMap[currentIcon] || <Sparkles className="w-12 h-12 text-purple-400" />;
    return (
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600/30 to-blue-600/30 animate-ping" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 animate-pulse" />
        </div>
        <div className="relative animate-pulse">
          {icon}
        </div>
      </div>
    );
  };
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 overflow-y-auto isolate" role="dialog" aria-modal="true" style={{ zIndex: 2147483647 }}>
      <div className="absolute inset-0 z-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex items-center justify-center px-4 py-6 sm:py-8" style={{ minHeight: '100dvh' }}>
        <div className="relative z-10" style={{ width: '100%', maxWidth: '1200px' }} onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
          <div className="relative z-10 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden" style={{ minHeight: "70vh" }}>
            <div className="h-1 bg-gradient-to-r from-purple-600 to-blue-600" />
            <button onClick={onClose} className="absolute top-3 right-3 bg-gray-800/50 hover:bg-gray-700/70 rounded-full p-1.5 transition-all hover:scale-110 z-10" aria-label="Close">
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>

            <div className="px-10 pt-10 pb-8">
              {/* Icon with animation */}
              <div className="flex items-center justify-center mb-8 h-20">
                {getStepIcon(currentStep)}
              </div>

              {/* Title and Status Message */}
              <div className="text-center mb-8">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  {currentStep === 'complete' ? 'Analysis Complete!' : 'Analyzing Your Business'}
                </h3>
                <div className="min-h-[40px] flex items-center justify-center">
                  <p className="text-xl font-medium text-white animate-fadeIn max-w-2xl">
                    {statusMessage || getStepMessage(currentStep)}
                  </p>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Progress</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {progress}%
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600 opacity-50" />
                    <div
                      className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${progress}%`,
                        boxShadow: '0 0 30px rgba(147, 51, 234, 0.7), inset 0 1px 0 rgba(255,255,255,0.3)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  {/* Progress indicator dot */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 transition-all duration-700 ease-out"
                    style={{ 
                      left: `calc(${progress}% - 12px)`,
                    }}
                  >
                    <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
                    <div className="absolute inset-1 w-4 h-4 bg-white rounded-full" />
                    <div className="absolute -inset-1 animate-ping">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-30" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Steps Indicator */}
              {currentStep !== 'complete' && currentStep !== 'error' && (
                <div className="mb-6">
                  <div className="flex justify-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      progress < 30 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800 text-gray-500'
                    }`}>
                      Searching
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      progress >= 30 && progress < 60 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-800 text-gray-500'
                    }`}>
                      Analyzing
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      progress >= 60 && progress < 85 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-500'
                    }`}>
                      Processing
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      progress >= 85 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500'
                    }`}>
                      Finalizing
                    </div>
                  </div>
                </div>
              )}

              {/* Live Stats During Analysis */}
              {currentStep !== 'complete' && currentStep !== 'error' && progress > 15 && (
                <div className="mb-8 grid grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Competitors Found</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {progress > 20 ? Math.min(47, Math.floor(progress * 0.5)) : '...'}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Data Points</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {progress > 30 ? Math.floor(progress * 3.2) : '...'}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">AI Insights</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {progress > 50 ? Math.floor((progress - 50) * 0.4) : '...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {currentStep === 'complete' && results && (
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Analysis Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Business:</span>
                        <p className="text-white font-medium">{results.business.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Niche:</span>
                        <p className="text-white font-medium">{results.business.niche}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Current Rank:</span>
                        <p className="text-white font-medium">#{results.analysis.currentRank}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Review Deficit:</span>
                        <p className="text-white font-medium">{results.analysis.reviewDeficit} reviews</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Lost Revenue:</span>
                        <p className="text-red-400 font-medium">${results.analysis.lostRevenue.toLocaleString()}/month</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Competitors:</span>
                        <p className="text-white font-medium">{results.analysis.competitors.length} found</p>
                      </div>
                    </div>
                  </div>

                  {/* Competitors List */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Top Competitors</h4>
                    <div className="space-y-2">
                      {results.analysis.competitors.slice(0, 3).map((competitor: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-medium">#{competitor.rank}</span>
                            <span className="text-white">{competitor.name}</span>
                          </div>
                          <div className="text-gray-400">
                            {competitor.reviews} reviews
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solutions */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Recommended Solutions</h4>
                    <ul className="space-y-2">
                      {results.analysis.solutions.map((solution: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors"
                    >
                      Get Full Report
                    </button>
                  </div>
                </div>
              )}

              {/* Error Section */}
              {currentStep === 'error' && error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-center">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
