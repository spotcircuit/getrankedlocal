'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Shield, Star, Trophy, TrendingUp, Users } from 'lucide-react';

export default function Header() {
  return (
    <header>
      {/* Announcement Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 py-3 px-4 text-center"
      >
        <p className="text-sm sm:text-base text-white flex items-center justify-center gap-2 font-medium">
          <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span>Limited Time:</span> 
          <span className="font-bold">Free Competitor Analysis + 90-Day Ranking Guarantee</span>
          <ArrowRight className="w-4 h-4" />
        </p>
      </motion.div>
      
      {/* Simple Dark Header with Text Logo */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Text-based Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  <span className="text-white">GetRanked</span>
                  <span className="text-green-400">Local</span>
                </span>
                <span className="text-green-400 text-2xl ml-1">.</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-700" />
              <p className="hidden md:block text-sm text-gray-400">
                Dominate Google & AI in 90 Days
              </p>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-gray-300">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs sm:text-sm font-medium">500+ #1 Rankings</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs sm:text-sm font-medium">3.2x ROI</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-gray-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs sm:text-sm font-medium">92% Retention</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}