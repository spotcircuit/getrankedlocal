'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ResultsSectionV3 from '@/components/ResultsSectionV3';
import Script from 'next/script';

export default function GridTestPage() {
  const searchParams = useSearchParams();
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [niche, setNiche] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gridData, setGridData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(true);
  const businessInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let autocompleteInstance: any = null;

    const initializeAutocomplete = () => {
      if (!businessInputRef.current) return;
      
      if (!(window as any).google?.maps?.places) {
        // Google Maps not loaded yet, retry
        setTimeout(initializeAutocomplete, 500);
        return;
      }

      // Clean up existing instance
      if (autocompleteInstance) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteInstance);
      }

      autocompleteInstance = new (window as any).google.maps.places.Autocomplete(
        businessInputRef.current,
        {
          types: ['establishment'],
          fields: ['name', 'place_id', 'formatted_address', 'address_components', 'geometry']
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (!place || !place.place_id) return;

        // Extract location data
        let extractedCity = '';
        let extractedState = '';
        
        if (place.address_components) {
          for (const component of place.address_components) {
            if (component.types.includes('locality')) {
              extractedCity = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              extractedState = component.short_name;
            }
          }
        }

        setBusinessName(place.name || businessInputRef.current?.value || '');
        setCity(extractedCity);
        setState(extractedState);
      });

      autocompleteRef.current = autocompleteInstance;
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteInstance) {
        (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, []);

  const runGridSearch = async () => {
    // If using test data, skip validation
    if (useTestData) {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/grid-search-test-data');
        
        if (!response.ok) {
          throw new Error('Failed to load test data');
        }

        const data = await response.json();
        
        if (data.success) {
          setGridData(data.gridData);
          // Set the business name from test data
          if (data.gridData?.targetBusiness?.name) {
            setBusinessName(data.gridData.targetBusiness.name);
          }
        } else {
          throw new Error(data.error || 'Failed to load test data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load test data');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Original validation for real searches
    if (!city || !state) {
      setError('Please enter a city and state');
      return;
    }
    
    if (!niche) {
      setError('Please enter a search term (what type of businesses to search for)');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/grid-search-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName || undefined, // Make it optional
          city,
          state,
          niche: niche || 'business'
        })
      });

      if (!response.ok) {
        throw new Error('Grid search failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setGridData(data.gridData);
      } else {
        throw new Error(data.error || 'Grid search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run grid search');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Grid Search Analysis</h1>
          
          {/* Search Form - Always Visible */}
          <div className="bg-gray-900 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name <span className="text-gray-500 text-xs">(Optional - or select from results)</span>
                </label>
                <input
                  ref={businessInputRef}
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Leave empty to explore all businesses..."
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                {city && state && (
                  <p className="text-xs text-gray-400 mt-1">
                    Location: {city}, {state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Term / Service <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., medical spa, plumber, restaurant"
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  What competitors should we search for? (e.g., if you're a med spa, search "medical spa")
                </p>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="useTestData"
                  checked={useTestData}
                  onChange={(e) => setUseTestData(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="useTestData" className="text-sm text-gray-300">
                  Use test data (instant results, no API call)
                </label>
              </div>

              <button
                onClick={runGridSearch}
                disabled={isLoading || (!useTestData && (!businessName || !city || !state || !niche))}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {useTestData ? 'Loading Test Data...' : 'Running Grid Search (1-2 minutes)...'}
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    {useTestData ? 'Load Test Data' : 'Run 169-Point Grid Search'}
                    <Search className="w-5 h-5" />
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-red-400">Error: {error}</p>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="mt-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">Running 169 searches across a 5-mile grid around {city}, {state}...</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(13, 1fr)',
                    gap: '2px',
                    maxWidth: '200px',
                    margin: '0 auto'
                  }}>
                    {Array.from({ length: 169 }, (_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-500/30 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 20}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {gridData && (
            <ResultsSectionV3 
              gridData={gridData} 
              businessName={businessName}
            />
          )}
        </div>
      </div>
    </>
  );
}