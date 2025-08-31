'use client';

import { motion } from 'framer-motion';
import { TrendingDown, DollarSign, AlertTriangle, Users, Bot, Search, ChevronRight } from 'lucide-react';
import { PainPoint } from '@/types';

interface ProblemSectionProps {
  painPoints: PainPoint[];
  lostRevenue: number;
  reviewDeficit?: number;
  currentRank?: number;
}

export default function ProblemSection({ painPoints, lostRevenue, reviewDeficit, currentRank }: ProblemSectionProps) {
  return (
    <section className="py-12 px-4 sm:px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            {currentRank === 3 ? (
              <>Why <span className="text-red-500">#1 and #2</span> Get Your Customers</>
            ) : (
              <>The <span className="text-red-500">Two Threats</span> Killing Your Business</>
            )}
          </h2>
          <p className="text-lg sm:text-xl text-gray-400">
            {currentRank === 3 
              ? "Here's what they have that you don't (yet)"
              : "While you're reading this, customers are finding your competitors instead"}
          </p>
        </motion.div>

        {/* Two Main Threats Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Threat 1: AI Invisibility */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 border border-purple-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-purple-400" />
              <h3 className="text-xl font-bold">Invisible to AI Search</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-300">60% of searches now happen on AI platforms:</p>
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full border border-purple-500/30">
                  <span className="text-purple-400 font-semibold">ChatGPT</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full border border-blue-500/30">
                  <span className="text-blue-400 font-semibold">Claude</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full border border-green-500/30">
                  <span className="text-green-400 font-semibold">Perplexity</span>
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                <p className="text-sm text-purple-300 font-semibold">They don't even know you exist</p>
              </div>
            </div>
          </motion.div>

          {/* Threat 2: Google Ranking */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-red-900/20 to-red-900/10 border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="w-8 h-8 text-red-400" />
              <h3 className="text-xl font-bold">Losing on Google</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-300">Critical deficits vs competitors:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Review deficit:</span>
                  <span className="text-red-400 font-bold">-{reviewDeficit || 150} reviews</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Keywords missing:</span>
                  <span className="text-red-400 font-bold">30% visibility</span>
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-red-500/20">
                <p className="text-sm text-red-300 font-semibold">Most customers never see you</p>
              </div>
            </div>
          </motion.div>
        </div>


        {/* Revenue Impact - Condensed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold mb-1">Revenue Lost to Competitors</h3>
              <div className="text-3xl sm:text-4xl font-bold text-red-400">
                ${lostRevenue.toLocaleString()}/year
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg sm:text-xl font-bold text-gray-300">18</div>
                <div className="text-xs text-gray-500">Daily Loss</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-gray-300">$350</div>
                <div className="text-xs text-gray-500">Per Customer</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-gray-300">6.5k</div>
                <div className="text-xs text-gray-500">Yearly Loss</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success Proof - Mini Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500 rounded-r-lg p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {currentRank === 3 ? 'Recent Success:' : 'The Fix Clinic:'}
                </span>
                <span className="text-lg font-bold text-red-400">
                  {currentRank === 3 ? '#3' : '#7'}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <span className="text-lg font-bold text-green-400">#1</span>
                <span className="text-xs text-gray-500">
                  {currentRank === 3 ? 'in 47 days' : 'in 73 days'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              <span className="text-green-400">
                {currentRank === 3 ? '+150% calls' : '+312% calls'}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-green-400">-85% cost</span>
              <span className="text-gray-500">•</span>
              <span className="text-green-400">High ROI potential</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}