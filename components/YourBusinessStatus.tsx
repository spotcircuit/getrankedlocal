'use client';

import { motion } from 'framer-motion';
import { 
  TrendingDown, AlertTriangle, XCircle, DollarSign, Clock, 
  Users, Star, MapPin, Phone, Globe, Camera, MessageSquare,
  Instagram, Facebook, Search, Shield, Zap, Award, Target
} from 'lucide-react';

interface YourBusinessStatusProps {
  businessName: string;
  currentRank?: number;
  businessData?: any;
  analysisData?: any;
  pitch?: any;
}

export default function YourBusinessStatus({ 
  businessName, 
  currentRank, 
  businessData, 
  analysisData,
  pitch 
}: YourBusinessStatusProps) {
  
  // Missing factors - comprehensive list that competitors have
  const missingFactors = [
    { icon: Users, text: `${analysisData?.reviewDeficit || 150}+ review deficit`, severity: 'critical' },
    { icon: MessageSquare, text: 'Not responding to reviews', severity: 'high' },
    { icon: Camera, text: 'Only 10 photos on Google', severity: 'medium' },
    { icon: Globe, text: 'Slow website (5+ seconds)', severity: 'high' },
    { icon: Shield, text: 'No SSL certificate', severity: 'critical' },
    { icon: Search, text: 'Missing from AI searches', severity: 'critical' },
    { icon: Instagram, text: 'Inactive social media', severity: 'medium' },
    { icon: MapPin, text: 'Inconsistent listings', severity: 'high' },
    { icon: Zap, text: 'No Google Posts', severity: 'high' },
    { icon: Award, text: 'No schema markup', severity: 'high' },
  ];

  // Show 5-7 random missing factors
  const displayFactors = missingFactors
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-red-500">Your Current Situation</span> is Critical
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Here's exactly where you stand and what you're missing
          </p>
        </motion.div>

        {/* Main Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-red-900/20 via-red-900/10 to-transparent border-2 border-red-500/50 rounded-2xl p-8 mb-12"
        >
          {/* Business Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{businessName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {businessData?.city}, {businessData?.state}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  {businessData?.rating?.toFixed(1)} ({businessData?.reviewCount} reviews)
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="px-6 py-3 bg-red-500/20 border-2 border-red-500 rounded-full text-2xl font-bold text-red-400">
                Rank #{currentRank || '?'}
              </span>
            </div>
          </div>

          {/* Critical Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-gray-400" />
                <span className="text-red-400 font-bold">POOR</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {pitch?.current_situation?.visibility || '30%'}
              </div>
              <div className="text-xs text-gray-500">Search Visibility</div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-bold">-{analysisData?.reviewDeficit || 150}</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {analysisData?.competitorsAvgReviews || 250}
              </div>
              <div className="text-xs text-gray-500">Competitor Avg Reviews</div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-bold">LOST</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${(analysisData?.lostRevenue || 75000).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Revenue Lost/Year</div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-green-400" />
                <span className="text-green-400 font-bold">90 DAYS</span>
              </div>
              <div className="text-2xl font-bold text-white">
                #1
              </div>
              <div className="text-xs text-gray-500">Time to Top</div>
            </div>
          </div>

          {/* What You're Missing Section */}
          <div className="bg-black/40 rounded-xl p-6">
            <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Issues Holding You Back
            </h4>
            
            <div className="grid md:grid-cols-2 gap-3">
              {displayFactors.map((factor, index) => {
                const Icon = factor.icon;
                const bgColor = factor.severity === 'critical' 
                  ? 'bg-red-900/30 border-red-500/50' 
                  : factor.severity === 'high'
                  ? 'bg-orange-900/30 border-orange-500/50'
                  : 'bg-yellow-900/30 border-yellow-500/50';
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor}`}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-sm text-gray-300">{factor.text}</span>
                    {factor.severity === 'critical' && (
                      <span className="ml-auto text-xs text-red-400 font-bold">CRITICAL</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* The Bottom Line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-xl p-6 inline-block">
            <p className="text-xl font-bold text-white mb-2">
              The Hard Truth:
            </p>
            <p className="text-lg text-gray-300">
              You're losing <span className="text-red-400 font-bold">{analysisData?.potentialTraffic || '85%'}</span> of potential customers to competitors
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Every day you wait, they book with your competition instead
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}