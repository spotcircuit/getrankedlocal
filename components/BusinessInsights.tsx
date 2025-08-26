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
    const niche = business?.niche || 'med spas';
    return `https://www.google.com/maps/search/${encodeURIComponent(`${niche} ${city} ${state}`)}`;
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
            Complete competitive analysis for {business?.name} in {business?.city}, {business?.state}
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
                  {/* Top 10 Competitors with Click Shares */}
                  {(() => {
                    const competitors = analysis?.marketIntel?.top_competitors || [];
                    const currentRank = analysis?.currentRank || 999;
                    const businessInTop10 = competitors.slice(0, 10).some((c: any) => c.name === business?.name);
                    
                    // Display top 10 competitors
                    const topCompetitors = competitors.slice(0, 10).map((comp: any, idx: number) => {
                      const position = idx + 1;
                      const clickShare = clickShares[idx] || 1;
                      const isYourBusiness = comp.name === business?.name;
                      
                      return (
                        <div 
                          key={idx}
                          className={`p-1.5 rounded text-[11px] ${
                            isYourBusiness 
                              ? 'bg-red-900 border-2 border-red-500' 
                              : position <= 3 
                                ? 'bg-green-900/20 border border-green-500/30'
                                : 'bg-gray-900/50 border border-gray-700/30'
                          }`}
                          style={isYourBusiness ? { backgroundColor: 'rgba(220, 38, 38, 0.4)' } : {}}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className={`font-bold ${
                                isYourBusiness ? 'text-red-400' :
                                position <= 3 ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                #{position}
                              </span>
                              {isYourBusiness && (
                                <span className="text-[9px] font-bold text-red-400 uppercase">YOU</span>
                              )}
                            </div>
                            <span className={`font-semibold ${
                              isYourBusiness ? 'text-red-400' :
                              position <= 3 ? 'text-green-400' : 'text-gray-500'
                            }`}>
                              {clickShare}%
                            </span>
                          </div>
                          
                          <div className={`truncate mb-0.5 ${
                            isYourBusiness ? 'text-white font-semibold' : 'text-gray-300'
                          }`}>
                            {comp.name}
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={position <= 3 && !isYourBusiness ? 'text-green-400 font-semibold' : 'text-gray-500'}>
                              ★{comp.rating != null && !isNaN(Number(comp.rating)) 
                                ? Number(comp.rating).toFixed(1) 
                                : 'N/A'} ({comp.reviews || 0})
                            </span>
                            <span className={isYourBusiness ? 'text-red-400' : position <= 3 ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                              ~{Math.round(clickShare * 10)} leads/mo
                            </span>
                          </div>
                        </div>
                      );
                    });
                    
                    // If business not in top 10, add it separately
                    if (!businessInTop10 && currentRank > 10 && currentRank <= 20) {
                      const yourClickShare = clickShares[currentRank - 1] || 0.5;
                      topCompetitors.push(
                        <div key="separator" className="text-center text-[10px] text-gray-500 py-1">
                          ••• {currentRank - 11} others •••
                        </div>
                      );
                      topCompetitors.push(
                        <div 
                          key="current-business"
                          className="p-1.5 rounded text-[11px] bg-red-900 border-2 border-red-500"
                          style={{ backgroundColor: 'rgba(220, 38, 38, 0.4)' }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-red-400">#{currentRank}</span>
                              <span className="text-[9px] font-bold text-red-400 uppercase">YOU</span>
                            </div>
                            <span className="font-semibold text-red-400">{yourClickShare}%</span>
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
                              ~{Math.round(yourClickShare * 10)} leads/mo
                            </span>
                          </div>
                        </div>
                      );
                    } else if (!businessInTop10 && currentRank > 20) {
                      topCompetitors.push(
                        <div key="separator" className="text-center text-[10px] text-gray-500 py-1">
                          ••• many others •••
                        </div>
                      );
                      topCompetitors.push(
                        <div 
                          key="current-business"
                          className="p-1.5 rounded text-[11px] bg-red-900 border-2 border-red-500"
                          style={{ backgroundColor: 'rgba(220, 38, 38, 0.4)' }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-red-400">#{currentRank}</span>
                              <span className="text-[9px] font-bold text-red-400 uppercase">YOU'RE HERE</span>
                            </div>
                            <span className="font-semibold text-red-400">&lt;1%</span>
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
                              ~0-5 leads/mo
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    return topCompetitors;
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
                      {analysis?.currentRank && analysis.currentRank <= 20 
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
                  src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${business?.niche || 'med spas'} ${business?.city || ''} ${business?.state || ''}`)}&zoom=12`}
                  className="w-full h-full"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Market Benchmarks Overlay - Top Left */}
                {analysis?.marketIntel?.review_momentum && (
                  <div className="absolute top-4 left-4 bg-gray-900 rounded-lg p-3 max-w-[180px] border border-gray-700">
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

                {/* Digital Presence Overlay - Top Right */}
                {analysis?.marketIntel?.digital_presence && (
                  <div className="absolute top-4 right-4 bg-gray-900 rounded-lg p-3 max-w-[180px] border border-gray-700">
                    <h4 className="text-xs font-bold text-white mb-2">Digital Presence</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Website</span>
                        <span className="font-bold text-white">{analysis.marketIntel.digital_presence.with_website}/{analysis.marketIntel.market_summary?.total_businesses || '?'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Instagram</span>
                        <span className="font-bold text-pink-400">{analysis.marketIntel.digital_presence.with_instagram}/{analysis.marketIntel.market_summary?.total_businesses || '?'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-300">Facebook</span>
                        <span className="font-bold text-blue-400">{analysis.marketIntel.digital_presence.with_facebook}/{analysis.marketIntel.market_summary?.total_businesses || '?'}</span>
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
                      #{analysis?.currentRank || '?'}
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

              {/* Market Intelligence Stats - Below KPIs */}
              <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold">Local Market Intelligence</h3>
                  <p className="text-xs text-gray-400">
                    "{business?.niche || 'med spas'} {business?.city} {business?.state}" Search
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
                          analysis.marketIntel.market_summary.avg_rating.toFixed(2) : '0'}★
                      </p>
                    </div>
                    <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Median</p>
                      <p className="text-sm font-bold text-blue-400">{Math.round(analysis.marketIntel.market_summary.median_reviews || 0)}</p>
                    </div>
                    <div className="bg-red-900/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Your Rank</p>
                      <p className="text-sm font-bold text-red-400">#{analysis?.currentRank || '?'}</p>
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