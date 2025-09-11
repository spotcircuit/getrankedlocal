'use client';

import { useState } from 'react';
import { Loader2, MapPin, Search, TrendingUp } from 'lucide-react';

interface GridSearchTriggerProps {
  businessName: string;
  city: string;
  state: string;
  niche?: string;
  onResults: (data: any) => void;
}

export default function GridSearchTrigger({ 
  businessName, 
  city, 
  state, 
  niche = 'business',
  onResults 
}: GridSearchTriggerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startGridSearch = async () => {
    setIsSearching(true);
    setError(null);
    setProgress('Initializing grid search...');

    try {
      // First check if we have existing data
      const checkResponse = await fetch('/api/check-existing-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, city, state })
      });

      const existingData = await checkResponse.json();

      if (existingData.found) {
        // Use existing data
        console.log('Found existing data, no grid search needed');
        onResults(existingData);
        setIsSearching(false);
        return;
      }

      // No existing data, run grid search
      setProgress('Starting 169-point grid analysis...');
      
      const gridResponse = await fetch('/api/grid-search-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          city,
          state,
          niche
        })
      });

      if (!gridResponse.ok) {
        throw new Error('Grid search failed');
      }

      const gridData = await gridResponse.json();
      
      if (gridData.success) {
        setProgress('Grid search complete! Processing results...');
        
        // Combine grid data with empty database result
        const combinedResults = {
          found: false,
          isGridSearch: true,
          gridData: gridData.gridData,
          sessionId: gridData.sessionId,
          businessName,
          city,
          state,
          // Mock structure to match existing flow
          bestResult: {
            business: {
              name: businessName,
              rating: gridData.gridData.targetBusiness?.avgRank < 999 ? 4.5 : 0,
              review_count: 0,
              place_id: `temp_${gridData.sessionId}`
            },
            competitors: gridData.gridData.competitors || [],
            ai_intelligence: null // Will be enriched later
          }
        };

        onResults(combinedResults);
        setProgress('Analysis ready!');
      } else {
        throw new Error(gridData.error || 'Grid search failed');
      }

    } catch (err: any) {
      console.error('Grid search error:', err);
      setError(err.message || 'Failed to analyze business');
      setProgress('');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Trigger Button */}
      <button
        onClick={startGridSearch}
        disabled={isSearching}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-3"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing {businessName}...</span>
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            <span>Analyze Market Position</span>
            <TrendingUp className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Progress Indicator */}
      {isSearching && progress && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-300">{progress}</p>
          </div>
          
          {/* Grid visualization preview */}
          <div className="mt-3 grid grid-cols-13 gap-[1px] p-2 bg-gray-900/50 rounded">
            {Array.from({ length: 169 }, (_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-all duration-500 ${
                  isSearching 
                    ? 'bg-blue-500/30 animate-pulse' 
                    : 'bg-gray-700'
                }`}
                style={{
                  animationDelay: `${i * 10}ms`
                }}
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Running 169 searches across a 5-mile radius grid...
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-400">❌ {error}</p>
          <button
            onClick={startGridSearch}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Info Box */}
      {!isSearching && !error && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-xs text-gray-400">
          <p className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            This analysis will search from 169 different locations to show exactly where {businessName} ranks
          </p>
        </div>
      )}
    </div>
  );
}