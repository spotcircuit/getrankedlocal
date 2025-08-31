'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap, Star, Shield, TrendingUp, Award, ArrowRight, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';

interface PricingSectionProps {
  businessName?: string;
  businessData?: any;
  businessWebsite?: string;
}

export default function PricingSection({ businessName = '', businessData, businessWebsite = '' }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasSeenPricing, setHasSeenPricing] = useState(false);
  
  // Check if user has already submitted form
  useEffect(() => {
    const leadData = localStorage.getItem('leadCaptured');
    if (leadData) {
      setHasSeenPricing(true);
    }
  }, []);
  
  const handleLeadSubmit = (data: LeadData) => {
    setHasSeenPricing(true);
    setShowLeadForm(false);
  };
  
  const handlePricingClick = () => {
    setShowLeadForm(true);
  };

  const plans = [
    {
      name: 'Starter',
      tagline: 'Get Found Online',
      color: 'from-gray-600 to-gray-700',
      border: 'border-gray-500',
      popular: false,
      results: 'Best for single-location clinics needing fast Map Pack wins',
      highlights: [
        'GBP overhaul + 50 citations',
        'HIPAA-safe review engine (10+/month)',
        'Core site SEO + 2 Google Posts/mo'
      ],
      features: [
        { text: 'Google Business Profile Optimization', included: true },
        { text: 'Review Generation System (10+/month, HIPAA-safe)', included: true },
        { text: 'Local Citation Building (50+ NAP-clean)', included: true },
        { text: 'Monthly Google Posts (2x)', included: true },
        { text: 'Basic Website SEO', included: true },
        { text: 'Competitor Monitoring', included: true },
        { text: 'Basic AI Enhancements', included: true },
        { text: 'Monthly Report', included: true },
        { text: 'Advanced AI & ChatGPT Package', included: false },
        { text: 'Weekly Content & Strategy Calls', included: false }
      ],
      cta: 'Start Ranking',
      guarantee: '30-Day Results Promise*'
    },
    {
      name: 'Dominator',
      tagline: 'Own Your Market',
      color: 'from-purple-600 to-blue-600',
      border: 'border-purple-400',
      popular: true,
      results: 'Best for clinics targeting Top 3 in 60 days and booking pipeline growth',
      highlights: [
        'Advanced reviews (30+/month) + reputation defense',
        'Full website overhaul + weekly content/blogs',
        'AI & ChatGPT visibility package (structured FAQs, entities, GBP/Schema)'
      ],
      features: [
        { text: 'Everything in Starter', included: true },
        { text: 'Advanced Review Campaign (30+/month)', included: true },
        { text: 'AI & ChatGPT Optimization (FAQs, entities, Schema)', included: true },
        { text: 'Full Website Overhaul', included: true },
        { text: 'Weekly Content & Blogs', included: true },
        { text: 'Before/After Gallery Management', included: true },
        { text: 'Reputation Defense System', included: true },
        { text: 'Social Scheduling', included: true },
        { text: 'Weekly Strategy Calls', included: true },
        { text: 'Priority Support', included: true }
      ],
      cta: 'Dominate Now',
      guarantee: '60-Day Performance Guarantee*'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Investment That <span className="text-green-400">Pays for Itself</span>
          </h2>
          <p className="text-xl text-gray-400 mb-2">
            Average ROI: 1,247% in first year
          </p>
          <p className="text-lg text-gray-500">
            One new customer covers your monthly investment
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-gradient-to-b ${plan.color} bg-opacity-10 border-2 ${plan.border} rounded-2xl p-8 ${
                  plan.popular ? 'scale-105 shadow-2xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.tagline}</p>
                  
                  <p className="text-xs text-gray-400 mb-4">{plan.results}</p>

                  {/* Key Highlights */}
                  {plan.highlights && (
                    <div className="bg-black/30 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-gray-300 mb-2">3 Highlights:</p>
                      <div className="space-y-1">
                        {plan.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-300 text-left">{highlight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handlePricingClick}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-sm text-gray-300 mt-4 font-semibold">
                  {plan.guarantee}
                </p>
              </motion.div>
          ))}
        </div>

        {/* Value Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-8 mb-12"
        >
          <h3 className="text-2xl font-bold text-center mb-6">
            Compare to Traditional Marketing Costs
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">$5,000+</p>
              <p className="text-sm text-gray-300 font-semibold">Google Ads (Monthly)</p>
              <p className="text-sm text-gray-400 mt-2">No lasting rankings, stops when you stop paying</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">$3,000+</p>
              <p className="text-sm text-gray-300 font-semibold">Social Media Agency</p>
              <p className="text-sm text-gray-400 mt-2">Likes don't equal customers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">Results-Based</p>
              <p className="text-sm text-gray-300 font-semibold">GetRankedLocal</p>
              <p className="text-sm text-green-400 mt-2">Lasting organic growth + results-based guarantee*</p>
            </div>
          </div>
        </motion.div>

        {/* Success Metrics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold mb-8">
            What Success Looks Like
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Week 1</p>
              <p className="text-sm text-gray-300">Visible on Maps</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Month 1</p>
              <p className="text-sm text-gray-300">50+ New Reviews</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Month 2</p>
              <p className="text-sm text-gray-300">Top 3 Rankings</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Month 3</p>
              <p className="text-sm text-gray-300">#1 Locked In</p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-lg text-gray-400 mb-4">
              Join 500+ medical spas dominating their local markets
            </p>
            <button 
              onClick={handlePricingClick}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        businessName={businessName}
        businessWebsite={businessWebsite}
      />
    </section>
  );
}