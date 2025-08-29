'use client';

import { motion } from 'framer-motion';
import { TrendingDown, AlertCircle, Search } from 'lucide-react';
import type { CompetitorItem as Competitor } from '@/types';

interface HeroSectionProps {
  businessName: string;
  currentRank?: number;
  potentialTraffic: string;
  competitors?: Competitor[];
  niche?: string;
  city?: string;
}

export default function HeroSection({ businessName, currentRank, potentialTraffic, competitors, niche, city }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background with hero image */}
      <div className="absolute inset-0">
        <img 
          src="/images/herobackground.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            URGENT: Your Ranking is Costing You Customers
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          {businessName} is{' '}
          <span className="text-red-500">Losing {potentialTraffic}</span> of
          Potential Customers
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 mb-8"
        >
          You're currently ranked <span className="text-red-400 font-bold">#{typeof currentRank === 'number' ? currentRank : '—'}</span>
          {niche ? <> for <span className="font-semibold">{niche}</span></> : null}
          {city ? <> in <span className="font-semibold">{city}</span></> : null}
          <br />
          while your competitors dominate the Top 3
        </motion.p>
        {Array.isArray(competitors) && competitors.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-base md:text-lg text-gray-400 mb-8"
          >
            {(() => {
              const top = competitors
                .filter(c => c?.name && c.name !== businessName)
                .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
                .slice(0, 3);
              return top
                .map((c, i) => `#${c.rank ?? i + 1} ${c.name}`)
                .join(', ');
            })()}
          </motion.p>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col md:flex-row gap-6 justify-center items-center mb-12"
        >
          <div className="flex items-center gap-3 text-gray-400">
            <Search className="w-5 h-5" />
            <span>93% of customers never go past the top 3 results</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <TrendingDown className="w-5 h-5" />
            <span>60% now search on AI platforms (ChatGPT, Claude)</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="space-y-4"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform">
            See Why You're Not Ranking #1
          </button>
          <p className="text-sm text-gray-400">
            Free competitive analysis • No credit card required
          </p>
        </motion.div>
        
        {/* Floating competitor badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute top-20 left-10 hidden lg:block"
        >
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 backdrop-blur">
            <span className="text-green-400 text-sm">Competitor #1: 250 reviews</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-20 right-10 hidden lg:block"
        >
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 backdrop-blur">
            <span className="text-yellow-400 text-sm">You: Only {typeof currentRank === 'number' ? (currentRank > 3 ? 'page 2' : `#${currentRank}`) : '—'}</span>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}