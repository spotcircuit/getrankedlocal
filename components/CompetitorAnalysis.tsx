'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Star, Users, CheckCircle, XCircle, Calculator, DollarSign, Globe, Phone, Clock, MapPin, ArrowRight, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import LostRevenueCalculator from './LostRevenueCalculator';
import KeyFactors from './KeyFactors';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';

interface Competitor {
  name: string;
  rank: number;
  reviews: number;
  rating: number;
  advantages: string[];
  city?: string;
  website?: string;
  phone?: string;
}

interface CompetitorAnalysisProps {
  competitors: Competitor[];
  businessName: string;
  businessRating?: number | null;
  businessReviews?: number | null;
  currentRank?: number | null;
  businessWebsite?: string;
  city?: string;
  state?: string;
}

export default function CompetitorAnalysis({ competitors, businessName, businessRating, businessReviews, currentRank, businessWebsite = '', city = '', state = '' }: CompetitorAnalysisProps) {
  const [showCalculator, setShowCalculator] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasSubmittedForm, setHasSubmittedForm] = useState(false);
  
  useEffect(() => {
    const leadData = localStorage.getItem('leadCaptured');
    if (leadData) {
      setHasSubmittedForm(true);
    }
  }, []);
  
  const handleLeadSubmit = (data: LeadData) => {
    setHasSubmittedForm(true);
    setShowLeadForm(false);
  };
  
  const handleCTAClick = () => {
    setShowLeadForm(true);
  };
  
  const formatNum = (n: number | null | undefined) =>
    typeof n === 'number' && isFinite(n) ? n : undefined;

  const bRating = formatNum(businessRating);
  const bReviews = formatNum(businessReviews);
  const bRank = formatNum(currentRank);

  const nf = new Intl.NumberFormat('en-US');
  const fmtReviews = (n: number | null | undefined) => {
    const v = formatNum(n);
    return v !== undefined ? nf.format(v) : '—';
  };
  const fmtRating = (n: number | null | undefined) => {
    const v = formatNum(n);
    return v !== undefined ? v.toFixed(1) : '—';
  };

  return (
    <section id="competitor-analysis" className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {currentRank && currentRank <= 3 ? (
              <>Your <span className="text-green-500">Closest Competitors</span> in the Market</>
            ) : (
              <>The <span className="text-red-500">Top 10 Businesses</span> Dominating Your Market</>
            )}
          </h2>
          <p className="text-xl text-gray-400">
            {currentRank && currentRank <= 3 ? (
              "These businesses are competing for your market share"
            ) : (
              "These competitors capture the majority of all local searches"
            )}
          </p>
        </motion.div>
        
        {/* Top 3 Competitors - Large Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {competitors.slice(0, 3).map((competitor, index) => (
            <motion.div
              key={competitor.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`relative rounded-xl p-6 overflow-hidden flex flex-col min-h-[400px] ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50' 
                  : 'bg-gray-800/50 border border-gray-700'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
              )}
              
              {/* Header - stays at top */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold truncate pr-12">{competitor.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-300'
                }`}>
                  #{(competitor as any).display_rank ?? (index + 1)}
                </span>
              </div>
              
              {/* Spacer to push content to bottom */}
              <div className="flex-grow"></div>
              
              {/* Bottom-aligned content */}
              <div className="mt-auto">
                {/* Core Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Reviews</span>
                    </div>
                    <span className="text-lg font-bold text-white">{fmtReviews(competitor.reviews)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Rating</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-400">{fmtRating(competitor.rating)} ★</span>
                  </div>
                </div>
                
                {/* Location & Contact */}
                <div className="space-y-2 pt-3 border-t border-gray-700">
                  {(competitor as any).address && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{(competitor as any).address}</span>
                    </div>
                  )}
                  {competitor.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3 h-3 text-gray-400" />
                      <a href={`https://${competitor.website}`} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:underline truncate">
                        {competitor.website}
                      </a>
                    </div>
                  )}
                  {competitor.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Phone className="w-3 h-3" />
                      <span>{competitor.phone}</span>
                    </div>
                  )}
                </div>
                
                {/* View on Google */}
                <a 
                  href={(() => {
                    // Use coordinates if available, otherwise search by name
                    if ((competitor as any).latitude && (competitor as any).longitude) {
                      return `https://www.google.com/maps/search/?api=1&query=${(competitor as any).latitude},${(competitor as any).longitude}`;
                    }
                    return `https://www.google.com/maps/search/${encodeURIComponent(competitor.name)}`;
                  })()}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-3 h-3" />
                  View on Google Maps
                </a>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Additional Competitors 4-10 - Smaller Cards */}
        {competitors.length > 3 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-6">
              <span className="text-gray-400">Other Top Competitors</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {competitors.slice(3).map((competitor, index) => {
                const isTarget = (competitor as any).isTargetBusiness;
                const showSeparator = (competitor as any).showSeparator;
                const actualRank = (competitor as any).display_rank || (index + 4);
                
                return (
                  <React.Fragment key={`competitor-${index}-${competitor.name}`}>
                    {/* Show separator if business is outside top 10 */}
                    {showSeparator && (
                      <div className="col-span-full text-center py-4 my-2">
                        <div className="flex items-center justify-center gap-4">
                          <div className="h-px bg-gray-700 flex-1"></div>
                          <span className="text-gray-500 text-sm px-4">
                            ... {actualRank - 11} other businesses ...
                          </span>
                          <div className="h-px bg-gray-700 flex-1"></div>
                        </div>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className={`${
                        isTarget 
                          ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-2 border-red-500/50 ring-2 ring-red-500/20' 
                          : 'bg-gray-800/50 border border-gray-700'
                      } rounded-lg p-4`}
                    >
                      <div className="text-center">
                        <div className={`text-sm font-bold mb-1 ${isTarget ? 'text-red-400' : 'text-gray-300'}`}>
                          #{actualRank}
                        </div>
                        <div className={`text-sm font-semibold truncate mb-2 ${isTarget ? 'text-red-200' : 'text-white'}`}>
                          {competitor.name}
                          {isTarget && <span className="block text-xs text-red-400 mt-1">(Your Business)</span>}
                        </div>
                        <div className="text-xs text-yellow-400 mb-1">★ {fmtRating(competitor.rating)}</div>
                        <div className="text-xs text-gray-400">{fmtReviews(competitor.reviews)} reviews</div>
                        {(competitor as any).address && (
                          <div className="text-xs text-gray-500 mt-2 truncate" title={(competitor as any).address}>
                            📍 {((competitor as any).address || '').split(',')[0]}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Ranking Factors - Card Grid */}
      <div className="mt-16">
        <KeyFactors businessName={businessName} businessWebsite={businessWebsite} city={city} state={state} />
      </div>
      
      {/* Visibility Gap Calculator Section */}
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Your <span className="text-purple-500">Visibility Gap</span>
            </h3>
            <p className="text-lg text-gray-400 mb-6">
              {currentRank && currentRank <= 3 ? (
                "See how much more traffic position #1 would bring you"
              ) : currentRank && currentRank <= 10 ? (
                "Calculate your opportunity from reaching the top 3 positions"
              ) : (
                "Discover what you're missing by not ranking in the top positions"
              )}
            </p>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold transition-all transform hover:scale-105 text-white shadow-lg"
            >
              <Calculator className="w-6 h-6" />
              <span className="text-lg">{showCalculator ? 'Hide Calculator' : 'Calculate My Opportunity'}</span>
              <TrendingUp className="w-6 h-6" />
            </button>
          </div>
          
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-12"
            >
              <LostRevenueCalculator currentRank={bRank || 7} />
            </motion.div>
          )}
          
          {/* CTA After Calculator */}
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mt-8"
            >
              <p className="text-lg text-gray-400 mb-4">
                Ready to capture those missing customers?
              </p>
              <button
                onClick={handleCTAClick}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold transition-all transform hover:scale-105 text-white shadow-lg text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <Zap className="w-6 h-6" />
                Get My Visibility Improvement Plan
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        businessName={businessName}
        businessWebsite={businessWebsite}
      />
    </section>
  );
}