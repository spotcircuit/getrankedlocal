'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Star, DollarSign, Target, Award,
  BarChart3, PieChart, Activity, Zap, Shield, Globe,
  AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';
import { useMemo } from 'react';

interface MarketIntelligenceDashboardProps {
  business: any;
  analysis: any;
}

export default function MarketIntelligenceDashboard({ business, analysis }: MarketIntelligenceDashboardProps) {
  const marketData = analysis?.marketIntel;
  const percentileData = analysis?.businessPercentile;
  
  // Calculate performance scores
  const performanceMetrics = useMemo(() => {
    if (!marketData?.market_summary) return null;
    
    const summary = marketData.market_summary;
    const businessReviews = business?.reviewCount || 0;
    const businessRating = business?.rating != null ? business.rating : 0;
    
    // Performance calculations
    const reviewPerformance = (businessReviews / summary.avg_reviews) * 100;
    const marketPosition = ((summary.total_businesses - (analysis?.currentRank || summary.total_businesses)) / summary.total_businesses) * 100;
    const digitalMaturity = marketData?.digital_maturity || {};
    
    return {
      reviewPerformance: Math.min(reviewPerformance, 200), // Cap at 200%
      marketPosition,
      ratingScore: (businessRating / 5) * 100,
      digitalScore: (
        (business?.website ? 25 : 0) +
        (business?.socialMedia?.instagram ? 25 : 0) +
        (business?.email ? 25 : 0) +
        (business?.pricing?.botox ? 25 : 0)
      )
    };
  }, [marketData, business, analysis]);

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate opportunity score
  const opportunityScore = useMemo(() => {
    if (!marketData?.market_summary || !analysis?.currentRank) return 0;
    
    const rankImprovement = Math.max(0, analysis.currentRank - 3);
    const reviewGap = Math.max(0, marketData.market_summary.avg_reviews - (business?.reviewCount || 0));
    const score = Math.min(100, (rankImprovement * 10) + (reviewGap / 10));
    
    return Math.round(score);
  }, [marketData, analysis, business]);

  if (!marketData) return null;

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Market Intelligence <span className="text-blue-400">Dashboard</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Real-time competitive intelligence for {business?.city}, {business?.state}
          </p>
        </motion.div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-blue-400">
                #{analysis?.currentRank || '?'}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Market Position</h3>
            <p className="text-gray-400 text-sm mb-3">
              Out of {marketData.market_summary?.total_businesses || 0} competitors
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Top 3 Businesses:</span>
                <span className="text-white font-semibold">{marketData.market_summary?.top_3_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Your Percentile:</span>
                <span className={`font-semibold ${(performanceMetrics?.marketPosition ?? 0) > 50 ? 'text-green-400' : 'text-red-400'}`}>
                  Top {100 - Math.round(performanceMetrics?.marketPosition || 0)}%
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-600/20 to-green-900/10 border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-green-400">
                {opportunityScore}%
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Growth Opportunity</h3>
            <p className="text-gray-400 text-sm mb-3">
              Potential for improvement
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Revenue Potential:</span>
                <span className="text-yellow-400 font-semibold">
                  ${formatNumber(analysis?.lostRevenue || 0)}/yr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Traffic Available:</span>
                <span className="text-white font-semibold">{analysis?.potentialTraffic || '0%'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-purple-400">
                {performanceMetrics?.digitalScore || 0}%
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Digital Maturity</h3>
            <p className="text-gray-400 text-sm mb-3">
              Online presence score
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                {business?.website ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-gray-400">Website</span>
              </div>
              <div className="flex items-center gap-1">
                {business?.socialMedia?.instagram ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-gray-400">Social</span>
              </div>
              <div className="flex items-center gap-1">
                {business?.email ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-gray-400">Email</span>
              </div>
              <div className="flex items-center gap-1">
                {business?.pricing?.botox ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-gray-400">Pricing</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Review Performance */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Review Performance Analysis
            </h3>
            
            {/* Review Distribution */}
            {marketData.review_distribution && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">MARKET REVIEW DISTRIBUTION</h4>
                <div className="space-y-2">
                  {marketData.review_distribution.map((segment: any) => {
                    const percentage = (segment.count / marketData.market_summary.total_businesses) * 100;
                    const isYourRange = 
                      (segment.range === '0' && business?.reviewCount === 0) ||
                      (segment.range === '1-10' && business?.reviewCount >= 1 && business?.reviewCount <= 10) ||
                      (segment.range === '11-50' && business?.reviewCount >= 11 && business?.reviewCount <= 50) ||
                      (segment.range === '51-100' && business?.reviewCount >= 51 && business?.reviewCount <= 100) ||
                      (segment.range === '101-200' && business?.reviewCount >= 101 && business?.reviewCount <= 200) ||
                      (segment.range === '201-500' && business?.reviewCount >= 201 && business?.reviewCount <= 500) ||
                      (segment.range === '500+' && business?.reviewCount > 500);
                    
                    return (
                      <div key={segment.range} className="relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm ${isYourRange ? 'text-yellow-400 font-semibold' : 'text-gray-400'}`}>
                            {segment.range} reviews {isYourRange && '(You)'}
                          </span>
                          <span className="text-sm text-gray-300">{segment.count} businesses</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isYourRange ? 'bg-yellow-400' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Your Reviews</p>
                <p className="text-2xl font-bold text-white">{business?.reviewCount || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  vs avg: {Math.round(marketData.market_summary?.avg_reviews || 0)}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Review Gap</p>
                <p className={`text-2xl font-bold ${analysis?.reviewDeficit > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {analysis?.reviewDeficit > 0 ? `-${analysis.reviewDeficit}` : '+0'}
                </p>
                <p className="text-xs text-gray-400 mt-1">to reach average</p>
              </div>
            </div>
          </motion.div>

          {/* Competition Intensity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-red-400" />
              Competition Intensity
            </h3>

            {/* Rating Distribution */}
            {marketData.rating_distribution && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">RATING TIERS</h4>
                <div className="space-y-3">
                  {marketData.rating_distribution.map((tier: any) => {
                    const isYourTier = 
                      (tier.tier.includes('4.8+') && business?.rating >= 4.8) ||
                      (tier.tier.includes('4.5-4.7') && business?.rating >= 4.5 && business?.rating < 4.8) ||
                      (tier.tier.includes('4.0-4.4') && business?.rating >= 4.0 && business?.rating < 4.5) ||
                      (tier.tier.includes('3.5-3.9') && business?.rating >= 3.5 && business?.rating < 4.0) ||
                      (tier.tier.includes('<3.5') && business?.rating < 3.5);
                    
                    return (
                      <div key={tier.tier} className={`p-3 rounded-lg ${isYourTier ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-black/30'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className={`text-sm font-semibold ${isYourTier ? 'text-yellow-400' : 'text-white'}`}>
                              {tier.tier} {isYourTier && '(Your Tier)'}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">
                              {tier.count} businesses • Avg {tier.avg_reviews} reviews
                            </p>
                          </div>
                          <Star className={`w-5 h-5 ${isYourTier ? 'text-yellow-400' : 'text-gray-500'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Competition Score */}
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Market Difficulty</p>
                  <p className="text-2xl font-bold text-red-400">
                    {marketData.market_summary?.max_reviews > 500 ? 'Very High' : 
                     marketData.market_summary?.max_reviews > 200 ? 'High' : 
                     marketData.market_summary?.max_reviews > 100 ? 'Medium' : 'Low'}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Leader has {marketData.market_summary?.max_reviews || 0} reviews
              </p>
            </div>
          </motion.div>
        </div>

        {/* Service & Pricing Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 mb-12"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            Service & Pricing Intelligence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Service Distribution */}
            {marketData.service_distribution && (
              <>
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold text-white">
                      {marketData.service_distribution.offers_botox || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Offer Botox</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {marketData.market_summary?.total_businesses 
                      ? `${Math.round((marketData.service_distribution.offers_botox / marketData.market_summary.total_businesses) * 100)}% of market`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold text-white">
                      {marketData.service_distribution.has_membership || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Have Memberships</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {marketData.market_summary?.total_businesses 
                      ? `${Math.round((marketData.service_distribution.has_membership / marketData.market_summary.total_businesses) * 100)}% of market`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    <span className="text-2xl font-bold text-white">
                      {marketData.digital_presence?.with_website || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Have Website</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {marketData.market_summary?.total_businesses 
                      ? `${Math.round((marketData.digital_presence?.with_website / marketData.market_summary.total_businesses) * 100)}% online`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-white">
                      {marketData.service_distribution.has_med_director || 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Medical Directors</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {marketData.market_summary?.total_businesses 
                      ? `${Math.round((marketData.service_distribution.has_med_director / marketData.market_summary.total_businesses) * 100)}% have MD`
                      : 'N/A'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Pricing Intelligence */}
          {marketData.pricing_intelligence && marketData.pricing_intelligence.avg_botox_price && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-500/30">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Botox Pricing Analysis
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-500 text-sm">Min Price</p>
                  <p className="text-xl font-bold text-green-400">
                    ${Math.round(marketData.pricing_intelligence.min_botox_price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Average</p>
                  <p className="text-xl font-bold text-yellow-400">
                    ${Math.round(marketData.pricing_intelligence.avg_botox_price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Max Price</p>
                  <p className="text-xl font-bold text-red-400">
                    ${Math.round(marketData.pricing_intelligence.max_botox_price || 0)}
                  </p>
                </div>
              </div>
              {business?.pricing?.botox && (
                <p className="text-sm text-gray-400 text-center mt-3">
                  Your price: <span className="text-white font-semibold">{business.pricing.botox}</span>
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-8 border border-purple-500/30"
        >
          <h3 className="text-2xl font-bold mb-4 text-center">
            Your Competitive Advantages & Opportunities
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-green-400">✓ Strengths</h4>
              <ul className="space-y-2">
                {business?.rating >= 4.5 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <span className="text-gray-300">Excellent rating ({business.rating}★)</span>
                  </li>
                )}
                {business?.website && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <span className="text-gray-300">Active website presence</span>
                  </li>
                )}
                {business?.socialMedia?.instagram && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <span className="text-gray-300">Social media engagement</span>
                  </li>
                )}
                {(performanceMetrics?.reviewPerformance ?? 0) > 100 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <span className="text-gray-300">Above-average review count</span>
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-3 text-red-400">⚡ Opportunities</h4>
              <ul className="space-y-2">
                {analysis?.currentRank > 3 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <span className="text-gray-300">Improve ranking to top 3 (currently #{analysis.currentRank})</span>
                  </li>
                )}
                {analysis?.reviewDeficit > 0 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <span className="text-gray-300">Generate {analysis.reviewDeficit}+ reviews to match competitors</span>
                  </li>
                )}
                {!business?.pricing?.botox && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <span className="text-gray-300">Add transparent pricing information</span>
                  </li>
                )}
                {!business?.socialMedia?.instagram && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <span className="text-gray-300">Build social media presence</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                const actionPlan = document.querySelector('#action-plan');
                if (actionPlan) {
                  actionPlan.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform"
            >
              Get Your Custom Growth Strategy →
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}