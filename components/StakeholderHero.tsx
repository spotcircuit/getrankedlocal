'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { TrendingDown, AlertCircle, DollarSign, Users, ArrowRight, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';

interface StakeholderHeroProps {
  businessName: string;
  currentRank?: number;
  topCompetitors?: any[];
  monthlyLoss?: number;
  city?: string;
  state?: string;
  niche?: string;
  businessWebsite?: string;
}

export default function StakeholderHero({ 
  businessName, 
  currentRank = 7, 
  topCompetitors = [], 
  monthlyLoss = 15000,
  city,
  state,
  niche = 'your industry',
  businessWebsite = ''
}: StakeholderHeroProps) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  
  const handleLeadSubmit = (data: LeadData) => {
    setShowLeadForm(false);
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-lg z-50';
    successMessage.textContent = 'Thank you! We\'ll contact you within 24 hours with your competitive analysis.';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 5000);
  };

  // Calculate potential customer loss based on rank
  const calculateMonthlyCustomerLoss = () => {
    if (currentRank <= 3) return 0;
    if (currentRank <= 5) return 10;
    if (currentRank <= 10) return 25;
    return 40;
  };

  const customersLost = calculateMonthlyCustomerLoss();
  const topCompetitor = topCompetitors[0];

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-purple-900/10 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Personalized Alert */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-900/30 border-2 border-red-500/50 rounded-full">
            <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-lg font-semibold text-red-300">
              Urgent: {topCompetitor?.name || 'Your competitor'} is stealing your customers
            </span>
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold mb-6"
        >
          <span className="text-white">Hey {businessName},</span>
          <br />
          <span className="text-5xl md:text-7xl">
            You're Losing{' '}
            <span className="text-red-500">${monthlyLoss.toLocaleString()}/month</span>
          </span>
          <br />
          <span className="text-3xl md:text-4xl text-gray-300">
            to competitors in {city}{state ? `, ${state}` : ''}
          </span>
        </motion.h1>

        {/* Quick Action CTA - Early in the flow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowLeadForm(true)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center gap-2 animate-pulse text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <TrendingUp className="w-5 h-5" />
            Stop The Bleeding - Get Free Analysis Now
          </button>
        </motion.div>

        {/* Visual Problem Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="my-12 max-w-3xl mx-auto"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h3 className="text-xl font-semibold text-gray-300 mb-6">
              Here's What's Happening Right Now:
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Current Rank */}
              <div className="text-center">
                <div className="text-5xl font-bold text-red-500 mb-2">#{currentRank}</div>
                <p className="text-gray-400">Your Current Rank</p>
                <p className="text-sm text-red-400 mt-1">Invisible to 85% of searchers</p>
              </div>

              {/* Customers Lost */}
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-500 mb-2">{customersLost}</div>
                <p className="text-gray-400">New Customers/Month Lost</p>
                <p className="text-sm text-yellow-400 mt-1">Going to top 3 competitors</p>
              </div>

              {/* Review Gap */}
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-500 mb-2">
                  {topCompetitor?.reviews ? Math.max(0, topCompetitor.reviews - 50) : 150}
                </div>
                <p className="text-gray-400">Review Deficit</p>
                <p className="text-sm text-purple-400 mt-1">vs. #{topCompetitor?.rank || 1} competitor</p>
              </div>
            </div>

            {/* Competitor Comparison */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-lg text-gray-300 mb-4">
                <span className="font-semibold text-white">The harsh truth:</span> 93% of people choose from the top 3 Google results
              </p>
              
              <div className="space-y-3">
                {topCompetitors.slice(0, 3).map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${idx === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{comp.name}</p>
                        <p className="text-sm text-gray-400">
                          ⭐ {comp.rating} ({comp.reviews} reviews)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">+{30 - idx * 10} customers/mo</p>
                      <p className="text-xs text-gray-500">from Google</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* CTA inside the comparison box */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  See How to Outrank Them →
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                const section = document.querySelector('#solution-section');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              See How to Fix This
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowLeadForm(true)}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Get My Free Analysis</span>
            </button>
          </div>

          <p className="text-gray-400">
            <span className="text-yellow-400 font-semibold">⚠️ Warning:</span> Your competitors gained an average of 12 reviews last month
          </p>
        </motion.div>
      </div>
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        title="Get Your Free Competitive Analysis"
        subtitle={`See how ${businessName} can dominate ${city || 'your market'}`}
        businessName={businessName}
        businessWebsite={businessWebsite}
      />
    </section>
  );
}