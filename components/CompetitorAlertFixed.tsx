'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Users } from 'lucide-react';

interface CompetitorAlertProps {
  className?: string;
  currentRank?: number;
  competitorGains?: number;
}

export default function CompetitorAlertFixed({ 
  className = '', 
  currentRank,
  competitorGains = 3 
}: CompetitorAlertProps) {
  return (
    <section className={`py-16 px-6 bg-gradient-to-b from-black via-red-950/10 to-black ${className}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-red-500">ALERT:</span> Your Competitors Are{' '}
            <span className="text-red-500">Moving Fast</span>
          </h2>
          <p className="text-xl text-gray-400">
            {currentRank === 3 
              ? `The businesses above you gained ${competitorGains} new reviews this week`
              : 'Real-time competitor movement in your market'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Dashboard Visual */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-500/20">
                <TrendingUp className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">2 Passed You</p>
                <p className="text-sm text-gray-400">This Month</p>
              </div>
              <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-400">220 Leads</p>
                <p className="text-sm text-gray-400">Lost to Top 2</p>
              </div>
              <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                <AlertCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-400">$2,100</p>
                <p className="text-sm text-gray-400">Monthly Loss</p>
              </div>
            </div>

            {/* Competitor Activity Feed */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Competitor Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-gray-300">Competitor #1 got 5 new 5★ reviews</span>
                  </div>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-gray-300">Competitor #2 updated 15 photos</span>
                  </div>
                  <span className="text-xs text-gray-500">3 days ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-gray-300">You haven't posted in 45 days</span>
                  </div>
                  <span className="text-xs text-red-400">Action needed</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <button 
            onClick={() => {
              const section = document.querySelector('#solution-section');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 animate-pulse" />
            Stop Losing Ground - See The Fix
          </button>
        </motion.div>
      </div>
    </section>
  );
}