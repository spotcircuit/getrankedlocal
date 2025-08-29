'use client';

import { useMemo } from 'react';
import HeroSection from '@/components/HeroSection-improved';
import BusinessInsights from '@/components/BusinessInsights';
import CompetitorAnalysis from '@/components/CompetitorAnalysis';
import ProblemSection from '@/components/ProblemSection';
import ActionPlan from '@/components/ActionPlan';
import CTASection from '@/components/CTASection';
import AIIntelligenceSection from '@/components/AIIntelligenceSection';

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
        const competitors = top_competitors || [];
        // If business has a rank and is not in top_competitors, add it
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
    // Show up to 10 competitors, not just 3
    return list.slice(0, 10).map((c: any, idx: number) => ({
      name: c?.name || 'Competitor',
      rank: idx + 1,  // Use index as rank since they're already sorted
      reviews: typeof c?.review_count === 'number' ? c.review_count : (typeof c?.reviews === 'number' ? c.reviews : Number(c?.reviews || c?.review_count) || 0),
      rating: c?.rating != null ? Number(c.rating) : 0,
      advantages: [],
      address: c?.street_address || c?.address || '',
      latitude: c?.latitude,
      longitude: c?.longitude,
      place_id: c?.place_id || '',
      cid: c?.cid || '',
      display_rank: idx + 1,
    }));
  }, [top_competitors]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <HeroSection
        businessName={businessData.name}
        currentRank={analysisData.currentRank}
        potentialTraffic={analysisData.potentialTraffic}
        competitors={analysisData.competitors}
        niche={businessData.niche}
        city={businessData.city}
        state={businessData.state}
      />

      <BusinessInsights 
        business={businessData} 
        analysis={analysisData} 
      />

      <AIIntelligenceSection
        aiData={ai_intelligence}
        businessName={businessData.name}
      />

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

      <ProblemSection
        painPoints={analysisData.painPoints}
        lostRevenue={analysisData.lostRevenue}
        reviewDeficit={analysisData.reviewDeficit}
      />

      <ActionPlan
        timeline={analysisData.timeline}
        solutions={analysisData.solutions}
        actionPlan={analysisData.actionPlan}
        businessName={businessData.name}
        businessWebsite={businessData.website}
        currentRank={analysisData.currentRank || 9}
        niche={businessData.niche}
      />

      <CTASection
        businessName={businessData.name}
        businessWebsite={businessData.website}
        urgency={analysisData.urgency}
      />
    </div>
  );
}