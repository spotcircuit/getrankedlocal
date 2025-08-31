'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Star, Users, MapPin, Phone, Globe, DollarSign,
  ChevronRight, Trophy, Target, Sparkles
} from 'lucide-react';

interface ResultsSectionProps {
  results: any;
  businessName: string;
}

export default function ResultsSection({ results, businessName }: ResultsSectionProps) {
  if (!results) return null;

  const { business, analysis, ai_intelligence, market_analysis, top_competitors } = results;
  
  // Determine rank status
  const getRankStatus = (rank: number) => {
    if (rank <= 3) return { color: 'text-green-400', bg: 'bg-green-500/20', icon: Trophy, message: 'Excellent position!' };
    if (rank <= 10) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: TrendingUp, message: 'Room for improvement' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle, message: 'Needs immediate attention' };
  };

  const rankStatus = getRankStatus(business?.rank || market_analysis?.rank_position || 99);

  return (
    <section className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4 text-white">
            Analysis Results for {business?.name || businessName}
          </h2>
          <p className="text-xl text-gray-300">
            Here's your competitive landscape in {business?.address ? business.address.split(',').slice(1, 3).join(',').trim() : 'your area'}
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:p-6 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`${rankStatus.bg} backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 text-white`}
          >
            <div className="flex items-center justify-between mb-2">
              <rankStatus.icon className={`w-8 h-8 ${rankStatus.color}`} />
              <span className={`text-3xl font-bold ${rankStatus.color}`}>
                #{business?.rank || market_analysis?.rank_position || 'N/A'}
              </span>
            </div>
            <h3 className="text-lg font-semibold">Current Rank</h3>
            <p className="text-sm text-gray-400">{rankStatus.message}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold">{business?.rating || '0'}</span>
            </div>
            <h3 className="text-lg font-semibold">Rating</h3>
            <p className="text-sm text-gray-400">{business?.review_count || 0} reviews</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold">{market_analysis?.total_competitors || business?.total_competitors || 0}</span>
            </div>
            <h3 className="text-lg font-semibold">Competitors</h3>
            <p className="text-sm text-gray-400">In your market</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-red-400" />
              <span className="text-2xl font-bold text-red-400">
                ${(((business?.rank || market_analysis?.rank_position || 99) > 3 ? 75000 : 0) / 1000).toFixed(0)}k
              </span>
            </div>
            <h3 className="text-lg font-semibold">Lost Revenue</h3>
            <p className="text-sm text-gray-400">Monthly opportunity</p>
          </motion.div>
        </div>

        {/* Business Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-8 mb-12 border border-gray-700 text-white"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            Business Details
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact & Location */}
            <div className="space-y-4">
              {business?.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Website</p>
                    <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {business.website}
                    </a>
                  </div>
                </div>
              )}
              
              {ai_intelligence?.domain && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Domain</p>
                    <p className="text-white">{ai_intelligence.domain}</p>
                  </div>
                </div>
              )}
              
              {business?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white">{business.phone}</p>
                  </div>
                </div>
              )}
              
              {business?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p className="text-white">{business.address}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Market Position & Key People */}
            <div className="space-y-4">
              {market_analysis?.market_share_position && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Market Position</p>
                  <p className="text-lg font-semibold text-white">{market_analysis.market_share_position}</p>
                  <div className="flex gap-4 mt-2">
                    <span className={`text-sm ${market_analysis.in_top_3 ? 'text-green-400' : 'text-gray-500'}`}>
                      {market_analysis.in_top_3 ? '✓' : '✗'} Top 3
                    </span>
                    <span className={`text-sm ${market_analysis.in_top_10 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {market_analysis.in_top_10 ? '✓' : '✗'} Top 10
                    </span>
                  </div>
                </div>
              )}
              
              {ai_intelligence?.medical_director?.name && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Medical Director</p>
                  <p className="text-lg font-semibold text-white">{ai_intelligence.medical_director.name}</p>
                </div>
              )}
              
              {ai_intelligence?.owner?.name && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Owner</p>
                  <p className="text-lg font-semibold text-white">{ai_intelligence.owner.name}</p>
                </div>
              )}
              
              {ai_intelligence?.pricing?.membership && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Membership Pricing</p>
                  <p className="text-lg font-semibold text-green-400">{ai_intelligence.pricing.membership}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Business Hours */}
          {business?.profile_data?.hours && Object.keys(business.profile_data.hours).length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3 text-white">Business Hours</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
                {Object.entries(business.profile_data.hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="bg-gray-800/50 p-2 rounded text-center">
                    <p className="text-xs text-gray-400 capitalize">{day}</p>
                    <p className="text-xs text-white">{hours}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Services */}
          {business?.profile_data?.services && business.profile_data.services.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3 text-white">Services Offered</h4>
              <div className="flex flex-wrap gap-2">
                {business.profile_data.services.map((service: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-gray-800/50 text-sm text-gray-300 rounded-full">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Competitor Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-8 mb-12 border border-gray-700 text-white"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-400" />
            Competitor Landscape Map
          </h3>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="relative h-[400px] lg:h-[500px] rounded-lg overflow-hidden">
                <iframe 
                  src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${business?.niche || 'business'} near ${business?.address || `${business?.city}, ${business?.state}`}`)}&zoom=10`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Your Business Overlay */}
                <div className="absolute top-4 left-4 bg-gray-900 rounded-lg p-3 max-w-[200px] border-2 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-white">Your Business</span>
                  </div>
                  <p className="text-xs text-gray-300">{business?.name}</p>
                  <p className="text-xs text-blue-400">Rank #{business?.rank || 'N/A'}</p>
                </div>
                
                {/* Competitor Count */}
                <div className="absolute bottom-4 right-4 bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <p className="text-2xl font-bold text-white">{business?.total_competitors || market_analysis?.total_competitors || 0}</p>
                  <p className="text-xs text-gray-400">Total Competitors</p>
                </div>
              </div>
            </div>
            
            {/* Competitor Rankings List */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold mb-3 text-white">Top 10 Rankings</h4>
              <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar">
                {/* Show all available competitors if we have them */}
                {results?.all_competitors ? (
                  results.all_competitors.slice(0, 10).map((competitor: string, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        competitor === business?.name 
                          ? 'bg-blue-900/30 border border-blue-500' 
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          idx < 3 ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[150px]">
                            {competitor}
                          </p>
                          {competitor === business?.name && (
                            <p className="text-xs text-blue-400">You are here</p>
                          )}
                        </div>
                      </div>
                      {idx < 3 && (
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  ))
                ) : (
                  /* Fallback to top_competitors if full list not available */
                  top_competitors && top_competitors.slice(0, 10).map((comp: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        comp.rank === business?.rank 
                          ? 'bg-blue-900/30 border border-blue-500' 
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          comp.rank <= 3 ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          #{comp.rank}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[150px]">
                            {comp.name}
                          </p>
                          <p className="text-xs text-gray-400">{comp.reviews} reviews</p>
                        </div>
                      </div>
                      {comp.rank <= 3 && (
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* View in Google Maps Link */}
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(`${business?.niche || 'business'} near ${business?.address || `${business?.city}, ${business?.state}`}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mt-4"
              >
                <MapPin className="w-4 h-4" />
                View all in Google Maps
              </a>
            </div>
          </div>
        </motion.div>

        {/* Top Competitors */}
        {(top_competitors && top_competitors.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-8 mb-12 border border-gray-700 text-white"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Top Competitors
            </h3>
            
            <div className="space-y-4">
              {top_competitors.slice(0, 5).map((competitor: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${competitor.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      #{competitor.rank}
                    </span>
                    <div>
                      <h4 className="font-semibold">{competitor.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {competitor.rating}
                        </span>
                        <span>{competitor.reviews} reviews</span>
                      </div>
                    </div>
                  </div>
                  
                  {competitor.rank < (business?.rank || market_analysis?.rank_position || 99) && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      Outranking you
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Intelligence Insights */}
        {ai_intelligence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-900 backdrop-blur-sm rounded-xl p-4 sm:p-8 mb-12 border border-purple-700/50"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI Intelligence Report
            </h3>
            
            {/* Business Intelligence */}
            {ai_intelligence.business_intel && (
              <div className="mb-6 grid md:grid-cols-3 gap-4">
                {ai_intelligence.business_intel.founded && (
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Founded</p>
                    <p className="text-lg font-semibold text-white">{ai_intelligence.business_intel.founded}</p>
                  </div>
                )}
                {ai_intelligence.business_intel.expanding && (
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-lg font-semibold text-green-400">Expanding</p>
                  </div>
                )}
                {ai_intelligence.business_intel.hiring && (
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Hiring</p>
                    <p className="text-lg font-semibold text-blue-400">Active</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Information */}
            {ai_intelligence.contacts && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-white">Contact Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {ai_intelligence.contacts.emails && ai_intelligence.contacts.emails.length > 0 && (
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{ai_intelligence.contacts.emails[0]}</p>
                    </div>
                  )}
                  {ai_intelligence.contacts.phones && ai_intelligence.contacts.phones.length > 0 && (
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{ai_intelligence.contacts.phones[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Media Presence */}
            {ai_intelligence.social_media && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-white">Social Media Presence</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(ai_intelligence.social_media).map(([platform, data]: [string, any]) => (
                    data && data.handle && (
                      <div key={platform} className="bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 capitalize">{platform}</p>
                        <p className="text-sm text-white truncate">{data.handle}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Review Insights */}
            {ai_intelligence.review_insights && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-white">Review Analysis</h4>
                <div className="grid md:grid-cols-2 gap-4 sm:p-6">
                  {ai_intelligence.review_insights.positive_themes && ai_intelligence.review_insights.positive_themes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-green-400">Positive Themes</p>
                      <ul className="space-y-1">
                        {ai_intelligence.review_insights.positive_themes.slice(0, 3).map((theme: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                            <span className="text-sm text-gray-300">{theme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ai_intelligence.review_insights.negative_themes && ai_intelligence.review_insights.negative_themes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-red-400">Areas to Improve</p>
                      <ul className="space-y-1">
                        {ai_intelligence.review_insights.negative_themes.slice(0, 3).map((theme: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                            <span className="text-sm text-gray-300">{theme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 sm:p-6">
              {/* Strengths - Keep existing but ensure text colors */}
              {ai_intelligence.strengths && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-green-400">Competitive Strengths</h4>
                  <ul className="space-y-2">
                    {ai_intelligence.strengths.slice(0, 3).map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <span className="text-gray-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {ai_intelligence.weaknesses && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-red-400">Improvement Areas</h4>
                  <ul className="space-y-2">
                    {ai_intelligence.weaknesses.slice(0, 3).map((weakness: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                        <span className="text-gray-300">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {ai_intelligence.recommendations && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-white">Recommended Actions</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {ai_intelligence.recommendations.slice(0, 4).map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg">
                      <Target className="w-5 h-5 text-blue-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Plan CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center bg-gray-800 backdrop-blur-sm rounded-xl p-4 sm:p-8 border border-gray-700"
        >
          <h3 className="text-2xl font-bold mb-4 text-white">Ready to Dominate Your Local Market?</h3>
          <p className="text-lg text-gray-400 mb-6">
            We can help you reach #1 in Google Maps within 90 days
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold text-white transition-all transform hover:scale-105 inline-flex items-center gap-2">
            Get Your Custom Action Plan
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}