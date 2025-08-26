'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Zap, Brain, Search, TrendingUp, Shield } from 'lucide-react';

interface SolutionSectionProps {
  solutions: string[];
  timeline: string;
}

export default function SolutionSection({ solutions, timeline }: SolutionSectionProps) {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full text-green-400 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            THE SOLUTION
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Introducing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">SEO 2.0</span>
          </h2>
          <p className="text-xl text-gray-300">
            The AI-First Approach to Dominating Search
          </p>
        </motion.div>

        {/* SEO Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <img 
            src="/images/seodashboard.png" 
            alt="SEO Performance Dashboard" 
            className="w-full max-w-4xl mx-auto rounded-xl border border-gray-800 shadow-2xl"
          />
          <p className="text-center text-gray-400 mt-4">
            Real-time tracking of your climb to #1
          </p>
        </motion.div>

        {/* Core Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6"
          >
            <Brain className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">AI Search Optimization</h3>
            <p className="text-gray-400 mb-4">
              Get featured in ChatGPT, Claude, and Perplexity responses
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Structured data markup</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>FAQ schema implementation</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>How-to content optimization</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6"
          >
            <Search className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Google Domination</h3>
            <p className="text-gray-400 mb-4">
              Claim your spot in the local 3-pack
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Review generation system</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>GMB optimization</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Local content strategy</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-8"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">Your Path to #1</h3>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                <div className="w-1/2 text-right pr-8">
                  <h4 className="font-bold">Week 1-2: Foundation</h4>
                  <p className="text-sm text-gray-400">Complete audit & optimization</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div className="w-1/2 pl-8"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                <div className="w-1/2"></div>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div className="w-1/2 pl-8">
                  <h4 className="font-bold">Week 3-4: Implementation</h4>
                  <p className="text-sm text-gray-400">AI optimization & content</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                <div className="w-1/2 text-right pr-8">
                  <h4 className="font-bold">Week 5-8: Growth</h4>
                  <p className="text-sm text-gray-400">Authority building & reviews</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div className="w-1/2 pl-8"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                <div className="w-1/2"></div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="w-1/2 pl-8">
                  <h4 className="font-bold text-green-400">Day 90: Ranking #1</h4>
                  <p className="text-sm text-gray-400">Dominating search results</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* What's Included */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <h3 className="text-2xl font-bold mb-6">Everything You Need to Win</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Competitive Analysis',
              'AI Optimization',
              'Content Strategy',
              'Review Management',
              'Technical SEO',
              'Local Citations',
              'Monthly Reporting',
              '24/7 Dashboard'
            ].map((item, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}