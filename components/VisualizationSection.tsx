'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface VisualizationSectionProps {
  setShowLeadForm: (show: boolean) => void;
}

export default function VisualizationSection({ setShowLeadForm }: VisualizationSectionProps) {
  return (
    <>
      {/* Visual Problem Representations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-2 gap-4 md:gap-8 my-8 md:my-12 max-w-5xl mx-auto px-4"
      >
        <div className="w-full">
          <h4 className="text-base md:text-lg font-semibold text-gray-300 mb-4 text-center">
            Where You Rank vs. Where The Money Is
          </h4>
          <div className="w-full">
            <Image
              src="/ranking-ladder-visualization.webp"
              alt="Your ranking position"
              width={640}
              height={640}
              className="rounded-xl shadow-2xl w-full h-auto object-contain max-w-full"
            />
          </div>
          {/* CTA below image */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowLeadForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all transform hover:scale-105"
            >
              Fix My Ranking →
            </button>
          </div>
        </div>
        <div className="w-full">
          <h4 className="text-base md:text-lg font-semibold text-gray-300 mb-4 text-center">
            Your Revenue Flying to Competitors
          </h4>
          <div className="w-full">
            <Image
              src="/revenue-loss-flow.webp"
              alt="Revenue loss visualization"
              width={640}
              height={640}
              className="rounded-xl shadow-2xl w-full h-auto object-contain max-w-full"
            />
          </div>
          {/* CTA below image */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowLeadForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all transform hover:scale-105"
            >
              Stop Revenue Loss →
            </button>
          </div>
        </div>
      </motion.div>

      {/* Customer Journey Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="my-8 md:my-12 max-w-4xl mx-auto px-4"
      >
        <h4 className="text-lg md:text-xl font-semibold text-center text-white mb-4 md:mb-6">
          How 93% of Customers Are Bypassing You Right Now
        </h4>
        <div className="relative w-full">
          <Image
            src="/customer-journey-bypass.webp"
            alt="Customer journey bypass"
            width={800}
            height={400}
            className="rounded-xl shadow-2xl w-full h-auto object-contain max-w-full"
          />
        </div>
      </motion.div>
    </>
  );
}