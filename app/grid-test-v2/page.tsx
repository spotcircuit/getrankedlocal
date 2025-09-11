'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Search, Building2, Globe, Grid3x3, Ruler, Info, Navigation, X, Crosshair, Star, Phone, Eye } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ResultsSectionV3 from '@/components/ResultsSectionV3';
import GridSearchModal from '@/components/GridSearchModal';
import GridMapCanvas from '@/components/GridMapCanvas';
import { 
  calculateGridSpacing,
  calculateCoverageArea,
  getTotalPoints,
  getGridSummary,
  spacingToRadiusMiles,
  radiusToSpacingMiles
} from '@/lib/grid-calculations';
import { ensureGoogleMapsLoaded } from '@/lib/maps-loader';

// Google Maps loader centralized in lib/maps-loader

export default function GridTestV2Page() {
  const searchParams = useSearchParams();
  const [searchMode, setSearchMode] = useState<'all' | 'targeted'>('all');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [niche, setNiche] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gridData, setGridData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [centerCoords, setCenterCoords] = useState<{lat: number, lng: number} | null>(null);
  const [targetBusiness, setTargetBusiness] = useState<{
    name: string;
    lat: number;
    lng: number;
    placeId?: string;
    rating?: number;
    reviews?: number;
    phone?: string;
    address?: string;
  } | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  
  // Grid configuration
  const [gridSize, setGridSize] = useState(9);
  // Coverage radius (miles) — max 30 miles in any direction
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [showCoverage, setShowCoverage] = useState(false);
  const [showInitialForm, setShowInitialForm] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [showAllPins, setShowAllPins] = useState(false);
  

  const gridSizeOptions = [5, 7, 9, 11, 13, 15];

  // Hydrate from URL params on first load
  useEffect(() => {
    if (!searchParams) return;
    const mode = (searchParams.get('mode') as 'all' | 'targeted') || undefined;
    const qCity = searchParams.get('city') || undefined;
    const qState = searchParams.get('state') || undefined;
    const qBiz = searchParams.get('businessName') || undefined;
    const qNiche = searchParams.get('niche') || undefined;
    const qLat = searchParams.get('lat');
    const qLng = searchParams.get('lng');
    const qGrid = searchParams.get('gridSize');
    const qRadius = searchParams.get('radius');
    const qSpacing = searchParams.get('spacing');

    if (mode) setSearchMode(mode);
    if (qCity) setCity(qCity);
    if (qState) setState(qState);
    if (qBiz) setBusinessName(qBiz);
    if (qNiche) setNiche(qNiche);
    if (qGrid) setGridSize(parseInt(qGrid, 10));
    if (qRadius) {
      const r = parseFloat(qRadius);
      if (!Number.isNaN(r)) setRadiusMiles(Math.min(r, 30));
    } else if (qSpacing) {
      const s = parseFloat(qSpacing);
      if (!Number.isNaN(s)) setRadiusMiles(Math.min(spacingToRadiusMiles(s, parseInt(qGrid || String(gridSize), 10) || gridSize), 30));
    }
    
    if (qLat && qLng) {
      const lat = parseFloat(qLat);
      const lng = parseFloat(qLng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const coords = { lat, lng };
        setLocationCoords(coords);
        setCenterCoords(coords);
        setShowInitialForm(false);
      }
    }
  // We only want to run this once on mount to hydrate state from URL
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!showInitialForm) return;
    
    let autocompleteInstance: any = null;

    const initializeAutocomplete = async () => {
      if (!autocompleteInputRef.current) return;
      // Ensure Google Maps + Places are loaded before initializing
      try {
        await ensureGoogleMapsLoaded();
      } catch (e) {
        console.error(e);
        return;
      }

      const g = (window as any).google;
      if (!g?.maps?.places?.Autocomplete) {
        // Places not attached yet; retry shortly
        setTimeout(initializeAutocomplete, 200);
        return;
      }

      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      const options = searchMode === 'targeted' 
        ? {
            // Restrict to businesses only
            types: ['establishment'],
            // Include types so we can validate selection
            fields: ['name', 'types', 'place_id', 'formatted_address', 'address_components', 'geometry']
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

        let extractedCity = '';
        let extractedState = '';
        
    if (place.geometry && place.geometry.location) {
      const lat: number = place.geometry.location.lat();
      const lng: number = place.geometry.location.lng();
      setLocationCoords({ lat, lng });
      setCenterCoords({ lat, lng });
          try {
            console.log('[GridTestV2] Autocomplete selection coords:', { lat, lng, name: place.name });
          } catch {}
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
          // Validate that the selection is a business, not a city/region
          const ptypes: string[] = Array.isArray(place.types) ? place.types : [];
          const isBusiness = ptypes.includes('establishment') || ptypes.includes('point_of_interest');
          const isLocation = ptypes.some(t => (
            t === 'locality' ||
            t === 'sublocality' ||
            t === 'administrative_area_level_1' ||
            t === 'administrative_area_level_2' ||
            t === 'country' ||
            t === 'route' ||
            t === 'postal_code' ||
            t === 'neighborhood'
          ));
          if (!isBusiness || isLocation) {
            setError('Please select a business from the list (not a city or address)');
            setBusinessName('');
            setTargetBusiness(null);
            return;
          }
          setBusinessName(place.name || '');
          setCity(extractedCity);
          setState(extractedState);
          // Fetch more details via Places Details using place_id
          const placeId = place.place_id;
          if (placeId && lat != null && lng != null) {
            try {
              const g = (window as any).google;
              const svc = new g.maps.places.PlacesService(document.createElement('div'));
              svc.getDetails(
                {
                  placeId,
                  fields: ['name','formatted_address','formatted_phone_number','international_phone_number','rating','user_ratings_total','geometry']
                },
                (details: any, status: any) => {
                  try {
                    const ok = status === g.maps.places.PlacesServiceStatus.OK;
                    const info = ok && details ? details : null;
                    setTargetBusiness({
                      name: (info?.name || place.name) ?? '',
                      lat: info?.geometry?.location?.lat?.() ?? lat!,
                      lng: info?.geometry?.location?.lng?.() ?? lng!,
                      placeId,
                      rating: info?.rating ?? undefined,
                      reviews: info?.user_ratings_total ?? undefined,
                      phone: info?.formatted_phone_number ?? info?.international_phone_number ?? undefined,
                      address: info?.formatted_address ?? extractedCity ? `${extractedCity}, ${extractedState}` : undefined,
                    });
                  } catch { /* noop */ }
                }
              );
            } catch {
              // Fallback: set minimal info
              setTargetBusiness({
                name: place.name || '',
                lat: lat!,
                lng: lng!,
                placeId,
                address: place.formatted_address || (extractedCity ? `${extractedCity}, ${extractedState}` : undefined),
              });
            }
          } else if (lat != null && lng != null) {
            setTargetBusiness({
              name: place.name || '',
              lat: lat!,
              lng: lng!,
              address: place.formatted_address || (extractedCity ? `${extractedCity}, ${extractedState}` : undefined),
            });
          }
        } else {
          setCity(extractedCity || place.name || '');
          setState(extractedState);
          setBusinessName('');
          setTargetBusiness(null);
        }

        // Immediately transition to map view with default grid overlay
        // so the user sees the selected location and grid without extra clicks
        if (place.geometry?.location) {
          setShowInitialForm(false);
        }

        // Do not modify URL; React state handles map & grid state
      });

      autocompleteRef.current = autocompleteInstance;
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [searchMode, showInitialForm]);

  // URL is not mutated; React state controls everything

  const handleRecenter = () => {
    if (locationCoords) {
      setCenterCoords(locationCoords);
    }
  };

  const handleProceedToMap = () => {
    // Validate inputs per mode
    if (searchMode === 'all') {
      if (!city || !state) {
        setError('Please enter a city and state');
        return;
      }
    } else {
      if (!businessName) {
        setError('Please select a business');
        return;
      }
    }

    // Require an actual selection from autocomplete (for coordinates)
    if (!locationCoords) {
      setError('Please select from the autocomplete suggestions');
      return;
    }

    setError(null);
    setShowInitialForm(false);
  };

  // If we enter map view without a center but have locationCoords, hydrate center
  useEffect(() => {
    if (!showInitialForm && !centerCoords && locationCoords) {
      setCenterCoords(locationCoords);
    }
  }, [showInitialForm, centerCoords, locationCoords]);

  const runGridSearch = async () => {
    if (isLoading || gridData) return; // prevent double-run or re-run while results showing
    // Require a search term; users can enter it in the sidebar now
    if (!niche || !niche.trim()) {
      setError('Please enter a search term');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/grid-search-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: searchMode === 'targeted' ? businessName : undefined,
          businessPlaceId: searchMode === 'targeted' ? targetBusiness?.placeId : undefined,
          city,
          state,
          niche: niche.trim(),
          lat: centerCoords?.lat || locationCoords?.lat,
          lng: centerCoords?.lng || locationCoords?.lng,
          gridSize,
          radiusMiles
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

  const summary = getGridSummary(gridSize, radiusMiles);

  // Initial form view
  if (showInitialForm) {
    return (
      <>
        <div key="formRoot" className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">Grid Search Analysis</h1>
            
            <div className="bg-gray-900 rounded-xl p-6">
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
                        onChange={() => setSearchMode('all')}
                        className="w-4 h-4"
                      />
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-white">All Businesses</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="searchMode"
                        value="targeted"
                        checked={searchMode === 'targeted'}
                        onChange={() => setSearchMode('targeted')}
                        className="w-4 h-4"
                      />
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span className="text-white">Target Business</span>
                    </label>
                  </div>
                </div>

                {/* Location Input */}
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
                </div>

                {/* Search term lives in the sidebar; not required on this screen */}

                {error && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleProceedToMap}
                  disabled={searchMode === 'targeted' ? !businessName : (!city || !state)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white transition-all"
                >
                  Configure Grid Search →
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Map view with sidebar (LocalViking style)
  return (
    <>
      <div key="mapRoot" className="min-h-screen flex items-stretch bg-black">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-900 shadow-2xl z-10 h-screen flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Configure your grid</h2>
              <button
                onClick={() => setShowInitialForm(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-sm text-gray-400 mb-1">
                {searchMode === 'targeted' ? 'Target Business' : 'Search Location'}
              </p>
              <p className="text-white font-medium">
                {searchMode === 'targeted' ? businessName : `${city}, ${state}`}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Searching for: {niche}
              </p>
            </div>

            {/* Target Business Mini Card */}
            {searchMode === 'targeted' && targetBusiness && (
              <div className="mt-3 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{targetBusiness.name}</div>
                    {targetBusiness.address && (
                      <div className="text-xs text-gray-400 mt-1">{targetBusiness.address}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    {typeof targetBusiness.rating === 'number' ? (
                      <>
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span className="text-xs font-semibold">{targetBusiness.rating}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No rating</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  {typeof targetBusiness.reviews === 'number' && (
                    <span>({targetBusiness.reviews} reviews)</span>
                  )}
                  {targetBusiness.phone && (
                    <span className="inline-flex items-center gap-1 text-gray-300">
                      <Phone className="w-3 h-3" /> {targetBusiness.phone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Configuration or Results Sidebar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!gridData ? (
            <>
            {/* Search Term / Service */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-1">
                <Search className="w-4 h-4" />
                <span>Search Term / Service</span>
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => { setNiche(e.target.value); if (error) setError(null); }}
                placeholder="e.g., medical spa, plumber, restaurant"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Required. Used as the keyword for each grid search point.</p>
            </div>
            {/* Grid Size */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <Grid3x3 className="w-4 h-4" />
                <span>Grid size</span>
              </label>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                {gridSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size} x {size} ({size * size} points)
                  </option>
                ))}
              </select>
            </div>

            {/* Coverage Radius (miles from center) */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <Ruler className="w-4 h-4" />
                <span>Coverage radius (miles)</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.25"
                  max="30"
                  step="0.25"
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0.25 mi</span>
                  <span className="text-purple-400 font-medium">{radiusMiles} miles</span>
                  <span>30 mi</span>
                </div>
              </div>
            </div>

            {/* Grid Info */}
            <div className="bg-gray-800 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Points:</span>
                <span className="text-white font-medium">{summary.totalPoints}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Point Spacing:</span>
                <span className="text-white font-medium">{summary.spacing} miles</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Grid Span (edge-to-edge):</span>
                <span className="text-white font-medium">{(2 * radiusMiles).toFixed(2)} miles</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Coverage Area:</span>
                <span className="text-white font-medium">{summary.coverageArea} sq mi</span>
              </div>
              <label className="mt-1 flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={showCoverage}
                  onChange={(e) => setShowCoverage(e.target.checked)}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
                />
                Show grid boundary
              </label>
            </div>

            {/* Drag Instructions */}
            <div className="bg-slate-900 border border-blue-800 rounded-lg p-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="font-medium mb-1">Drag to adjust center</p>
                  <p>Drag the center point on the map to move the grid.</p>
                </div>
              </div>
            </div>
            </>
            ) : (
              <>
                {/* Results Sidebar: Competitor List */}
                <div className="bg-gray-800 rounded-lg p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-300">Top Competitors</div>
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input type="checkbox" className="w-4 h-4 bg-gray-800 border-gray-600 rounded" checked={showAllPins} onChange={e => setShowAllPins(e.target.checked)} />
                      Show pins
                    </label>
                  </div>
                  <div className="max-h-48 overflow-y-auto grid grid-cols-1 gap-1">
                    {((gridData?.competitors || [])
                      .slice()
                      .sort((a, b) => (parseFloat(String(b.coverage)) || 0) - (parseFloat(String(a.coverage)) || 0))
                      .slice(0, 20)
                    ).map((c: any, idx: number) => {
                      const isSelected = selectedCompetitor === c.name;
                      const targetedName = (searchMode === 'targeted') ? (targetBusiness?.name || businessName) : '';
                      const isTargeted = targetedName && c.name && c.name.toLowerCase() === targetedName.toLowerCase();
                      const rankColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-purple-400';
                      const cov = Math.min(100, Math.max(0, Math.round(Number(c.coverage))));
                      const covColor = cov > 75 ? '#10b981' : cov > 50 ? '#eab308' : cov > 25 ? '#f97316' : '#ef4444';
                      const covTextColor = cov > 75 ? 'text-green-400' : cov > 50 ? 'text-yellow-400' : cov > 25 ? 'text-orange-400' : 'text-red-400';
                      return (
                        <button
                          key={c.name + idx}
                          onClick={() => { setSelectedCompetitor(c.name); /* preserve show pins state */ }}
                          className={`text-left px-2 py-1.5 rounded-md border-2 transition-colors flex items-start justify-between ${
                            isSelected ? 'border-purple-500 bg-gray-700' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                          } ${isTargeted ? 'border-blue-500' : ''}`}
                          aria-current={isSelected ? 'true' : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0" style={{ width: 8, height: 8, borderRadius: '9999px', backgroundColor: covColor }} />
                            <span className={`text-xs font-bold shrink-0 ${rankColor}`}>#{idx + 1}</span>
                            {isSelected && <Eye className="w-3 h-3 text-purple-400 shrink-0" />}
                            <span className="text-sm text-white font-semibold truncate">{c.name}</span>
                          </div>
                          <div className="text-right ml-2 shrink-0">
                            <span className="inline-block text-xs font-semibold text-purple-400">cov {cov}%</span>
                            <div className="mt-0.5 text-[11px] text-gray-200 flex items-center gap-2 justify-end">
                              <span>avg #{c.avgRank}</span>
                              {typeof c.rating === 'number' && <span>⭐ {c.rating} ({c.reviews || 0})</span>}
                            </div>
                            {isSelected && (
                              <div className="mt-0.5 text-[10px] text-purple-300 font-semibold">Viewing</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Validation message (map view) */}
          {error && (
            <div className="mx-6 -mt-2 mb-2 bg-red-900 border border-red-800 rounded-lg p-3 text-sm text-red-300" role="alert">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t border-gray-800 shrink-0">
            <button
              onClick={runGridSearch}
              disabled={isLoading || !niche.trim() || !!gridData}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Grid Search...
                </>
              ) : gridData ? (
                <>
                  <Loader2 className="w-5 h-5" />
                  Viewing Results
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Grid Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Map Area (replaces with results view when available) */}
        <div className="flex-1 min-w-0 bg-gray-800 overflow-hidden relative" style={{ height: '100vh', width: 'calc(100vw - 16rem)' }}>
          {!gridData ? (
            <>
              {!centerCoords && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                  <div className="bg-gray-900/80 px-4 py-2 rounded-md border border-gray-700">
                    Select a location to load the map
                  </div>
                </div>
              )}
              <GridMapCanvas
                center={centerCoords}
                gridSize={gridSize}
                radiusMiles={radiusMiles}
                renderAsSquares={true}
                showCoverageCircle={showCoverage}
                targetBusiness={targetBusiness || undefined}
                searchMode={searchMode}
                businessName={businessName}
                city={city}
                state={state}
                onCenterChange={(c) => setCenterCoords(c)}
              />
              {/* Re-center FAB */}
              <button
                onClick={handleRecenter}
                title={`Re-center on ${searchMode === 'targeted' ? 'business' : 'search'} location`}
                aria-label={`Re-center on ${searchMode === 'targeted' ? 'business' : 'search'} location`}
                className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl flex items-center justify-center transition-colors z-20"
              >
                <Crosshair className="w-6 h-6" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 overflow-auto">
              <div className="p-4">
                <button
                  onClick={() => setGridData(null)}
                  className="mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  ← Back to Grid Configuration
                </button>
                <ResultsSectionV3 
                  gridData={gridData} 
                  businessName={searchMode === 'targeted' ? businessName : ''}
                  externalSelectedCompetitor={selectedCompetitor}
                  onSelectCompetitor={(name) => setSelectedCompetitor(name)}
                  externalShowAllPins={showAllPins}
                  renderCompetitorPanel={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results now render in the map pane above */}

        {/* Loading Modal */}
        <GridSearchModal
          isOpen={isLoading}
          city={city}
          state={state}
          niche={niche}
          businessName={businessName}
          searchMode={searchMode}
          gridSize={gridSize}
          radiusMiles={radiusMiles}
          onClose={() => setIsLoading(false)}
        />
      </div>
    </>
  );
}
