'use client';

import { motion } from 'framer-motion';
import { 
  Rocket, Camera, MessageSquare, Star, Globe, 
  TrendingUp, Users, CheckCircle, Clock, Zap,
  Instagram, Search, Award, MapPin, Shield, Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';
import { getConsistentRevenueData } from '@/lib/revenueCalculations';

interface ActionPlanProps {
  timeline?: string;
  solutions?: string[];
  actionPlan?: any[];
  businessName?: string;
  businessWebsite?: string;
  currentRank?: number;
}

export default function ActionPlan({ timeline, solutions, actionPlan, businessName = '', businessWebsite = '', currentRank = 9 }: ActionPlanProps) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasSubmittedForm, setHasSubmittedForm] = useState(false);
  
  useEffect(() => {
    const leadData = localStorage.getItem('leadCaptured');
    if (leadData) {
      setHasSubmittedForm(true);
    }
  }, []);
  
  const handleLeadSubmit = (data: LeadData) => {
    setHasSubmittedForm(true);
    setShowLeadForm(false);
  };
  
  const handleCTAClick = () => {
    setShowLeadForm(true);
  };
  
  // Icon mapping for different action types
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('review')) return Star;
    if (actionLower.includes('photo') || actionLower.includes('image')) return Camera;
    if (actionLower.includes('google') && actionLower.includes('post')) return MessageSquare;
    if (actionLower.includes('website') || actionLower.includes('speed')) return Globe;
    if (actionLower.includes('social') || actionLower.includes('instagram')) return Instagram;
    if (actionLower.includes('seo') || actionLower.includes('search')) return Search;
    if (actionLower.includes('citation') || actionLower.includes('listing')) return MapPin;
    if (actionLower.includes('schema') || actionLower.includes('ai')) return Zap;
    if (actionLower.includes('secure') || actionLower.includes('ssl')) return Shield;
    return TrendingUp;
  };

  // Timeline phases tied to 23 ranking factors with revenue focus
  const phases = [
    {
      week: "Weeks 1-2",
      title: "Stop the Bleed",
      subtitle: "Show up where ready-to-book patients look first",
      icon: Rocket,
      color: "from-red-500/20 to-red-600/10",
      border: "border-red-500/50",
      impact: "+15 calls/week",
      factors: "Factors 1-4",
      actions: [
        { text: "Google Business Profile overhaul", metric: "Map Pack visibility" },
        { text: "Emergency review sprint", metric: "10+ fast, HIPAA-safe" },
        { text: "Fresh treatment photos & verticals", metric: "+2× profile clicks" },
        { text: "Claim/clean top directories", metric: "Block competitor hijacking" }
      ]
    },
    {
      week: "Weeks 3-4",
      title: "Convert Browsers to Bookers",
      subtitle: "Turn traffic into appointments—especially mobile",
      icon: Users,
      color: "from-blue-500/20 to-blue-600/10",
      border: "border-blue-500/50",
      impact: "+40% conversion lift",
      factors: "Factors 5-11",
      actions: [
        { text: "Provider bios, credentials & badges", metric: "Medical trust" },
        { text: "Site speed (mobile-first)", metric: "Fewer bounces" },
        { text: "Service pages (Botox, Filler, PDO)", metric: "Keyword capture" },
        { text: "1-click online booking", metric: "24/7 appointment capture" }
      ]
    },
    {
      week: "Weeks 5-8",
      title: "Own 'Med Spa Near Me'",
      subtitle: "Be everywhere patients look—including AI results",
      icon: TrendingUp,
      color: "from-purple-500/20 to-purple-600/10",
      border: "border-purple-500/50",
      impact: "~70% of searches",
      factors: "Factors 12-20",
      actions: [
        { text: "50+ local citations", metric: "NAP-clean & consistent" },
        { text: "AI/ChatGPT visibility", metric: "Structured FAQs, entities, GBP" },
        { text: "Before/after galleries", metric: "High-intent social proof" },
        { text: "Weekly Google Posts & updates", metric: "Stay top-of-mind" }
      ]
    },
    {
      week: "Weeks 9-12",
      title: "Lock It In",
      subtitle: "Defend #1 and expand your footprint",
      icon: Award,
      color: "from-green-500/20 to-green-600/10",
      border: "border-green-500/50",
      impact: "#1 defended",
      factors: "Factors 21-23",
      actions: [
        { text: "Adjacent-city rollout", metric: "Multi-location playbook" },
        { text: "Video testimonials & clinic tour", metric: "Premium positioning" },
        { text: "Voice search optimization", metric: "Future-proof rankings" },
        { text: "Competitor monitoring", metric: "Stay 3 steps ahead" }
      ]
    }
  ];

  return (
    <section id="action-plan" className="py-16 px-4 sm:px-6 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Your <span className="text-green-400">90-Day Revenue Recovery</span> Plan
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-4">
            We fix the 23 ranking factors that decide who gets the patients in your city—so you stop leaking calls and start owning demand.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full">
              <span className="text-red-400 font-semibold">Currently losing: {getConsistentRevenueData(currentRank).formatted.monthly}/month</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full">
              <span className="text-green-400 font-semibold">Potential recovery: +{getConsistentRevenueData(currentRank).formatted.yearly}/year</span>
            </div>
            <div className="group relative inline-flex items-center gap-1 px-2 py-1">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="hidden group-hover:block absolute bottom-full mb-2 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-nowrap z-10">
                {getConsistentRevenueData(currentRank).explanation}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`bg-gradient-to-br ${phase.color} border ${phase.border} rounded-xl p-6 relative overflow-hidden`}
              >
                {/* Phase Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-400">{phase.week}</span>
                    <Icon className="w-6 h-6 text-white opacity-50" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{phase.title}</h3>
                  {phase.subtitle && (
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">{phase.subtitle}</p>
                  )}
                  {/* Impact and Factors badges */}
                  <div className="flex gap-2 mt-2">
                    {phase.impact && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {phase.impact}
                      </span>
                    )}
                    {phase.factors && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        {phase.factors}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {phase.actions.map((action: any, actionIndex: number) => (
                    <div key={actionIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-300 font-medium">{action.text}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{action.metric}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phase Number Background */}
                <div className="absolute -bottom-4 -right-4 text-7xl font-bold text-white/5">
                  {index + 1}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* What We Do For You */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold mb-2">White Glove Service for Medical Professionals</h3>
          <p className="text-yellow-400 font-semibold mb-4">
            Zero time required from your practice
          </p>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            We handle the technical work of improving your online presence while you focus on patient care. 
            Track your progress with weekly updates. Performance-based partnership.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-semibold">Build Reviews</p>
              <p className="text-[10px] text-gray-500">Ethically & consistently</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-semibold">Map Visibility</p>
              <p className="text-[10px] text-gray-500">Top positions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-semibold">AI Optimized</p>
              <p className="text-[10px] text-gray-500">Found on ChatGPT</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-semibold">Reputation</p>
              <p className="text-[10px] text-gray-500">Management</p>
            </div>
          </div>

          {/* Success metrics */}
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Average client results:</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-green-400">312%</p>
                <p className="text-xs text-gray-500">More calls</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">$47K</p>
                <p className="text-xs text-gray-500">Monthly gain</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">73 days</p>
                <p className="text-xs text-gray-500">To #1</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCTAClick}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:scale-105 transition-transform">
            Claim Your Market Now →
          </button>
        </motion.div>
      </div>
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        title="Claim Your Market Now"
        subtitle="Get your custom 90-day revenue recovery plan"
        businessName={businessName}
        businessWebsite={businessWebsite}
      />
    </section>
  );
}