'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Star, MapPin, ChevronRight } from 'lucide-react';

interface BusinessMatch {
  id: string;
  name: string;
  slug: string;
  rating?: number;
  reviewCount?: number;
  collection: string;
  state: string;
  redirectUrl: string;
  source_directory: string;
  city: string;
  snippet: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: BusinessMatch[];
  matchType: string;
  similarity?: number;
  onSelect: (business: BusinessMatch) => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  businesses,
  matchType,
  similarity,
  onSelect,
  onCancel,
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !businesses || businesses.length === 0) return null;

  const modalContent = (
    <>
      <style jsx global>{`
        body {
          overflow: hidden !important;
        }
        .modal-backdrop {
          pointer-events: none;
        }
        .modal-backdrop > * {
          pointer-events: auto;
        }
        /* Override any competing z-indexes */
        [data-radix-portal], .fixed, .absolute {
          z-index: 2147483646 !important;
        }
        /* Specifically target the search form and its elements */
        form input, form button, .pac-container {
          pointer-events: none !important;
          opacity: 0.3 !important;
        }
      `}</style>
      <div className="fixed inset-0 z-[2147483647] bg-black/95 flex items-center justify-center p-4 modal-backdrop">
        <div className="relative w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl border-4 border-purple-500 p-8 shadow-2xl max-h-[90vh] overflow-y-auto z-[2147483647]">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-4xl font-bold text-white">
                {businesses.length === 1 ? '🎉 Business Found!' : `📋 ${businesses.length} Matches Found!`}
              </h3>
              <p className="text-xl text-gray-300 mt-3">
                {matchType === 'exact_name_location' && '✅ Exact name and location matches'}
                {matchType === 'fuzzy_name' && `🔍 Similar matches (${Math.round((similarity || 0) * 100)}% similarity)`}
                {matchType === 'place_id' && '📍 Exact location match'}
              </p>
            </div>
            <button
              onClick={() => onCancel()}
              className="rounded-full p-4 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* Match Type Indicator */}
          <div className="mb-8">
            {matchType === 'place_id' && (
              <span className="inline-flex items-center gap-3 px-6 py-3 text-lg bg-green-100 border border-green-300 rounded-full text-green-800 font-semibold">
                <Check className="w-5 h-5" />
                Exact Location Match
              </span>
            )}
            {matchType === 'exact_name_location' && (
              <span className="inline-flex items-center gap-3 px-6 py-3 text-lg bg-blue-100 border border-blue-300 rounded-full text-blue-800 font-semibold">
                <Check className="w-5 h-5" />
                Exact Name & Location Match
              </span>
            )}
            {matchType === 'fuzzy_name' && (
              <span className="inline-flex items-center gap-3 px-6 py-3 text-lg bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 font-semibold">
                <Star className="w-5 h-5" />
                Similar Matches ({Math.round((similarity || 0) * 100)}%)
              </span>
            )}
          </div>

          {/* Business List */}
          <div className="space-y-6 mb-10">
            {businesses.map((business, index) => (
              <div
                key={business.id}
                className="group relative rounded-3xl border-3 border-gray-600 bg-gradient-to-br from-gray-800 to-gray-900 p-8 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 hover:border-purple-500 transition-all cursor-pointer"
                onClick={() => onSelect(business)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h4 className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {business.name}
                      </h4>
                      <span className="text-lg text-white bg-purple-600 px-4 py-2 rounded-full font-semibold">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-xl text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-red-500" />
                        <span className="font-semibold text-white">{business.collection}, {business.city}, {business.state.toUpperCase()}</span>
                      </div>

                      {(business.rating || business.reviewCount) && (
                        <div className="flex items-center gap-6">
                          {business.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="w-6 h-6 text-yellow-500 fill-current" />
                              <span className="text-white font-bold text-2xl text-yellow-400">{business.rating}</span>
                            </div>
                          )}
                          {business.reviewCount && (
                            <span className="text-gray-300 font-semibold text-lg">{business.reviewCount} reviews</span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-lg text-gray-200 bg-gray-700/50 p-4 rounded-xl border-2 border-gray-600">
                      {business.snippet}
                    </p>
                  </div>

                  <ChevronRight className="w-8 h-8 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-3 transition-all" />
                </div>
              </div>
            ))}
          </div>

          {/* Question */}
          <div className="mb-10 text-center">
            <p className="text-3xl font-bold text-white">
              {businesses.length === 1
                ? '🎯 Is this the business you\'re looking for?'
                : '🔍 Which business would you like to view?'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6">
            <button
              onClick={onCancel}
              className="flex-1 px-8 py-6 text-xl font-bold text-black bg-red-200 border-4 border-red-400 rounded-3xl hover:bg-red-300 hover:border-red-500 transition-colors"
            >
              🚫 None of these, find new business
            </button>
            {businesses.length === 1 && (
              <button
                onClick={() => onSelect(businesses[0])}
                className="flex-1 px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl hover:from-green-700 hover:to-blue-700 transition-transform hover:scale-105"
              >
                ✅ Yes, View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
