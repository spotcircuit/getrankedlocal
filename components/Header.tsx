'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, X, Shield, Clock, TrendingUp, Phone, CheckCircle, Award } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [showContactModal, setShowContactModal] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const handleGetStarted = () => {
    setShowContactModal(true);
  };

  return (
    <>
      {/* Trust Bar */}
      <div className="bg-black border-b border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-gray-400">
                <Shield className="w-3 h-3 text-green-400" />
                HIPAA Compliant
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Award className="w-3 h-3 text-yellow-400" />
                Google Partner
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <CheckCircle className="w-3 h-3 text-blue-400" />
                500+ Ranked #1
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <header className="bg-gradient-to-b from-gray-900 via-black to-black border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Logo - Centered with better styling */}
          <div className="flex justify-center py-6">
            <Link href="/" className="group">
              <div className="relative p-3 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105" 
                   style={{ 
                     background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 50%, #9ca3af 100%)',
                     boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)'
                   }}>
                <Image 
                  src="/logo.png"
                  alt="GetRankedLocal"
                  width={240}
                  height={240}
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain"
                  priority
                />
                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
              </div>
            </Link>
          </div>
          
          {/* Enhanced Navigation */}
          <nav className="flex items-center justify-center pb-6">
            <div className="inline-flex items-center gap-2 p-1 bg-gray-900/50 backdrop-blur-sm rounded-full border border-gray-800">
              <Link 
                href="/" 
                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  isActive('/') && pathname !== '/directory'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Rank Analysis
              </Link>
              
              <Link 
                href="/directory" 
                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  isActive('/directory')
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Directory
              </Link>
              
              <div className="w-px h-6 bg-gray-700 mx-1"></div>
              
              <button 
                onClick={handleGetStarted}
                className="group px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Contact Modal - Improved Design */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
          
            <div className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10" style={{maxWidth: "400px", width: "100%"}}>
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors rounded-full p-2 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                Get Your Custom Ranking Plan
              </h2>
              <p className="text-gray-400 text-base">
                Free in-depth analysis • Personalized strategy • We'll contact you
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center gap-6 mb-8 pb-8 border-b border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Private & Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>24hr Response</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>500+ Ranked #1</span>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission
              alert('Thank you! We\'ll contact you within 24 hours with your personalized ranking plan.');
              setShowContactModal(false);
            }}>
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What's your business name?
                </label>
                <input
                  type="text"
                  placeholder="e.g., Austin Med Spa"
                  required
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">As it appears on Google Maps</p>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Where should we send your plan?
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">We'll email your custom strategy</p>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Best number to reach you?
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  required
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">To discuss your ranking strategy</p>
              </div>
              
              {/* Keyword/Niche */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What keywords do you want to rank for?
                </label>
                <input
                  type="text"
                  placeholder="e.g., med spa, botox near me"
                  required
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Keywords your customers search for</p>
              </div>
              
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What city are you in?
                </label>
                <input
                  type="text"
                  placeholder="Austin, TX"
                  required
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Your service area</p>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-base hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] mt-6"
              >
                Get My Custom Plan →
              </button>
              
              {/* Privacy Note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting, you agree to be contacted about your free analysis and ranking strategy. 
                Unsubscribe anytime.
              </p>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}