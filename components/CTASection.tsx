'use client';

import { motion } from 'framer-motion';
import { Calendar, Phone, ArrowRight, Clock, Shield, Zap, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';

interface CTASectionProps {
  businessName: string;
  urgency: string;
  businessWebsite?: string;
}

export default function CTASection({ businessName, urgency, businessWebsite = '' }: CTASectionProps) {
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
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-lg z-50';
    successMessage.textContent = 'Thank you! We\'ll contact you within 24 hours with your free analysis.';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 5000);
  };
  
  const handleCTAClick = () => {
    if (!hasSubmittedForm) {
      setShowLeadForm(true);
    } else {
      // If they've already submitted, show a message
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-lg z-50';
      message.textContent = 'We already have your information. We\'ll be in touch within 24 hours!';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 5000);
    }
  };

  return (
    <section id="cta-section" className="py-20 px-6 bg-gradient-to-b from-black via-purple-900/20 to-black">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-sm font-semibold mb-6">
            <Clock className="w-4 h-4" />
            {urgency}
          </div>
          
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo3.png" 
              alt="GetRankedLocal Icon" 
              width={80} 
              height={80}
              className="opacity-80"
            />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Claim Your <span className="text-green-400">#1 Ranking</span>
            <br />Before Competitors Do
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Limited spots available for <span className="text-yellow-400 font-bold">{businessName}'s</span> market.
            <br />
            We only work with one business per area.
          </p>
        </motion.div>
        
        {/* Main CTA Box - Simplified */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button 
            onClick={handleCTAClick}
            className="px-12 py-5 rounded-lg font-bold text-xl transition-transform bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 inline-flex items-center gap-3"
          >
            {hasSubmittedForm ? 'View Your Analysis Status' : 'Get My Free Analysis Now'}
            <ArrowRight className="w-6 h-6" />
          </button>
          
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              100% Confidential
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              No Credit Card Required
            </span>
          </div>
        </motion.div>
        
      </div>
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        title="Get Your Free Competitive Analysis"
        subtitle="See exactly how to outrank your competitors"
        businessName={businessName}
        businessWebsite={businessWebsite}
      />
    </section>
  );
}