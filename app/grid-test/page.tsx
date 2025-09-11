'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Search, Building2, Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ResultsSectionV3 from '@/components/ResultsSectionV3';
import GridSearchModal from '@/components/GridSearchModal';
import GridConfigModalV2 from '@/components/GridConfigModalV2';
import Script from 'next/script';

export default function GridTestPage() {
  const searchParams = useSearchParams();
  const [searchMode, setSearchMode] = useState<'all' | 'targeted'>('all');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [niche, setNiche] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gridData, setGridData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [showGridConfig, setShowGridConfig] = useState(false);
  const [gridConfig, setGridConfig] = useState<{ gridSize: number; radiusMiles: number } | null>(null);

  // Initialize Google Places Autocomplete based on mode
  useEffect(() => {
    let autocompleteInstance: any = null;

    const initializeAutocomplete = () => {
      if (!autocompleteInputRef.current) return;
      
      if (!(window as any).google?.maps?.places) {
        // Google Maps not loaded yet, retry
        setTimeout(initializeAutocomplete, 500);
        return;
      }

      // Clean up existing instance
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      // Configure based on search mode
      const options = searchMode === 'targeted' 
        ? {
            types: ['establishment'],
            fields: ['name', 'place_id', 'formatted_address', 'address_components', 'geometry']
          }
        : {
            types: ['(cities)'],
            fields: ['name', 'address_components', 'geometry']
          };

      autocompleteInstance = new (window as any).google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        options
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (!place) return;

        // Extract location data
        let extractedCity = '';
        let extractedState = '';
        
        // Get coordinates from the place
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setLocationCoords({ lat, lng });
          console.log(`🎯 Got coordinates for "${place.name}": ${lat}, ${lng}`);
          console.log(`📍 Place details:`, {
            name: place.name,
            formatted_address: place.formatted_address,
            place_id: place.place_id,
            types: place.types,
            vicinity: place.vicinity
          });
        }
        
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

        if (searchMode === 'targeted') {
          // Business mode - set business name and location
          setBusinessName(place.name || '');
          setCity(extractedCity);
          setState(extractedState);
        } else {
          // City mode - just set location
          setCity(extractedCity || place.name || '');
          setState(extractedState);
          setBusinessName(''); // Clear business name in city mode
        }
      });

      autocompleteRef.current = autocompleteInstance;
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [searchMode]); // Re-initialize when mode changes

  const openGridConfig = () => {
    // Validation: only require location/business here; keyword is set in the config modal
    if (searchMode === 'targeted' && !businessName) {
      setError('Please select a business');
      return;
    }

    if (!city || !state) {
      setError('Please enter a city and state');
      return;
    }

    // Open modal for grid configuration
    setShowGridConfig(true);
    setError(null);

    // Scroll to top when modal opens to ensure it's visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runGridSearch = async (config?: { gridSize: number; radiusMiles: number }) => {
    // Use provided config or fallback to state
    const finalConfig = config || gridConfig;
    if (!finalConfig) {
      setError('Grid configuration required');
      return;
    }
    
    // Close modal if open
    setShowGridConfig(false);
    
    // If using test data, skip validation
    if (useTestData) {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch latest grid search from database instead of test file
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (niche) params.append('searchTerm', niche);
        
        const response = await fetch(`/api/grid-search-from-db${params.toString() ? '?' + params.toString() : ''}`);
        
        if (!response.ok) {
          throw new Error('Failed to load test data');
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Loaded grid data from DB:', data.gridData);
          console.log('Sample grid points with ranks:', data.gridData.gridPoints.slice(0, 5).map((p: any) => ({
            row: p.gridRow,
            col: p.gridCol,
            targetRank: p.targetRank
          })));
          setGridData(data.gridData);
          // Set the business name from test data if in targeted mode
          if (searchMode === 'targeted' && data.gridData?.targetBusiness?.name) {
            setBusinessName(data.gridData.targetBusiness.name);
          }
          // Scroll to results
          setTimeout(() => {
            document.getElementById('results-section')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }, 100);
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
    
    // Validation based on mode
    if (searchMode === 'targeted' && !businessName) {
      setError('Please select a business');
      return;
    }
    
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
      // Log what we're sending
      console.log(`📤 Sending grid search request:`, {
        mode: searchMode,
        businessName: searchMode === 'targeted' ? businessName : 'N/A',
        coordinates: locationCoords ? `${locationCoords.lat}, ${locationCoords.lng}` : 'No coordinates',
        city,
        state,
        niche,
        gridSize: finalConfig.gridSize,
        radiusMiles: finalConfig.radiusMiles
      });
      
      const response = await fetch('/api/grid-search-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: searchMode === 'targeted' ? businessName : undefined,
          city,
          state,
          niche: niche || 'business',
          lat: locationCoords?.lat,
          lng: locationCoords?.lng,
          gridSize: finalConfig.gridSize,
          radiusMiles: finalConfig.radiusMiles
        })
      });

      if (!response.ok) {
        throw new Error('Grid search failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setGridData(data.gridData);
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        throw new Error(data.error || 'Grid search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run grid search');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear autocomplete input when switching modes
  const handleModeChange = (mode: 'all' | 'targeted') => {
    setSearchMode(mode);
    setBusinessName('');
    if (autocompleteInputRef.current) {
      autocompleteInputRef.current.value = '';
    }
    // Keep city/state if switching from targeted to all
    if (mode === 'all' && searchMode === 'targeted') {
      // City and state are already set, just clear business name
      setBusinessName('');
    } else if (mode === 'targeted' && searchMode === 'all') {
      // Switching to targeted, might need to clear if it was just a city
      // Keep the location data
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
          
          {/* Search Form */}
          <div className="bg-gray-900 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              
              {/* Search Mode Selection */}
              <div className="bg-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Search Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchMode"
                      value="all"
                      checked={searchMode === 'all'}
                      onChange={() => handleModeChange('all')}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600"
                    />
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-white">All Businesses</span>
                    <span className="text-xs text-gray-400">(Explore market)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchMode"
                      value="targeted"
                      checked={searchMode === 'targeted'}
                      onChange={() => handleModeChange('targeted')}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600"
                    />
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span className="text-white">Target Business</span>
                    <span className="text-xs text-gray-400">(Track specific)</span>
                  </label>
                </div>
              </div>

              {/* Autocomplete Input - Changes based on mode */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {searchMode === 'targeted' ? 'Business Name' : 'City/Location'} 
                  <span className="text-red-400">*</span>
                </label>
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  placeholder={
                    searchMode === 'targeted' 
                      ? "Search for a specific business..." 
                      : "Enter a city (e.g., Austin, TX)..."
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                {city && state && (
                  <p className="text-xs text-gray-400 mt-1">
                    📍 Location: {city}, {state}
                    {searchMode === 'targeted' && businessName && (
                      <span className="ml-2">• Business: {businessName}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Keyword moved to config modal */}

              {/* Test Data Checkbox */}
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="useTestData"
                  checked={useTestData}
                  onChange={(e) => setUseTestData(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="useTestData" className="text-sm text-gray-300">
                  Load from database (instant, no grid search)
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={useTestData ? () => runGridSearch() : openGridConfig}
                disabled={isLoading || (!useTestData && (
                  !city || !state || (searchMode === 'targeted' && !businessName)
                ))}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {useTestData ? 'Loading from Database...' : 'Running Grid Search (1-2 minutes)...'}
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    {useTestData ? 'Load from Database' : 'Configure Grid Search'}
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

            {/* Loading Animation */}
            {isLoading && !useTestData && (
              <div className="mt-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">
                    Running 169 searches across a 5-mile grid around {city}, {state}...
                  </p>
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
            <div id="results-section">
              <ResultsSectionV3 
                gridData={gridData} 
                businessName={searchMode === 'targeted' ? businessName : ''}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Grid Configuration Modal V2 */}
      <GridConfigModalV2
        isOpen={showGridConfig}
        searchMode={searchMode}
        businessName={businessName}
        city={city}
        state={state}
        niche={niche}
        locationCoords={locationCoords}
        onNicheChange={(n) => setNiche(n)}
        onConfirm={(config) => {
          setGridConfig(config);
          runGridSearch(config);
        }}
        onCancel={() => setShowGridConfig(false)}
      />
      
      {/* Grid Search Modal */}
      <GridSearchModal
        isOpen={isLoading && !useTestData}
        city={city}
        state={state}
        niche={niche}
        businessName={businessName}
        searchMode={searchMode}
        onClose={() => setIsLoading(false)}
      />
    </>
  );
}
