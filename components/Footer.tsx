'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

export default function Footer() {
  const [imageError, setImageError] = useState(false);
  
  return (
    <footer className="py-16 px-6 bg-gray-800 border-t-2 border-gray-600">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="mb-4">
              {/* Try to load image first, fallback to custom logo on error */}
              {!imageError ? (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <Image 
                    src="/logo4.png" 
                    alt="GetRankedLocal" 
                    width={180} 
                    height={50}
                    className="h-auto w-auto max-h-[50px] max-w-[180px]"
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
                    <div className="text-white font-bold text-2xl tracking-tight">
                      GetRanked<span className="text-yellow-300">Local</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-base text-white font-medium">Dominate Google & AI Search in 90 Days</p>
          </div>
          
          <div className="text-center">
            <p className="text-base text-gray-200">
              © {new Date().getFullYear()} GetRankedLocal
            </p>
            <p className="text-sm text-gray-300 mt-1">All rights reserved</p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-base text-white">
              Powered by{' '}
              <a 
                href="https://spotcircuit.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-purple-200 font-bold transition-colors underline"
              >
                SpotCircuit
              </a>
            </p>
            <p className="text-sm text-gray-300 mt-2">AI-Powered Marketing Technology</p>
          </div>
        </div>
      </div>
    </footer>
  );
}