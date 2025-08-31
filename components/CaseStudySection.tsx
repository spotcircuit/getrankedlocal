'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Users, DollarSign, Calendar, ArrowUp, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface CaseStudy {
  business: string;
  industry: string;
  location: string;
  beforeRank: number;
  afterRank: number;
  timeframe: string;
  reviewIncrease: number;
  newCustomers: number;
  revenueIncrease: string;
  testimonial: string;
  owner: string;
  image?: string;
}

const caseStudies: CaseStudy[] = [
  {
    business: "Auveau Aesthetics & Wellness",
    industry: "Med Spa",
    location: "West Lake Hills, TX",
    beforeRank: 8,
    afterRank: 1,
    timeframe: "67 days",
    reviewIncrease: 147,
    newCustomers: 47,
    revenueIncrease: "$84,600",
    testimonial: "We went from barely visible to completely dominating our market. The phone doesn't stop ringing now. Best investment we've ever made.",
    owner: "Dr. Sarah Mitchell",
    image: "/testimonials/auveau.jpg"
  },
  {
    business: "Elite Dental Studio",
    industry: "Dental Practice",
    location: "Austin, TX",
    beforeRank: 12,
    afterRank: 2,
    timeframe: "84 days",
    reviewIncrease: 92,
    newCustomers: 31,
    revenueIncrease: "$127,000",
    testimonial: "Our new customer flow increased by 300%. We had to hire two more hygienists to keep up with demand.",
    owner: "Dr. James Chen",
    image: "/testimonials/elite-dental.jpg"
  },
  {
    business: "Contours Body Sculpting",
    industry: "Body Contouring",
    location: "Houston, TX",
    beforeRank: 15,
    afterRank: 1,
    timeframe: "92 days",
    reviewIncrease: 203,
    newCustomers: 62,
    revenueIncrease: "$156,000",
    testimonial: "From invisible to #1 in 3 months. Our ROI was 872% in the first year. Absolutely game-changing.",
    owner: "Maria Rodriguez",
    image: "/testimonials/contours.jpg"
  }
];

export default function CaseStudySection() {
  const [selectedStudy, setSelectedStudy] = useState(0);
  const study = caseStudies[selectedStudy];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Real Results, Real Businesses
          </h2>
          <p className="text-xl text-gray-300">
            See how we've transformed local businesses into market leaders
          </p>
        </motion.div>

        {/* Case Study Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {caseStudies.map((cs, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStudy(idx)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedStudy === idx
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cs.business}
            </button>
          ))}
        </div>

        {/* Main Case Study Display */}
        <motion.div
          key={selectedStudy}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Story & Quote */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{study.business}</h3>
                  <p className="text-gray-400">{study.industry} • {study.location}</p>
                </div>
              </div>

              {/* Before/After Visual */}
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">Before</p>
                    <p className="text-4xl font-bold text-red-500">#{study.beforeRank}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="relative">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '100%' }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        />
                      </div>
                      <p className="text-center text-sm text-gray-400 mt-2">{study.timeframe}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">After</p>
                    <p className="text-4xl font-bold text-green-500">#{study.afterRank}</p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-6xl text-purple-500/20">"</div>
                <blockquote className="relative z-10 text-lg text-gray-300 italic mb-4 pl-6">
                  {study.testimonial}
                </blockquote>
                <p className="text-right text-gray-400">
                  — {study.owner}, Owner
                </p>
              </div>
            </div>

            {/* Right: Metrics */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6">The Results</h4>
              
              <div className="space-y-4">
                {/* New Customers */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">New Customers/Month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-400">+{study.newCustomers}</span>
                      <ArrowUp className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-300">Reviews Added</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-yellow-400">+{study.reviewIncrease}</span>
                      <ArrowUp className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Monthly Revenue Increase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-400">{study.revenueIncrease}</span>
                      <ArrowUp className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Timeframe */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Time to #1</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-400">{study.timeframe}</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
                <p className="text-white font-semibold mb-3">
                  Want results like {study.business.split(' ')[0]}?
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Get your free analysis and see exactly how to reach #1
                </p>
                <button 
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                  Get Your Free Analysis
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">500+</p>
            <p className="text-gray-400 text-sm">Businesses Ranked #1</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">87%</p>
            <p className="text-gray-400 text-sm">Reach Top 3 in 90 Days</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">4.9</p>
            <p className="text-gray-400 text-sm">Average Client Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">23x</p>
            <p className="text-gray-400 text-sm">Average ROI</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}