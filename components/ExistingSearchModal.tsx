'use client';

import { useState } from 'react';
import { X, CheckCircle, Clock, Search, Database, Sparkles, TrendingUp } from 'lucide-react';

interface ExistingSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSearchData: any;
  businessName: string;
  niche: string;
  onRunNewSearch: () => void;
  onUseExisting: (data: any) => void;
}

export default function ExistingSearchModal({
  isOpen,
  onClose,
  existingSearchData,
  businessName,
  niche,
  onRunNewSearch,
  onUseExisting,
}: ExistingSearchModalProps) {
  if (!isOpen) return null;

  const { searches = [], bestResult, searchTermsUsed = [] } = existingSearchData || {};
  
  const mostRecentSearch = searches[0];
  const hasEmail = bestResult?.business?.email;
  const hasOwner = bestResult?.business?.owner;
  const competitorCount = bestResult?.competitors?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - Fixed width to be responsive */}
      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl w-[90%] max-w-3xl mx-4 max-h-[85vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm p-6 border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-bold text-white">Existing Analysis Found!</h2>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Business Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">{businessName}</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded">
                {searchTermsUsed.join(', ') || niche}
              </span>
              {mostRecentSearch && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(mostRecentSearch.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Existing Data Summary */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Available Data:</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {hasEmail ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <span className="text-white font-medium">Email Captured</span>
                </div>
                <p className="text-sm text-gray-400">
                  {hasEmail ? bestResult.business.email : 'Not yet captured'}
                </p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {hasOwner ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <span className="text-white font-medium">Owner Identified</span>
                </div>
                <p className="text-sm text-gray-400">
                  {hasOwner ? bestResult.business.owner : 'Not yet identified'}
                </p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-white font-medium">Competitors Found</span>
                </div>
                <p className="text-sm text-gray-400">
                  {competitorCount} competitors analyzed
                </p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="text-white font-medium">Previous Searches</span>
                </div>
                <p className="text-sm text-gray-400">
                  {searches.length} {searches.length === 1 ? 'search' : 'searches'} in database
                </p>
              </div>
            </div>
          </div>
          
          {/* Previous Search Terms */}
          {searches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Previous Searches:</h4>
              <div className="space-y-2">
                {searches.slice(0, 3).map((search: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                    <div>
                      <span className="text-white font-medium">{search.search_term}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({search.competitor_count} competitors)
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(search.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => onUseExisting(bestResult)}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Use Existing Results
            </button>
            
            <button
              onClick={onRunNewSearch}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Run Fresh Analysis
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Fresh analysis will search with new keywords and may find additional competitors
          </p>
        </div>
      </div>
    </div>
  );
}