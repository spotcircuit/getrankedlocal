'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle, TrendingUp, Star, Clock, Shield, ArrowRight, Zap } from 'lucide-react';

interface SimplifiedSolutionProps {
  businessName?: string;
  currentRank?: number;
  niche?: string;
}

export default function SimplifiedSolution({ 
  businessName = 'Your Business',
  currentRank = 7,
  niche = 'med spas'
}: SimplifiedSolutionProps) {
  
  const isIndustryRegulated = niche === 'med spas' || niche === 'dental' || niche === 'medical';
  
  return (
    <section id="solution-section" className="py-20 px-6 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Success Story Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-green-400 font-semibold mb-1">Similar Success Story:</p>
              <p className="text-white text-lg">
                "Auveau Aesthetics went from #{currentRank} to #1 in 67 days → 
                <span className="text-green-400 font-bold"> +47 new patients first month</span>"
              </p>
            </div>
            <div className="text-2xl font-bold text-green-400">
              ROI: 872%
            </div>
          </div>
        </motion.div>

        {/* Before/After Ranking Slider Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Image
            src="/before-after-ranking-slider.png"
            alt="See your transformation in 90 days"
            width={1400}
            height={800}
            priority
            className="rounded-xl shadow-2xl mx-auto w-full h-auto"
          />
        </motion.div>

        {/* Main Solution Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Path to <span className="text-green-400">#1 in 90 Days</span>
          </h2>
          <p className="text-xl text-gray-300">
            Proven system that's ranked 500+ {niche} at the top of Google Maps
          </p>
        </motion.div>

        {/* 3-Step Process */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3 mt-2">Days 1-30: Foundation</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Google Business Profile overhaul</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">50+ citation cleanup & creation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Review generation system launch</span>
                </li>
                {isIndustryRegulated && (
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">HIPAA-compliant processes</span>
                  </li>
                )}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-green-400 font-semibold">Expected: Jump 3-5 positions</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3 mt-2">Days 31-60: Acceleration</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">AI & ChatGPT optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Content velocity increase</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Competitor disruption tactics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">30+ reviews per month</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-yellow-400 font-semibold">Expected: Reach Top 5</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border-2 border-purple-500/50 h-full">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3 mt-2">Days 61-90: Domination</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Lock in #1 position</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Reputation fortress building</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Conversion optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Scale to nearby cities</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-purple-700">
                <p className="text-sm text-purple-400 font-semibold">Expected: Achieve #1-3</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Your Expected ROI at #1
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-green-400">+65%</p>
              <p className="text-gray-400">More Phone Calls</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-400">+23</p>
              <p className="text-gray-400">New Patients/Month</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">$42,000</p>
              <p className="text-gray-400">Additional Revenue/Month</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            *Based on average {niche} client results
          </p>
        </motion.div>

        {/* Guarantee Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-2 border-green-500/50 rounded-xl p-8 text-center"
        >
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">
            Our Iron-Clad Guarantee
          </h3>
          <p className="text-lg text-gray-300 mb-6">
            <span className="text-green-400 font-bold">Top 3 in 90 days or your money back.</span>
            <br />
            We're that confident in our system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                const section = document.querySelector('#pricing-section');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              See Investment Options
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-lg font-bold text-lg transition-all">
              Schedule Strategy Call
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}