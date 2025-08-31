'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface CompetitorAlertProps {
  className?: string;
}

export default function CompetitorAlert({ className = '' }: CompetitorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`my-12 ${className}`}
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative w-full rounded-xl overflow-hidden shadow-2xl">
          <Image 
            src="/competitor-alert-dashboard.webp"
            alt="Competitor movement alert - Your competitors are gaining ground"
            width={640}
            height={640}
            className="w-[640px] h-[640px] mx-auto object-contain"
            priority
          />
        </div>
        
        {/* Optional CTA below image */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              const section = document.querySelector('#pricing-section');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 animate-pulse" />
            Stop Losing Ground - Act Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}