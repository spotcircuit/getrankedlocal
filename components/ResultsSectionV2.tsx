'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import HeroSection from '@/components/HeroSection-improved';
import BusinessInsights from '@/components/BusinessInsights';
import CompetitorAnalysis from '@/components/CompetitorAnalysis';
import ProblemSection from '@/components/ProblemSection';
import ActionPlan from '@/components/ActionPlan';
import CTASection from '@/components/CTASection';
import AIIntelligenceDynamic from '@/components/AIIntelligenceDynamic';
import CompetitorAlertFixed from '@/components/CompetitorAlertFixed';
import SimplifiedSolution from '@/components/SimplifiedSolution';
import StakeholderHero from '@/components/StakeholderHero';
import LeadCaptureForm, { LeadData } from '@/components/LeadCaptureForm';
import QuickSolutionPreview from '@/components/QuickSolutionPreview';

interface ResultsSectionV2Props {
  results: any;
  businessName: string;
  niche?: string;
  city?: string;
  state?: string;
}

export default function ResultsSectionV2({ results, businessName, niche, city, state }: ResultsSectionV2Props) {
  if (!results) return null;

  const { business, analysis, ai_intelligence, market_analysis, top_competitors, all_competitors, competitors } = results;
  const [showLeadForm, setShowLeadForm] = useState(false);
  
  const handleLeadSubmit = (data: LeadData) => {
    setShowLeadForm(false);
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-lg z-50';
    successMessage.textContent = 'Thank you! We\'ll contact you within 24 hours with your competitive analysis.';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 5000);
  };
  
  
  // Debug the raw data
  console.log("=== RAW DATA DEBUG ===");
  console.log("Results object keys:", Object.keys(results));
  console.log("Full results object:", results);
  
  // Check all possible competitor fields
  Object.keys(results).forEach(key => {
    if (key.toLowerCase().includes('competitor') || key.toLowerCase().includes('business')) {
      console.log(`Field '${key}':`, Array.isArray(results[key]) ? `Array with ${results[key].length} items` : typeof results[key]);
    }
  });
  
  console.log("Top competitors:", top_competitors?.length, "items");
  console.log("Market analysis:", market_analysis);
  console.log("Business object:", business);
  console.log("AI Intelligence data:", ai_intelligence);
  
  // Use all available competitors for calculations - check various field names
  const allCompetitorsList = results.all_competitors || 
                              results.competitors || 
                              results.market_competitors || 
                              results.competitor_list || 
                              results.businesses || 
                              all_competitors || 
                              competitors || 
                              top_competitors || 
                              [];
  
  console.log("AllCompetitorsList source:", allCompetitorsList.length, "items");
  // Transform data to match component expectations
  const businessData = {
    name: business?.name || businessName,
    rating: business?.rating || 0,
    reviewCount: business?.review_count || 0,
    city: business?.city || city || ai_intelligence?.location?.city || '',
    state: business?.state || state || ai_intelligence?.location?.state || '',
    niche: business?.niche || niche || ai_intelligence?.industry || '',
    industry: business?.industry || niche || ai_intelligence?.industry || '',
    website: business?.website || ai_intelligence?.domain || '',
    phone: business?.phone || ai_intelligence?.contacts?.phones?.[0] || '',
    address: business?.address || ai_intelligence?.location?.formatted_address || '',
    place_id: business?.place_id || null,
    coordinates: (() => {
      // Try to get coordinates from various sources
      if (business?.coordinates) return business.coordinates;
      if (business?.geometry?.location) {
        return {
          lat: business.geometry.location.lat,
          lng: business.geometry.location.lng
        };
      }
      if (business?.location?.coordinates) return business.location.coordinates;
      if (ai_intelligence?.location?.coordinates) return ai_intelligence.location.coordinates;
      return null;
    })()
  };

  const analysisData = {
    currentRank: business?.rank || market_analysis?.rank_position || null,
    potentialTraffic: (() => {
      const rank = business?.rank || market_analysis?.rank_position || 999;
      const clickShares = [33, 17, 11, 8, 6, 5, 4, 3, 2.5, 2];
      if (rank <= 10) {
        const myShare = clickShares[rank - 1] || 1;
        const lostShare = 100 - myShare;
        return `${Math.round(lostShare)}%`;
      }
      return '99%';
    })(),
    lostRevenue: business?.rank > 3 ? 75000 : 0,
    reviewDeficit: business?.rank > 3 && top_competitors?.[0] 
      ? Math.max(0, (top_competitors[0]?.reviews || 0) - (business?.review_count || 0))
      : 0,
    competitors: allCompetitorsList || top_competitors || [],
    painPoints: [
      { 
        issue: 'Review Deficit', 
        severity: business?.rank > 5 ? 'critical' : 'high', 
        impact: `Missing ${Math.max(0, (top_competitors?.[0]?.reviews || 0) - (business?.review_count || 0))}+ reviews vs top competitor`
      },
      { 
        issue: market_analysis?.in_top_3 ? 'Maintaining Position' : 'Ranking Gap', 
        severity: market_analysis?.in_top_10 ? 'medium' : 'critical', 
        impact: market_analysis?.market_share_position || 'Not in top positions'
      },
      { 
        issue: 'AI Visibility', 
        severity: 'high', 
        impact: `Missing from AI-powered ${businessData.niche || 'industry'} searches`
      }
    ],
    solutions: [
      'AI-Optimized Content Strategy',
      'Review Generation System',
      'Local SEO Optimization',
      'Google Business Profile Enhancement'
    ],
    timeline: '90 days to #1',
    urgency: `Currently ranked #${business?.rank || 'unranked'} of ${business?.total_competitors || market_analysis?.total_competitors || 'many'} competitors`,
    actionPlan: [
      { phase: 'Week 1-2', tasks: ['Profile Audit', 'Keyword Research', 'Competitor Analysis'] },
      { phase: 'Week 3-4', tasks: ['Content Creation', 'Review Campaign', 'Technical Fixes'] },
      { phase: 'Month 2', tasks: ['Link Building', 'Review Monitoring', 'Rank Tracking'] },
      { phase: 'Month 3', tasks: ['Optimization', 'Scaling', 'Dominance'] }
    ],
    marketIntel: {
      market_summary: {
        total_businesses: business?.total_competitors || market_analysis?.total_competitors || allCompetitorsList?.length || 0,
        avg_rating: (() => {
          // Use ALL competitors for more accurate average
          const competitorsToAverage = allCompetitorsList.length > 0 ? allCompetitorsList : top_competitors;
          
          if (competitorsToAverage && competitorsToAverage.length > 0) {
            console.log("=== DETAILED RATING DEBUG ===");
            console.log("Calculating avg from", competitorsToAverage.length, "competitors");
            
            // Show first competitor with ALL fields
            console.log("First competitor full object:", competitorsToAverage[0]);
            
            // Show rating values for first 10
            const sampleRatings = competitorsToAverage.slice(0, 10).map((c: any) => ({
              name: c.name,
              rating: c.rating,
              type: typeof c.rating
            }));
            console.log("Sample ratings:", sampleRatings);
            
            const validRatings = competitorsToAverage.filter((c: any) => c.rating && c.rating > 0 && c.rating <= 5);
            console.log("Valid ratings count:", validRatings.length);
            
            if (validRatings.length > 0) {
              const allRatingValues = validRatings.map((c: any) => Number(c.rating));
              console.log("All rating values:", allRatingValues);
              
              // Check if they're all the same
              const unique = Array.from(new Set(allRatingValues));
              console.log("Unique rating values:", unique);
              
              if (unique.length === 1 && unique[0] === 5) {
                console.error("SUSPICIOUS: All", validRatings.length, "ratings are exactly 5.0!");
              }
              
              const totalRating = allRatingValues.reduce((sum: number, r: number) => sum + r, 0);
              const avg = totalRating / allRatingValues.length;
              console.log("Sum:", totalRating, "Count:", allRatingValues.length, "Average:", avg);
              
              return Number(avg.toFixed(1));
              
              // TEMPORARY: Return a more realistic value for testing
              // return 4.3;
            } else {
              console.log("No valid ratings found!");
            }
          }
          
          // Fallback to market analysis or default
          return market_analysis?.avg_rating || 4.5;
        })(),
        avg_reviews: (() => {
          if (top_competitors && top_competitors.length > 0) {
            const totalReviews = top_competitors.reduce((sum: number, c: any) => sum + (c.reviews || 0), 0);
            return Math.round(totalReviews / top_competitors.length);
          }
          return market_analysis?.avg_reviews || 0;
        })(),
        median_reviews: (() => {
          if (top_competitors && top_competitors.length > 0) {
            const sorted = [...top_competitors].sort((a: any, b: any) => (a.reviews || 0) - (b.reviews || 0));
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid].reviews : Math.round((sorted[mid - 1].reviews + sorted[mid].reviews) / 2);
          }
          return 0;
        })(),
        max_reviews: (() => {
          if (top_competitors && top_competitors.length > 0) {
            return Math.max(...top_competitors.map((c: any) => c.reviews || 0));
          }
          return 0;
        })()
      },
      top_competitors: (() => {
        // Use ALL competitors if available, not just top 3
        const competitors = all_competitors || top_competitors || [];
        // If business has a rank and is not in competitors list, add it
        console.log("DEBUG: Building top_competitors list");
        console.log("  Current business:", business?.name, "Rank:", business?.rank);
        console.log("  Original top_competitors:", competitors.map((c: any) => ({ name: c.name, index: c.index })));
        if (business?.rank && business?.name) {
          const businessInList = competitors.some((c: any) => 
            c.name === business.name || c.place_id === business.place_id
          );
          if (!businessInList) {
            // Insert the business at its rank position or at the end
            const businessEntry = {
              name: business.name,
              rank: business.rank,
              rating: business.rating,
              review_count: business.review_count || business.reviews || 0,
              place_id: business.place_id,
              street_address: business.address || business.street_address,
              latitude: business.coordinates?.lat || business.latitude,
              longitude: business.coordinates?.lng || business.longitude
            };
            
            // Always insert the business at its rank position
            if (business.rank <= 10) {
              const insertIndex = business.rank - 1;
              competitors.splice(insertIndex, 0, businessEntry);
            } else {
              // For ranks > 10, add it to the list anyway so BusinessInsights can find it
              // But keep it after the top 10
              if (competitors.length >= 10) {
                // Insert after top 10 at position 10
                competitors.splice(10, 0, businessEntry);
              } else {
                // If we don't have 10 competitors yet, just add it at the end
                competitors.push(businessEntry);
              }
            }
          }
        }
        return competitors;
      })(),
      digital_presence: {
        with_website: business?.website ? 1 : 0,
        with_instagram: ai_intelligence?.social_media?.instagram ? 1 : 0,
        with_facebook: ai_intelligence?.social_media?.facebook ? 1 : 0
      }
    }
  };

  // Format competitors for CompetitorAnalysis component - show more competitors
  const competitorsSafe = useMemo(() => {
    const list = top_competitors || [];
    let formattedList = [];
    
    // First, add top 10 competitors
    const top10 = list.slice(0, 10).map((c: any, idx: number) => ({
      name: c?.name || 'Competitor',
      rank: idx + 1,
      reviews: typeof c?.review_count === 'number' ? c.review_count : (typeof c?.reviews === 'number' ? c.reviews : Number(c?.reviews || c?.review_count) || 0),
      rating: c?.rating != null ? Number(c.rating) : 0,
      advantages: [],
      address: c?.street_address || c?.address || '',
      latitude: c?.latitude,
      longitude: c?.longitude,
      place_id: c?.place_id || '',
      cid: c?.cid || '',
      display_rank: idx + 1,
      isTargetBusiness: false,
    }));
    
    // Check if target business is in top 10
    const targetInTop10 = top10.some((c: any) => 
      c.name === businessData.name || c.place_id === businessData.place_id
    );
    
    // If target business is not in top 10 but has a rank, add it
    if (!targetInTop10 && analysisData.currentRank && analysisData.currentRank > 10) {
      // Add separator if needed
      formattedList = [...top10];
      
      // Add the target business with its actual rank
      formattedList.push({
        name: businessData.name,
        rank: analysisData.currentRank,
        reviews: businessData.reviewCount || 0,
        rating: businessData.rating || 0,
        advantages: [],
        address: businessData.address || '',
        latitude: businessData.coordinates?.lat,
        longitude: businessData.coordinates?.lng,
        place_id: businessData.place_id || '',
        cid: '',
        display_rank: analysisData.currentRank,
        isTargetBusiness: true,
        showSeparator: true, // Show "..." between rank 10 and this business
      });
    } else {
      // Mark the target business in the top 10
      formattedList = top10.map((c: any) => ({
        ...c,
        isTargetBusiness: c.name === businessData.name || c.place_id === businessData.place_id
      }));
    }
    
    return formattedList;
  }, [top_competitors, businessData, analysisData.currentRank]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* StakeholderHero - Personalized landing that replaces generic HeroSection */}
      <StakeholderHero
        businessName={businessData.name}
        currentRank={analysisData.currentRank}
        topCompetitors={competitorsSafe}
        monthlyLoss={analysisData.lostRevenue ? Math.round(analysisData.lostRevenue / 12) : 15000}
        city={businessData.city}
        state={businessData.state}
        niche={businessData.niche}
        businessWebsite={businessData.website}
        businessReviews={businessData.reviewCount || 0}
      />

      {/* Business Intelligence with Google Map - Right after Hero */}
      <BusinessInsights 
        business={businessData} 
        analysis={analysisData} 
      />

      {/* Quick Solution Preview - Show them there IS a solution early */}
      <QuickSolutionPreview
        businessName={businessData.name}
        currentRank={analysisData.currentRank}
        niche={businessData.niche}
        city={businessData.city}
        reviewDeficit={(() => {
          // Find the competitor with the most reviews
          const maxCompetitorReviews = Math.max(
            ...competitorsSafe.map((c: any) => c.reviews || 0),
            0
          );
          return Math.max(0, maxCompetitorReviews - (businessData.reviewCount || 0));
        })()}
      />

      {/* Visual Problem Representations */}
      <section className="py-12 md:py-20 overflow-x-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12"
          >
            <div className="w-full">
              <h4 className="text-base md:text-lg font-semibold text-gray-300 mb-4 text-center">
                Where You Rank vs. Where The Money Is
              </h4>
              <div className="px-4">
                <div className="relative w-full max-w-md mx-auto">
                  <Image
                    src="/ranking-ladder-visualization.webp"
                    alt="Your ranking position"
                    width={640}
                    height={640}
                    className="rounded-xl shadow-2xl w-full h-auto object-contain"
                  />
                </div>
              </div>
              {/* CTA below image */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                >
                  Fix My Ranking →
                </button>
              </div>
            </div>
            <div className="w-full">
              <h4 className="text-base md:text-lg font-semibold text-gray-300 mb-4 text-center">
                Your Revenue Flying to Competitors
              </h4>
              <div className="px-4">
                <div className="relative w-full max-w-md mx-auto">
                  <Image
                    src="/revenue-loss-flow.webp"
                    alt="Revenue loss visualization"
                    width={640}
                    height={640}
                    className="rounded-xl shadow-2xl w-full h-auto object-contain"
                  />
                </div>
              </div>
              {/* CTA below image */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                >
                  Stop Revenue Loss →
                </button>
              </div>
            </div>
          </motion.div>

          {/* Customer Journey Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 md:mt-16 mb-8 md:mb-12 px-4"
          >
            <h4 className="text-lg md:text-xl font-semibold text-center text-white mb-4 md:mb-6">
              How 93% of Customers Are Bypassing You Right Now
            </h4>
            <div className="relative w-full max-w-3xl mx-auto">
              <Image
                src="/customer-journey-bypass.webp"
                alt="Customer journey bypass"
                width={800}
                height={400}
                className="rounded-xl shadow-2xl w-full h-auto object-contain"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Urgency Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="my-8 p-6 bg-red-900/20 border-2 border-red-500/50 rounded-xl max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-red-400 mb-2">
              ⚠️ {analysisData.currentRank === 3 
                ? `The #1 and #2 businesses got ${Math.floor(Math.random() * 3) + 2} new reviews this week` 
                : 'Your Competitors Are Moving Fast'}
            </h3>
            <p className="text-white">
              {analysisData.currentRank === 3 
                ? `Every week you stay at #3, you lose ~${Math.round(220/4)} potential customers to them`
                : 'While you read this, they\'re gaining reviews and stealing your customers'}
            </p>
          </div>
          <button
            onClick={() => document.querySelector('#pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all transform hover:scale-105 animate-pulse"
          >
            {analysisData.currentRank === 3 ? 'Claim Your #2 Position →' : 'Stop Losing Ground - See The Fix'}
          </button>
        </div>
      </motion.div>

      <section className="py-20 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-6xl mx-auto px-6">
          <AIIntelligenceDynamic
            aiData={ai_intelligence}
            businessName={businessData.name}
          />
        </div>
      </section>

      <CompetitorAnalysis
        competitors={competitorsSafe}
        businessName={businessData.name}
        businessRating={businessData.rating}
        businessReviews={businessData.reviewCount}
        currentRank={analysisData.currentRank}
        businessWebsite={businessData.website}
        city={businessData.city}
        state={businessData.state}
      />

      {/* CompetitorAlert replaces ProblemSection with visual urgency */}
      <CompetitorAlertFixed className="py-8" currentRank={analysisData.currentRank} competitorGains={3} />

      {/* Simplified Solution - Replace ActionPlan with more visual solution */}
      <SimplifiedSolution 
        businessName={businessData.name}
        currentRank={analysisData.currentRank}
        niche={businessData.niche}
      />

      <CTASection
        businessName={businessData.name}
        businessWebsite={businessData.website}
        urgency={analysisData.urgency}
        currentRank={analysisData.currentRank}
      />
      
      {/* Lead Capture Modal with Business Context */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        title="Get Your Free Competitive Analysis"
        subtitle={`See how ${businessData.name} can dominate ${businessData.city || 'your market'}`}
        businessName={businessData.name}
        businessWebsite={businessData.website}
        searchedPlaceId={businessData.place_id}
        currentRank={analysisData.currentRank}
        monthlyLoss={analysisData.lostRevenue}
        topCompetitors={analysisData.competitors.slice(0, 3)}
        city={businessData.city}
        state={businessData.state}
        niche={businessData.niche}
      />
    </div>
  );
}
