'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Trophy, TrendingUp, Users, Menu, X, Sparkles } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative">
      {/* Premium Announcement Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-2.5 px-4 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span className="text-sm text-white font-medium">
            Limited Offer: <span className="font-bold">Free AI-Powered Analysis</span> + 90-Day Guarantee
          </span>
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
      </motion.div>
      
      {/* Main Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Logo Centered */}
          <div className="flex justify-center py-4">
            <Link href="/" className="inline-flex group">
              <div 
                className="relative p-2.5 rounded-xl shadow-xl hover:shadow-2xl transition-all"
                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)' }}
              >
                <Image 
                  src="/logo.png"
                  alt="GetRankedLocal"
                  width={220}
                  height={220}
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          
          {/* Navigation Bar */}
          <div className="flex items-center justify-between pb-3">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Rank Analysis
              </Link>
              <Link href="/med-spa-directory" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Med Spa Directory
              </Link>
              <Link href="#contact" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Contact
              </Link>
            </nav>
            
            {/* Right Section */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {/* Trust Badges (Desktop) */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium">500+ Winners</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium">3.2x ROI</span>
                </div>
              </div>

              {/* CTA Button */}
              <Link 
                href="/"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Get Free Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur-lg"
          >
            <div className="px-4 py-4 space-y-2">
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Rank Analysis
              </Link>
              <Link href="/med-spa-directory" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Med Spa Directory
              </Link>
              <div className="pt-2">
                <Link 
                  href="/" 
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-full"
                >
                  Get Free Analysis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  );
}