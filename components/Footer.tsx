'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Mail, Phone, Star, ArrowRight, Sparkles } from 'lucide-react';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showLeadForm, setShowLeadForm] = useState(false);
  
  const handleLeadSubmit = (data: LeadData) => {
    // Store lead data and show success message
    localStorage.setItem('leadCaptured', JSON.stringify(data));
    setShowLeadForm(false);
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-lg z-50';
    successMessage.textContent = 'Thank you! We\'ll contact you within 24 hours.';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 5000);
  };
  
  return (
    <footer className="relative bg-gradient-to-b from-black to-gray-900 border-t border-white/10">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Consistent padding for all columns */}
          <style jsx>{`
            @media (min-width: 768px) {
              .footer-col {
                padding-top: 1.5rem;
              }
            }
          `}</style>
          {/* Brand Column */}
          <div className="md:col-span-1 footer-col">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div 
                className="inline-flex p-3 rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)' }}
              >
                <Image 
                  src="/logo.png"
                  alt="GetRankedLocal"
                  width={160}
                  height={160}
                  className="h-20 w-20 object-contain"
                />
              </div>
              <p className="text-sm text-gray-400 text-center md:text-left">
                Dominate local search with AI-powered SEO strategies that deliver measurable results.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs text-gray-400">500+ Success Stories</span>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-1 footer-col">
            <h3 className="text-white font-semibold text-lg mb-4 text-center md:text-left">Quick Links</h3>
            <ul className="space-y-3 w-full text-center md:text-left">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/getrankedlocal" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                  Get Ranked Local
                </Link>
              </li>
              <li>
                <Link href="/analysis" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                  Free Analysis
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div className="md:col-span-1 footer-col">
            <h3 className="text-white font-semibold text-lg mb-4 text-center md:text-left">Services</h3>
            <ul className="space-y-3 w-full text-center md:text-left">
              <li className="text-gray-400 text-sm">Local SEO Optimization</li>
              <li className="text-gray-400 text-sm">Google Business Profile</li>
              <li className="text-gray-400 text-sm">AI Content Strategy</li>
              <li className="text-gray-400 text-sm">Review Management</li>
            </ul>
          </div>
          
          {/* CTA Section */}
          <div className="md:col-span-1 footer-col">
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl p-8 h-full">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Ready to Dominate?
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Get your free competitive analysis and 90-day action plan.
              </p>
              <button 
                onClick={() => setShowLeadForm(true)}
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Start Free Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-black/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-gray-500">
                © {currentYear} GetRankedLocal. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-gray-400">
                Powered by{' '}
                <a 
                  href="https://spotcircuit.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  SpotCircuit AI
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lead Capture Form Modal */}
      <LeadCaptureForm 
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        title="Get Your Free Analysis"
        subtitle="Enter your information and we'll send you a detailed competitive analysis"
      />
    </footer>
  );
}