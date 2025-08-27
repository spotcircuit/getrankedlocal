'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

export default function Footer() {
  const [imageError, setImageError] = useState(false);
  
  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-800 border-t-2 border-gray-600">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              {/* Left logo aligned with right logo */}
              <div>
                {!imageError ? (
                  <div className="bg-white p-3 rounded-lg inline-block">
                    <Image 
                      src="/logo4.png" 
                      alt="GetRankedLocal" 
                      width={200} 
                      height={60}
                      className="h-12 sm:h-14 w-auto object-contain max-w-[200px]"
                      sizes="(max-width: 640px) 160px, 200px"
                      onError={() => setImageError(true)}
                      priority={false}
                    />
                  </div>
                ) : (
                  /* Custom text logo as fallback */
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-xl shadow-2xl inline-block">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-400 p-1.5 rounded">
                        <MapPin className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="text-white font-bold text-xl sm:text-2xl tracking-tight">
                        GetRanked<span className="text-yellow-300">Local</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Tagline to the right of left logo */}
              <div className="flex flex-col justify-center">
                <p className="text-sm sm:text-base text-white font-medium">Dominate Google & AI Search</p>
                <p className="text-xs sm:text-sm text-gray-300">in 90 Days</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-200">
              © {new Date().getFullYear()} GetRankedLocal
            </p>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">All rights reserved</p>
          </div>
          
          <div className="text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center md:justify-end gap-4">
              {/* Second logo aligned with left logo */}
              <div className="mb-4 md:mb-0">
                {!imageError ? (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg inline-block">
                    <Image 
                      src="/logo4.png" 
                      alt="GetRankedLocal" 
                      width={200} 
                      height={60}
                      className="h-12 sm:h-14 w-auto object-contain max-w-[200px] invert"
                      sizes="(max-width: 640px) 160px, 200px"
                      onError={() => setImageError(true)}
                      priority={false}
                    />
                  </div>
                ) : (
                  /* Alternative styled text logo */
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-xl inline-block">
                    <div className="text-white font-bold text-lg sm:text-xl tracking-tight">
                      GetRanked<span className="text-yellow-300">Local</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Powered by SpotCircuit to the right of logo */}
              <div>
                <p className="text-sm sm:text-base text-white">
                  Powered by{' '}
                  <a 
                    href="https://spotcircuit.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-300 hover:text-purple-200 font-bold transition-colors underline underline-offset-2"
                  >
                    SpotCircuit
                  </a>
                </p>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">AI-Powered Marketing Technology</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}