'use client';

import { motion } from 'framer-motion';
import { Zap, TrendingUp, Target, CheckCircle, ArrowRight, Clock, Shield, Trophy } from 'lucide-react';
import { useState } from 'react';

interface QuickSolutionPreviewProps {
  businessName: string;
  currentRank?: number | null;
  niche?: string;
  city?: string;
  reviewDeficit?: number;
}

export default function QuickSolutionPreview({ 
  businessName, 
  currentRank = 7,
  niche = 'your industry',
  city = 'your city',
  reviewDeficit = 0
}: QuickSolutionPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRankMessage = () => {
    if (!currentRank) return { time: '90 days', goal: 'top rankings' };
    if (currentRank === 1) return { time: '30 days', goal: 'unbeatable dominance' };
    if (currentRank <= 3) return { time: '30-45 days', goal: '#1 position' };
    if (currentRank <= 10) return { time: '60 days', goal: 'top 3 positions' };
    return { time: '90 days', goal: '#1 ranking' };
  };

  const { time, goal } = getRankMessage();

  const quickWins = [
    { icon: Zap, text: 'Instant visibility boost', color: 'text-yellow-400' },
    { icon: TrendingUp, text: `${currentRank && currentRank > 3 ? '3-5x' : '2x'} more leads`, color: 'text-green-400' },
    { icon: Shield, text: 'Protect from competitors', color: 'text-blue-400' },
    { icon: Trophy, text: `Achieve ${goal}`, color: 'text-purple-400' }
  ];

  const steps = [
    {
      phase: 'Week 1',
      title: 'Instant Optimization',
      tasks: ['AI-powered profile audit', 'Quick-win improvements', 'Competitor weakness analysis'],
      impact: '+15% visibility'
    },
    {
      phase: 'Week 2-4',
      title: reviewDeficit > 50 ? 'Review Acceleration' : 'Accelerated Growth',
      tasks: [
        reviewDeficit > 50 ? `Close ${reviewDeficit} review gap` : 'Review velocity campaign',
        'Content optimization', 
        'Local SEO enhancement'
      ],
      impact: reviewDeficit > 50 ? `+${Math.min(reviewDeficit, 50)} reviews` : '+40% traffic'
    },
    {
      phase: 'Month 2-3',
      title: 'Market Domination',
      tasks: ['AI visibility optimization', 'Authority building', 'Conversion maximization'],
      impact: `Reach ${goal}`
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">Good News: We Have Your Solution Ready</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Here's How We'll Get You to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              {goal} in {time}
            </span>
          </h2>
          
          <p className="text-lg text-gray-400">
            {currentRank === 1 
              ? "Maintain your #1 position and expand your dominance"
              : currentRank && currentRank <= 3 
              ? "You're so close - here's the exact path to #1"
              : "A proven system that's worked for 500+ businesses like yours"}
          </p>
          
          {reviewDeficit > 20 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full mt-4">
              <span className="text-sm font-semibold text-yellow-400">
                📊 Priority: Close your {reviewDeficit} review gap to match top competitors
              </span>
            </div>
          )}
        </motion.div>

        {/* Quick Wins Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {quickWins.map((win, idx) => (
            <div
              key={idx}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800/70 transition-colors"
            >
              <win.icon className={`w-8 h-8 ${win.color} mx-auto mb-2`} />
              <p className="text-sm font-semibold text-white">{win.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Expandable Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700 rounded-xl p-6"
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">
                Your {time} Transformation Timeline
              </h3>
            </div>
            <ArrowRight 
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </div>

          {/* Preview - Always Visible */}
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`${!isExpanded && idx > 0 ? 'hidden md:block' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${idx === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      idx === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{step.phase}</p>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="ml-10 space-y-1 mb-2">
                    {step.tasks.map((task, tidx) => (
                      <p key={tidx} className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {task}
                      </p>
                    ))}
                  </div>
                )}
                
                <div className="ml-10">
                  <span className={`text-sm font-bold ${
                    idx === 0 ? 'text-green-400' : 
                    idx === 1 ? 'text-yellow-400' : 'text-purple-400'
                  }`}>
                    {step.impact}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {!isExpanded && (
            <p className="text-center mt-4 text-sm text-gray-400">
              Click to see detailed timeline →
            </p>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <button
            onClick={() => {
              const section = document.querySelector('#solution-section');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 text-white"
          >
            <Target className="w-5 h-5" />
            See Full Solution Details
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}