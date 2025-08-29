'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Globe, Phone, Star, Users, 
  TrendingUp, DollarSign, Instagram, Facebook, 
  Calendar, AlertCircle, Target, Award, Map,
  Search, BarChart3, Zap, Shield, Activity
} from 'lucide-react';

interface BusinessInsightsProps {
  business: any;
  analysis: any;
}

export default function BusinessInsights({ business, analysis }: BusinessInsightsProps) {
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Click share percentages for top 20 positions
  const clickShares = [33, 17, 11, 8, 6, 5, 4, 3, 2.5, 2, 1.5, 1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5];
  
  // Generate Google Maps search URL
  const getMapsSearchUrl = () => {
    const city = business?.city || '';
    const state = business?.state || '';
    const niche = business?.niche || business?.industry || '';
    const searchQuery = [niche, city, state].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  };
  
  return (
    <section className="py-12 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Your <span className="text-purple-400">Business Intelligence</span> Report
          </h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Complete competitive analysis for {business?.name}{business?.city ? ` in ${business.city}${business.state ? `, ${business.state}` : ''}` : ''}
          </p>
        </motion.div>

        {/* Main Intelligence Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-b from-gray-900 to-black border border-gray-700/50 rounded-xl overflow-hidden"
        >

          {/* Grid Container - Fixed to properly show 1/3 and 2/3 */}
          <div 
            className="p-4"
            style={{ 
              display: 'flex', 
              flexDirection: isLargeScreen ? 'row' : 'column', 
              gap: '1rem' 
            }}
          >
            {/* Left Side - Click Distribution (1/3 width) */}
            <div 
              style={{ 
                width: isLargeScreen ? '33.333%' : '100%',
                order: isLargeScreen ? 1 : 2
              }}
            >
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 h-full max-h-[500px] overflow-hidden flex flex-col">
                <h4 className="text-xs font-bold mb-2 text-yellow-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Click Distribution
                </h4>
                
                <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                  {/* Top Competitors with Click Shares */}
                  {(() => {
                    const competitors = analysis?.marketIntel?.top_competitors || [];
                    // Handle unranked businesses properly
                    const rawRank = analysis?.currentRank;
                    const currentRank = (rawRank === 'unranked' || !rawRank || isNaN(rawRank)) ? 999 : Number(rawRank);
                    const isUnranked = rawRank === 'unranked' || currentRank === 999;
                    const businessPlaceId = business?.place_id;
                    
                    console.log("DEBUG BusinessInsights:");
                    console.log("  Competitors:", competitors.map((c: any, idx: number) => ({ 
                      name: c.name, 
                      placeId: c.place_id,
                      rank: idx + 1,
                      rating: c.rating,
                      reviews: c.reviews,
                      review_count: c.review_count,
                      actualReviews: c.review_count || c.reviews || 0
                    })));
                    console.log("  Current business:", business?.name, "place_id:", businessPlaceId);
                    console.log("  Current rank from analysis:", rawRank, "-> processed as:", currentRank);
                    console.log("  Is unranked?", isUnranked);
                    
                    // Create display items for top 10 competitors
                    const displayItems = [];
                    
                    // Display top 10 competitors
                    for (let i = 0; i < Math.min(10, competitors.length); i++) {
                      const comp = competitors[i];
                      const rank = i + 1; // Rank is index + 1
                      const clickShare = clickShares[rank - 1] || 1;
                      // Handle both review_count and reviews field names
                      const compReviews = comp.review_count || comp.reviews || 0;
                      
                      // Check if this is the searched business (by place_id or by rank match)
                      const isSearchedBusiness = (businessPlaceId && comp.place_id === businessPlaceId) || 
                                                (currentRank === rank);
                      
                      displayItems.push(
                        <div 
                          key={i}
                          className={`p-1.5 rounded text-[11px] ${
                            isSearchedBusiness 
                              ? 'bg-red-900 border-2 border-red-500' 
                              : rank <= 3 
                                ? 'bg-green-900/20 border border-green-500/30'
                                : rank <= 5
                                  ? 'bg-blue-900/20 border border-blue-500/30'
                                  : 'bg-gray-900/50 border border-gray-700/30'
                          }`}
                          style={isSearchedBusiness ? { backgroundColor: 'rgba(220, 38, 38, 0.4)' } : {}}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className={`font-bold ${
                                isSearchedBusiness ? 'text-red-400' :
                                rank <= 3 ? 'text-green-400' : 
                                rank <= 5 ? 'text-blue-400' : 'text-gray-400'
                              }`}>
                                #{rank}
                              </span>
                              {isSearchedBusiness && (
                                <span className="text-[9px] font-bold text-red-400 uppercase">YOU</span>
                              )}
                            </div>
                            <span className={`font-semibold ${
                              isSearchedBusiness ? 'text-red-400' :
                              rank <= 3 ? 'text-green-400' :
                              rank <= 5 ? 'text-blue-400' : 'text-gray-500'
                            }`}>
                              {clickShare}%
                            </span>
                          </div>
                          
                          <div className={`truncate mb-0.5 ${
                            isSearchedBusiness ? 'text-white font-semibold' : 'text-gray-300'
                          }`}>
                            {comp.name}
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={rank <= 3 && !isSearchedBusiness ? 'text-green-400 font-semibold' : 'text-gray-500'}>
                              ★{comp.rating != null && !isNaN(Number(comp.rating)) 
                                ? Number(comp.rating).toFixed(1) 
                                : 'N/A'} ({compReviews})
                            </span>
                            <span className={
                              isSearchedBusiness ? 'text-red-400' : 
                              rank <= 3 ? 'text-green-400 font-semibold' : 
                              rank <= 5 ? 'text-blue-400' : 'text-gray-400'
                            }>
                              ~{Math.round(clickShare * 10)} leads/mo
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    // If searched business is unranked or beyond rank 10, add it separately
                    if (isUnranked || (currentRank > 10 && currentRank < 999)) {
                      const yourClickShare = isUnranked ? 0 : (clickShares[currentRank - 1] || 0.5);
                      
                      displayItems.push(
                        <div key="separator" className="text-center text-[10px] text-gray-500 py-1">
                          {isUnranked ? '••• Not Ranked •••' : `••• ${currentRank - 11} others •••`}
                        </div>
                      );
                      
                      displayItems.push(
                        <div 
                          key="current-business"
                          className="p-1.5 rounded text-[11px] bg-red-900 border-2 border-red-500"
                          style={{ backgroundColor: 'rgba(220, 38, 38, 0.4)' }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-red-400">
                                {isUnranked ? 'UNRANKED' : `#${currentRank}`}
                              </span>
                              <span className="text-[9px] font-bold text-red-400 uppercase">YOU</span>
                            </div>
                            <span className="font-semibold text-red-400">
                              {isUnranked ? '0%' : `${yourClickShare}%`}
                            </span>
                          </div>
                          
                          <div className="text-white font-semibold truncate mb-0.5">
                            {business?.name || 'Your Business'}
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-500">
                              ★{business?.rating != null && !isNaN(Number(business.rating)) 
                                ? Number(business.rating).toFixed(1) 
                                : 'N/A'} ({business?.reviewCount || 0})
                            </span>
                            <span className="text-red-400">
                              {isUnranked ? '~0 leads/mo' : `~${Math.round(yourClickShare * 10)} leads/mo`}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    return displayItems;
                  })()}
                </div>

                {/* Summary Stats */}
                <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Top 3 capture:</span>
                    <span className="text-green-400 font-semibold">61% of clicks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your share:</span>
                    <span className="text-red-400 font-semibold">
                      {analysis?.currentRank === 'unranked' 
                        ? '0%' 
                        : analysis?.currentRank && analysis.currentRank <= 20 
                          ? `${clickShares[analysis.currentRank - 1]}%` 
                          : '<1%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly opportunity:</span>
                    <span className="text-yellow-400 font-semibold">~1,000 searches</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Google Map (2/3 width) */}
            <div 
              style={{ 
                width: isLargeScreen ? '66.667%' : '100%',
                order: isLargeScreen ? 2 : 1
              }}
            >
              <div className="relative h-[400px] lg:h-[500px] rounded-lg overflow-hidden">
                <iframe 
                  src={(() => {
                    // If we have the business coordinates, center on it
                    if (business?.coordinates?.lat && business?.coordinates?.lng) {
                      // Use place mode to show the specific business
                      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.coordinates.lat},${business.coordinates.lng}&zoom=13`;
                    }
                    
                    // Otherwise use search to show competitors in the area
                    const searchTerms = [];
                    
                    // Add the niche/industry
                    const niche = business?.niche || business?.industry || 'businesses';
                    searchTerms.push(niche);
                    
                    // Add location if available
                    if (business?.city) searchTerms.push(business.city);
                    if (business?.state) searchTerms.push(business.state);
                    
                    const searchQuery = searchTerms.join(' ');
                    
                    // Use search mode to show multiple businesses in the area
                    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(searchQuery)}&zoom=12`;
                  })()}
                  className="w-full h-full"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Business Indicator - Top Center */}
                {business?.name && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-4 py-2 shadow-lg border-2 border-red-500">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">📍 YOUR BUSINESS:</span>
                      <span className="text-sm font-semibold text-black">{business.name}</span>
                    </div>
                  </div>
                )}
                
                {/* Market Benchmarks Overlay - Top Left */}
                {analysis?.marketIntel?.review_momentum && (
                  <div className="absolute top-16 left-4 bg-gray-900 rounded-lg p-3 max-w-[180px] border border-gray-700">
                    <h4 className="text-xs font-bold text-white mb-2">Market Benchmarks</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">100+ Reviews</span>
                        <span className="font-bold text-yellow-400">{analysis.marketIntel.review_momentum.over_100_reviews || 0}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">500+ Reviews</span>
                        <span className="font-bold text-green-400">{analysis.marketIntel.review_momentum.over_500_reviews || 0}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">4.8+ Rating</span>
                        <span className="font-bold text-purple-400">{analysis.marketIntel.review_momentum.excellent_rating || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Intelligence Overlay - Top Right */}
                {analysis?.marketIntel?.market_summary && (
                  <div className="absolute top-16 right-4 bg-gray-900 rounded-lg p-3 max-w-[200px] border border-gray-700">
                    <h4 className="text-xs font-bold text-white mb-2">Market Leaders</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Total Competitors</span>
                        <span className="font-bold text-white">{analysis.marketIntel.market_summary.total_businesses || 0}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Avg Rating</span>
                        <span className="font-bold text-yellow-400">★{analysis.marketIntel.market_summary.avg_rating || '0.0'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Avg Reviews</span>
                        <span className="font-bold text-blue-400">{Math.round(analysis.marketIntel.market_summary.avg_reviews || 0)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Median Reviews</span>
                        <span className="font-bold text-purple-400">{Math.round(analysis.marketIntel.market_summary.median_reviews || 0)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Top Performer</span>
                        <span className="font-bold text-green-400">{analysis.marketIntel.market_summary.max_reviews || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                
                {/* Map Controls - Bottom Inside Map */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row gap-2">
                  <a 
                    href={getMapsSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold text-center transition-colors border border-gray-700"
                  >
                    View in Google Maps
                  </a>
                  {business?.name && (
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(business.name + ' ' + (business.city || ''))}&tbm=lcl`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold text-center transition-colors border border-gray-700"
                    >
                      View Your Profile
                    </a>
                  )}
                </div>
              </div>
              {/* KPI Cards - Below Map */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Target className="w-4 h-4 text-red-400" />
                    <span className="text-xl font-bold text-red-400">
                      {analysis?.currentRank === 'unranked' ? 'N/A' : `#${analysis?.currentRank || '?'}`}
                    </span>
                  </div>
                  <h3 className="text-xs text-gray-400">Google Rank</h3>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xl font-bold text-blue-400">
                      {business?.reviewCount || 0}
                    </span>
                  </div>
                  <h3 className="text-xs text-gray-400">Reviews</h3>
                  {analysis?.reviewDeficit > 0 && (
                    <p className="text-xs text-red-400">-{analysis.reviewDeficit} vs avg</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-xl font-bold text-yellow-400">
                      {business?.rating != null && !isNaN(Number(business.rating)) 
                        ? Number(business.rating).toFixed(1) 
                        : 'N/A'}
                    </span>
                  </div>
                  <h3 className="text-xs text-gray-400">Rating</h3>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-900/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-lg font-bold text-red-400">
                      -${analysis?.lostRevenue ? (analysis.lostRevenue/1000).toFixed(0) : '0'}k
                    </span>
                  </div>
                  <h3 className="text-xs text-gray-400">Lost/Year</h3>
                </div>
              </div>

              {/* Business Contact Information */}
              {(business?.website || business?.phone) && (
                <div className="mt-4 bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-bold">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {business?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a 
                          href={`tel:${business.phone}`}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {business.phone}
                        </a>
                      </div>
                    )}
                    {business?.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a 
                          href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                        >
                          {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Intelligence Stats - Below KPIs */}
              <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold">Local Market Intelligence</h3>
                  <p className="text-xs text-gray-400">
                    {(() => {
                      const niche = business?.niche || business?.industry;
                      const city = business?.city;
                      const state = business?.state;
                      
                      // Only show niche if it's not the same as business name
                      const displayNiche = niche && niche !== business?.name ? niche : '';
                      
                      const parts = [displayNiche, city, state].filter(Boolean);
                      return parts.length > 0 ? `"${parts.join(' ')}" Search` : 'Local Search';
                    })()}
                  </p>
                </div>
                
                {analysis?.marketIntel?.market_summary && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Competitors</p>
                      <p className="text-sm font-bold text-white">{analysis.marketIntel.market_summary.total_businesses}</p>
                    </div>
                    <div className="bg-yellow-500/20 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Avg Rating</p>
                      <p className="text-sm font-bold text-yellow-400">
                        {analysis.marketIntel.market_summary.avg_rating ? 
                          `${analysis.marketIntel.market_summary.avg_rating}★` : '0★'}
                      </p>
                    </div>
                    <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Avg Reviews</p>
                      <p className="text-sm font-bold text-blue-400">{Math.round(analysis.marketIntel.market_summary.avg_reviews || 0)}</p>
                    </div>
                    <div className="bg-red-900/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Your Rank</p>
                      <p className="text-sm font-bold text-red-400">
                        {analysis?.currentRank === 'unranked' ? 'Unranked' : `#${analysis?.currentRank || '?'}`}
                      </p>
                    </div>
                    <div className="bg-green-900/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Top Performer</p>
                      <p className="text-sm font-bold text-green-400">{analysis.marketIntel.market_summary.max_reviews} reviews</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}