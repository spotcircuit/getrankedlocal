'use client';

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
              <>The <span className="text-red-500">Top 3 Businesses</span> Stealing Your Customers</>
            )}
          </h2>
          <p className="text-xl text-gray-400">
            {currentRank && currentRank <= 3 ? (
              "These businesses are competing for your market share"
            ) : (
              "These competitors dominate Google and capture 73% of all searches"
            )}
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {competitors.map((competitor, index) => (
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
                  {competitor.city && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{competitor.city}, {(competitor as any).state || 'TX'}</span>
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
                  href={`https://www.google.com/maps/search/${encodeURIComponent(competitor.name + ' ' + (competitor.city || ''))}`}
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
      </div>
      
      {/* Ranking Factors - Card Grid */}
      <div className="mt-16">
        <KeyFactors businessName={businessName} businessWebsite={businessWebsite} city={city} state={state} />
      </div>
      
      {/* Lost Revenue Calculator Section */}
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
              Calculate Your <span className="text-red-500">Lost Revenue</span>
            </h3>
            <p className="text-lg text-gray-400 mb-6">
              See exactly how much these ranking gaps are costing you every month
            </p>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold transition-all transform hover:scale-105 text-white shadow-lg"
            >
              <Calculator className="w-6 h-6" />
              <span className="text-lg">{showCalculator ? 'Hide Calculator' : 'Calculate Your Loss'}</span>
              <DollarSign className="w-6 h-6" />
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
              <LostRevenueCalculator />
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
                Ready to stop losing revenue to competitors?
              </p>
              <button
                onClick={handleCTAClick}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold transition-all transform hover:scale-105 text-white shadow-lg text-lg"
              >
                <Zap className="w-6 h-6" />
                Get My Custom Fix Priority Plan
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