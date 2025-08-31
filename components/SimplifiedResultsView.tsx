'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingDown, AlertCircle, DollarSign, Users, Star, 
  ChevronDown, ChevronUp, Eye, EyeOff, Zap, Target,
  ArrowRight, Phone, MessageSquare, BarChart3
} from 'lucide-react';

interface SimplifiedResultsViewProps {
  businessName: string;
  currentRank: number;
  topCompetitors: any[];
  reviewDeficit: number;
  monthlyLoss?: number;
  painPoints?: any[];
  marketIntel?: any;
  aiIntelligence?: any;
  city?: string;
  state?: string;
  niche?: string;
}

export default function SimplifiedResultsView({
  businessName,
  currentRank = 7,
  topCompetitors = [],
  reviewDeficit = 150,
  monthlyLoss = 15000,
  painPoints = [],
  marketIntel,
  aiIntelligence,
  city,
  state,
  niche = 'your industry'
}: SimplifiedResultsViewProps) {
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Calculate key metrics
  const isRankedWell = currentRank <= 3;
  const customersLost = currentRank <= 3 ? 0 : currentRank <= 5 ? 10 : currentRank <= 10 ? 25 : 40;
  const topCompetitor = topCompetitors[0];
  const rankGap = currentRank > 3 ? currentRank - 3 : 0;

  // ROI calculations
  const avgCustomerValue = niche === 'med spas' ? 1500 : niche === 'dental' ? 2000 : 500;
  const potentialRevenue = customersLost * avgCustomerValue;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex items-center gap-2 p-1 bg-gray-800 rounded-lg">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-4 py-2 rounded-md transition-all ${
              viewMode === 'simple'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Simple View
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-md transition-all ${
              viewMode === 'detailed'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Detailed View
          </button>
        </div>
      </div>

      {/* Simple View */}
      {viewMode === 'simple' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Alert Box */}
          <div className={`relative overflow-hidden rounded-2xl p-8 ${
            isRankedWell 
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/50'
              : 'bg-gradient-to-br from-red-900/30 to-orange-900/30 border-2 border-red-500/50'
          }`}>
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-6">
                {isRankedWell ? (
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {isRankedWell 
                      ? `Great job, ${businessName}! You're dominating.`
                      : `${businessName}, you need immediate attention.`}
                  </h2>
                  <p className="text-xl text-gray-300">
                    You're currently <span className={`font-bold ${isRankedWell ? 'text-green-400' : 'text-red-400'}`}>
                      #{currentRank}
                    </span> on Google Maps for "{niche}" in {city}, {state}
                  </p>
                </div>
              </div>

              {/* Key Impact Metrics */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-yellow-400" />
                    <p className="text-gray-400">Monthly Impact</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {customersLost > 0 ? `-${customersLost}` : '+15'} customers
                  </p>
                  <p className="text-sm text-gray-500">
                    {customersLost > 0 ? 'lost to competitors' : 'from top ranking'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <p className="text-gray-400">Revenue Impact</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {customersLost > 0 ? `-$${potentialRevenue.toLocaleString()}` : '+$22,500'}
                  </p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>

                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-purple-400" />
                    <p className="text-gray-400">Review Gap</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    -{reviewDeficit} reviews
                  </p>
                  <p className="text-sm text-gray-500">vs. top competitor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Competitor Comparison */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Who's Beating You & Why
            </h3>
            <div className="space-y-3">
              {topCompetitors.slice(0, 3).map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${idx === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{comp.name}</p>
                      <p className="text-sm text-gray-400">
                        ⭐ {comp.rating} • {comp.reviews || comp.review_count} reviews
                      </p>
                    </div>
                  </div>
                  {idx === 0 && (
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">+{30} customers/mo</p>
                      <p className="text-xs text-gray-500">they're getting</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Simple Action Plan */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4">
              Your 3-Step Plan to #1
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Fix Your Foundation (Week 1-4)</p>
                  <p className="text-sm text-gray-400">Optimize your Google Business Profile & get 50+ citations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Accelerate Reviews (Week 5-8)</p>
                  <p className="text-sm text-gray-400">Launch review campaign to add 30+ reviews/month</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Dominate & Scale (Week 9-12)</p>
                  <p className="text-sm text-gray-400">Lock in #1 position & expand to nearby areas</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-8 text-center border border-green-500/30">
            <h3 className="text-2xl font-bold text-white mb-3">
              Ready to {isRankedWell ? 'Stay' : 'Get'} at #1?
            </h3>
            <p className="text-gray-300 mb-6">
              {isRankedWell 
                ? "Let's make sure no one takes your spot"
                : `We can get you to the top 3 in 90 days or less`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Get Your Free Strategy Call
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-lg font-bold text-lg transition-all"
              >
                See Detailed Analysis
              </button>
            </div>
          </div>

          {/* Expandable Sections for Additional Data */}
          {painPoints && painPoints.length > 0 && (
            <div className="bg-gray-900/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('painpoints')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-semibold text-white">View Detailed Problems</span>
                {expandedSections.includes('painpoints') ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.includes('painpoints') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4"
                  >
                    <div className="space-y-3 pt-2">
                      {painPoints.map((point: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                            point.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                          }`} />
                          <div>
                            <p className="font-semibold text-white">{point.issue}</p>
                            <p className="text-sm text-gray-400">{point.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Detailed View - Shows Everything */}
      {viewMode === 'detailed' && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Detailed view will show all components including AI Intelligence, Market Intel, etc.
          </p>
          <button
            onClick={() => setViewMode('simple')}
            className="mt-4 text-purple-400 hover:text-purple-300"
          >
            ← Back to Simple View
          </button>
        </div>
      )}
    </div>
  );
}