'use client';

import { motion } from 'framer-motion';
import { 
  Building2, MapPin, Globe, Phone, Star, Users, 
  TrendingUp, DollarSign, Instagram, Facebook, 
  Calendar, AlertCircle, Target, Award, Map
} from 'lucide-react';

interface BusinessInsightsProps {
  business: any;
  analysis: any;
}

export default function BusinessInsights({ business, analysis }: BusinessInsightsProps) {
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  
  // Clean up Instagram handle
  const getCleanInstagram = (handle: string | null | undefined) => {
    if (!handle) return null;
    // Filter out email addresses or invalid handles
    if (handle.includes('@') && handle.includes('.com')) return null;
    if (handle.includes('gmail')) return null;
    return handle;
  };

  // Generate Google Maps search URL for med spas
  const getMapsSearchUrl = () => {
    const city = business?.city || '';
    const state = business?.state || '';
    const niche = business?.niche || 'med spas';
    return `https://www.google.com/maps/search/${encodeURIComponent(`${niche} ${city} ${state}`)}`;
  };
  
  return (
    <section className="py-12 px-4 sm:px-6 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto">
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
            Everything we know about {business?.name} and your competition
          </p>
        </motion.div>

        {/* Main Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              <span className="text-xl sm:text-2xl font-bold text-red-400">#{typeof analysis?.currentRank === 'number' ? analysis.currentRank : '—'}</span>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-400">Google Rank</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <span className="text-xl sm:text-2xl font-bold text-blue-400">
                {typeof business?.reviewCount === 'number' ? business.reviewCount : '—'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-400">Reviews</h3>
            {typeof analysis?.reviewDeficit === 'number' && analysis.reviewDeficit > 0 ? (
              <p className="text-[10px] sm:text-xs text-red-400">-{analysis.reviewDeficit}</p>
            ) : (
              <p className="text-[10px] sm:text-xs text-gray-500">—</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/10 border border-yellow-500/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <span className="text-xl sm:text-2xl font-bold text-yellow-400">
                {business?.rating != null && typeof business.rating === 'number' ? business.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-400">Rating</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-600/20 to-green-900/10 border border-green-500/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <span className="text-lg sm:text-xl font-bold text-red-400">
                {typeof analysis?.lostRevenue === 'number' && analysis.lostRevenue > 0
                  ? `-$${(analysis.lostRevenue/1000).toFixed(0)}k`
                  : '—'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-400">Lost/Year</h3>
          </motion.div>
        </div>

        {/* Google Maps Box with All Content - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-700/50 rounded-xl p-6 mb-12"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Map className="w-6 h-6 text-blue-400" />
                Local Market Intelligence
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Real-time competitive data for {business?.niche || 'med spas'} in {business?.city}, {business?.state}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Data Source</p>
              <p className="text-sm font-semibold text-blue-400">Google Maps API</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            {/* Left Column - Business Profile & Market Intel */}
            <div className="w-64 space-y-3 max-h-[600px] overflow-y-auto">
              {/* Business Profile - Compact */}
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  {business?.name || 'Business Profile'}
                </h4>
                <div className="space-y-2 text-xs">
                  {business?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-300">{business.address}</p>
                        <p className="text-gray-400">{business.city}, {business.state}</p>
                      </div>
                    </div>
                  )}
                  {business?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-gray-400" />
                      <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:underline truncate">
                        {business.website}
                      </a>
                    </div>
                  )}
                  {business?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">{business.phone}</span>
                    </div>
                  )}
                  {business?.ownerName && (
                    <div className="flex items-center gap-2">
                      <Award className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">Owner: {business.ownerName}</span>
                    </div>
                  )}
                  {business?.medicalDirector && (
                    <div className="flex items-center gap-2">
                      <Award className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">MD: {business.medicalDirector}</span>
                    </div>
                  )}
                </div>
                
                {/* Social Media */}
                {(getCleanInstagram(business?.socialMedia?.instagram) || business?.socialMedia?.facebook) && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex gap-3">
                      {getCleanInstagram(business?.socialMedia?.instagram) && (
                        <a href={`https://instagram.com/${getCleanInstagram(business.socialMedia.instagram)?.replace('@', '')}`} 
                           target="_blank" rel="noopener noreferrer"
                           className="text-pink-400 hover:text-pink-300">
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {business?.socialMedia?.facebook && (
                        <a href={`https://facebook.com/${business.socialMedia.facebook}`} 
                           target="_blank" rel="noopener noreferrer"
                           className="text-blue-400 hover:text-blue-300">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Market Intelligence - Compact */}
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Market Intelligence
                </h4>
                
                {/* Market Overview */}
                {analysis?.marketIntel?.market_summary ? (
                  <div className="bg-black/30 rounded-lg p-2 mb-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Competitors</p>
                        <p className="font-bold text-gray-300">
                          {analysis.marketIntel.market_summary.total_businesses}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Reviews</p>
                        <p className="font-bold text-yellow-400">
                          {Math.round(analysis.marketIntel.market_summary.avg_reviews)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Your Position: <span className="text-red-400 font-bold">
                        #{analysis?.currentRank || '?'} of {analysis.marketIntel.market_summary.total_businesses}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-lg p-2 mb-2">
                    <p className="text-xs text-gray-400">Loading market data...</p>
                  </div>
                )}

                {/* Top Competitors */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-semibold">Top Competitors</p>
                  {analysis?.marketIntel?.top_competitors?.slice(0, 3).map((comp: any, idx: number) => (
                    <div key={idx} className="bg-black/30 rounded p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-bold">#{idx + 1}</span>
                        <span className="text-gray-300 truncate mx-2">{comp.name}</span>
                        <span className="text-yellow-400">★{comp.rating != null ? comp.rating.toFixed(1) : 'N/A'}</span>
                      </div>
                      <p className="text-gray-500 text-[10px]">{comp.reviews} reviews</p>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2 mt-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-400 font-semibold">
                        You're losing {analysis?.potentialTraffic || '85%'} of searches
                      </p>
                      <p className="text-[10px] text-gray-400">
                        ~792 leads/month to competitors
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Map */}
            <div className="flex-1">
              <iframe 
                src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${business?.niche || 'med spas'} ${business?.city || ''} ${business?.state || ''}`)}&zoom=11`}
                className="w-full rounded-lg"
                style={{ border: 0, height: '600px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="mt-3 flex gap-2">
                <a 
                  href={getMapsSearchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-xs font-semibold transition-colors text-center"
                >
                  Open in Google Maps
                </a>
                {business?.name && (
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(business.name + ' ' + (business.city || ''))}&tbm=lcl`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-xs font-semibold transition-colors text-center"
                  >
                    View Your Profile
                  </a>
                )}
              </div>
            </div>

            {/* Right - Competitors List */}
            <div className="w-80 max-h-[600px] overflow-y-auto space-y-2">
              <div className="text-xs text-gray-400 font-semibold mb-3 uppercase sticky top-0 bg-gray-900 p-2 -m-2 z-10">
                🏆 Top 3 Get 61% of Clicks
              </div>
              
              {/* Show all competitors */}
              {analysis?.marketIntel?.top_competitors?.map((comp: any, idx: number) => {
                const position = idx + 1;
                const clickShares = [33, 17, 11, 8, 6, 5, 4, 3, 2.5, 2];
                const clickShare = clickShares[idx] || 1;
                const isYourBusiness = comp.name === business?.name;
                
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      isYourBusiness 
                        ? 'bg-red-900/20 border-red-500/30' 
                        : position <= 3 
                          ? 'bg-green-900/20 border-green-500/30'
                          : 'bg-gray-800/50 border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-center">
                        <span className={`text-2xl font-bold ${
                          position <= 3 ? 'text-green-400' : 
                          isYourBusiness ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          #{position}
                        </span>
                        <div className={`text-xs mt-1 font-semibold ${
                          position <= 3 ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {clickShare}%
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          {isYourBusiness && <span className="text-red-400">📍</span>}
                          {comp.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {business?.city}, {business?.state}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-yellow-400">
                            ★ {comp.rating != null ? comp.rating.toFixed(1) : 'N/A'}
                          </span>
                          <span className="text-xs text-gray-400">({comp.reviews || 0} reviews)</span>
                          {comp.website && (
                            <span className="text-xs text-blue-400">🌐</span>
                          )}
                        </div>
                        {/* Keywords/Services */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {['Botox', 'Fillers', 'Laser'].map((service) => (
                            <span key={service} className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-400">
                              {service}
                            </span>
                          ))}
                        </div>
                        {/* Click potential */}
                        <div className="mt-2 text-xs">
                          <span className={`font-semibold ${
                            position <= 3 ? 'text-green-400' : 'text-gray-500'
                          }`}>
                            ~{Math.round(clickShare * 30)} clicks/mo
                          </span>
                          <span className="text-gray-600 ml-2">
                            ({Math.round(clickShare)}% CTR)
                          </span>
                        </div>
                      </div>
                    </div>
                    {isYourBusiness && (
                      <p className="text-xs text-red-400 mt-2 font-semibold">
                        ⚠️ You're losing ~{Math.round((100 - clickShare) * 10)} potential customers/month
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Summary Stats */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <div className="text-xs text-gray-500 font-semibold mb-2">MONTHLY OPPORTUNITY</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Searches:</span>
                    <span className="text-white font-semibold">~1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Top 3 Get:</span>
                    <span className="text-green-400 font-semibold">61% of clicks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Share:</span>
                    <span className="text-red-400 font-semibold">
                      {analysis?.currentRank <= 10 ? `~${[33, 17, 11, 8, 6, 5, 4, 3, 2.5, 2][analysis.currentRank - 1]}%` : '<1%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potential Revenue:</span>
                    <span className="text-yellow-400 font-semibold">
                      ${analysis?.currentRank <= 3 ? '15-30K' : analysis?.currentRank <= 10 ? '5-15K' : '0-5K'}/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button 
            onClick={() => {
              const actionPlan = document.querySelector('#action-plan');
              if (actionPlan) {
                actionPlan.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform"
          >
            Get Your Custom SEO Strategy →
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Free analysis • No obligations • Results in 90 days
          </p>
        </motion.div>
      </div>
    </section>
  );
}