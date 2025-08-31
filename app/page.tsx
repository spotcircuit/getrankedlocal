'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, TrendingUp, Sparkles, Star, ChevronRight, Target, Zap, Trophy, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalysisModal from '@/components/AnalysisModal';
import ExistingSearchModal from '@/components/ExistingSearchModal';
import ResultsSectionV2 from '@/components/ResultsSectionV2';
import SocialProofImage from '@/components/SocialProofImage';

export default function HomePage() {
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showExistingSearchModal, setShowExistingSearchModal] = useState(false);
  const [existingSearchData, setExistingSearchData] = useState<any>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [extractedLocation, setExtractedLocation] = useState<any>(null);
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [validationError, setValidationError] = useState('');
  const businessInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const checkSearchesRef = useRef<any>(null);

  // Check for existing searches in database
  const checkForExistingSearches = async (businessName: string, location: any) => {
    try {
      console.log('🔍 Checking for existing searches for:', businessName, location);
      
      // Use local API endpoint directly
      const response = await fetch('/api/check-existing-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          city: location.city,
          state: location.state,
          place_id: location.placeId
        })
      });
      
      const existingSearch = await response.json();

      if (existingSearch.found && existingSearch.bestResult) {
        console.log('🎯 Found existing search data:', existingSearch);
        setExistingSearchData(existingSearch);
        setHasExistingData(true);
        
        // Show a notification or indicator that we have existing data
        const searchTerms = existingSearch.searchTermsUsed?.join(', ') || 'various keywords';
        setValidationError(''); // Clear any errors
        
        // You could set a success message here instead
        console.log(`✅ Found existing data for ${searchTerms}`);
        
        // Store the data but don't show modal yet - let user decide when to search
        return true;
      }
      setHasExistingData(false);
      return false;
    } catch (error) {
      console.error('Error checking existing searches:', error);
      setHasExistingData(false);
      return false;
    }
  };
  
  // Store the function in a ref so it can be accessed from within useEffect
  checkSearchesRef.current = checkForExistingSearches;

  // Check for existing searches when a valid business is selected
  useEffect(() => {
    console.log('📍 useEffect triggered:', { isValidBusiness, extractedLocation, businessName });
    if (isValidBusiness && extractedLocation && businessName) {
      console.log('🔍 Valid business selected, checking for existing searches...');
      checkForExistingSearches(businessName, extractedLocation);
    }
  }, [isValidBusiness, extractedLocation?.placeId]); // Only depend on placeId to avoid re-runs

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
      
      // Clean up any existing autocomplete
      if (autocompleteRef.current) {
        try {
          (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        } catch {}
        autocompleteRef.current = null;
      }
      
      try {
        console.log('🟢 Creating new Autocomplete instance');
        autocompleteInstance = new (window as any).google.maps.places.Autocomplete(
          businessInputRef.current,
          {
            types: ['establishment'],
            fields: ['name', 'place_id', 'formatted_address', 'address_components', 'geometry']
          }
        );
        console.log('🟢 Autocomplete instance created successfully');

        autocompleteRef.current = autocompleteInstance;

        autocompleteInstance.addListener('place_changed', () => {
          console.log('🔴 PLACE_CHANGED EVENT FIRED!');
          const place = autocompleteInstance.getPlace();
          console.log('🔵 Place data:', place);
          
          // Check if a valid place was selected
          if (!place || !place.place_id) {
            setIsValidBusiness(false);
            setValidationError('Please select a business from the dropdown');
            setExtractedLocation(null);
            return;
          }

          // Extract location data
          const components = place.address_components || [];
          let city = '', state = '';
          
          for (const comp of components) {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
          }

          const locationData = {
            placeId: place.place_id,
            name: place.name,
            formattedAddress: place.formatted_address,
            city,
            state,
            geometry: place.geometry
          };
          
          console.log('📍 Place selected from autocomplete:', {
            name: place.name,
            placeId: place.place_id,
            city,
            state
          });
          
          setExtractedLocation(locationData);

          // Update input with full name and address
          const displayName = place.name + (place.formatted_address ? ', ' + place.formatted_address : '');
          setBusinessName(displayName);
          setIsValidBusiness(true);
          setValidationError('');
          
          // Check for existing searches immediately when place is selected
          console.log('🚀 Checking for existing searches after place selection');
          
          // Call the local API directly
          fetch('/api/check-existing-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              business_name: displayName,
              city: locationData.city,
              state: locationData.state,
              place_id: locationData.placeId
            })
          }).then(response => response.json()).then(existingSearch => {
              if (existingSearch.found && existingSearch.bestResult) {
                console.log('🎯 Found existing search data:', existingSearch);
                setExistingSearchData(existingSearch);
                setHasExistingData(true);
                
                // Show a notification that we have existing data
                const searchTerms = existingSearch.searchTermsUsed?.join(', ') || 'various keywords';
                console.log(`✅ Found existing data for ${searchTerms}`);
              } else {
                console.log('❌ No existing search found');
                setHasExistingData(false);
              }
            }).catch(error => {
              console.error('Error checking existing searches:', error);
              setHasExistingData(false);
            });
        });
        
        console.log('Google Places Autocomplete initialized');
      } catch (error) {
        console.error('Failed to initialize autocomplete:', error);
      }
    };
    
    const loadGoogleMapsScript = () => {
      const existing = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existing) {
        // Script already loaded, just initialize
        initializeAutocomplete();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded');
        initializeAutocomplete();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
    // Ensure the Google Places dropdown is above all UI
    const styleId = 'pac-z-index-patch';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `.pac-container{z-index:9999 !important}`;
      document.head.appendChild(style);
    }
    
    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        try {
          (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        } catch {}
        autocompleteRef.current = null;
      }
    };
  }, []);

  // Fallback: if user focuses input before init completes, initialize on focus
  const handleBusinessFocus = () => {
    if (!autocompleteRef.current && (window as any).google?.maps?.places && businessInputRef.current) {
      try {
        const ac = new (window as any).google.maps.places.Autocomplete(
          businessInputRef.current,
          { types: ['establishment'], fields: ['name','place_id','formatted_address','address_components','geometry'] }
        );
        autocompleteRef.current = ac;
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place || !place.place_id) return;
          const components = place.address_components || [];
          let city = '', state = '';
          for (const comp of components) {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
          }
          const locationData = {
            placeId: place.place_id,
            name: place.name,
            formattedAddress: place.formatted_address,
            city,
            state,
            geometry: place.geometry,
          };
          setExtractedLocation(locationData);
          const displayName = place.name + (place.formatted_address ? ', ' + place.formatted_address : '');
          setBusinessName(displayName);
          setIsValidBusiness(true);
          setValidationError('');
          
          console.log('📍 Place selected from fallback autocomplete');
          // Check for existing searches immediately when place is selected
          console.log('🚀 Checking for existing searches after place selection');
          
          // Call the local API directly
          fetch('/api/check-existing-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              business_name: displayName,
              city: locationData.city,
              state: locationData.state,
              place_id: locationData.placeId
            })
          }).then(response => response.json()).then(existingSearch => {
              if (existingSearch.found && existingSearch.bestResult) {
                console.log('🎯 Found existing search data:', existingSearch);
                setExistingSearchData(existingSearch);
                setHasExistingData(true);
                
                // Show a notification that we have existing data
                const searchTerms = existingSearch.searchTermsUsed?.join(', ') || 'various keywords';
                console.log(`✅ Found existing data for ${searchTerms}`);
              } else {
                console.log('❌ No existing search found');
                setHasExistingData(false);
              }
            }).catch(error => {
              console.error('Error checking existing searches:', error);
              setHasExistingData(false);
            });
        });
      } catch {}
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a business was selected from autocomplete
    if (!isValidBusiness || !extractedLocation) {
      setValidationError('Please select a valid business from the dropdown');
      return;
    }
    
    if (!businessName.trim()) return;

    // Validate niche/keyword is provided
    const searchNiche = niche.trim();
    if (!searchNiche) {
      setValidationError('Please enter a search keyword/service (e.g., hair salon, med spa, dentist)');
      return;
    }
    setNiche(searchNiche);

    // Check if we already have existing search data (from autocomplete selection)
    if (existingSearchData && existingSearchData.found && existingSearchData.bestResult) {
      // We already found existing data when the business was selected
      console.log('🎯 Using pre-fetched existing search data');
      setShowExistingSearchModal(true);
      setShowModal(false);
      return;
    }
    
    // If not pre-fetched, check for existing searches now
    try {
      const { api } = await import('@/lib/leadfinder-api');
      const existingSearch = await api.checkExistingSearch(
        businessName,
        extractedLocation.city,
        extractedLocation.state,
        extractedLocation.placeId
      );

      if (existingSearch.found && existingSearch.bestResult) {
        // Show existing search modal - DO NOT show analysis modal
        console.log('🎯 Found existing search - showing modal:', existingSearch);
        setExistingSearchData(existingSearch);
        setShowExistingSearchModal(true);
        setShowModal(false); // Make sure analysis modal is NOT shown
        return; // Stop here - don't proceed to new search
      } else {
        // No existing search, proceed with new search
        console.log('❌ No existing search found - proceeding with new search');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking existing search:', error);
      // Proceed with new search on error
      setShowModal(true);
    }
  };

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusinessName(value);
    
    // Reset validation when user starts typing
    if (value !== businessName) {
      setIsValidBusiness(false);
      setExtractedLocation(null);
      setHasExistingData(false);
      setExistingSearchData(null);
      if (value.trim()) {
        setValidationError('Please select a business from the suggestions');
      } else {
        setValidationError('');
      }
    }
  };

  const handleBusinessInputBlur = () => {
    // Check validation on blur
    if (businessName.trim() && !isValidBusiness) {
      setValidationError('Please select a valid business from the dropdown');
    }
  };

  const handleBusinessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pac = document.querySelector('.pac-container') as HTMLElement | null;
      if (pac && getComputedStyle(pac).display !== 'none') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
    setShowModal(false);
    
    // Auto-scroll to results after a brief delay to allow the modal to close
    setTimeout(() => {
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <>
      <Header />
      
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow bg-gradient-to-b from-gray-900 to-black text-white pt-16">
          
          
          {/* Hero Section */}
          <section className="px-8 pt-12 pb-32">
            <div className="max-w-4xl mx-auto">
              
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500 rounded-full">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-300">Free Instant Analysis - See Any Business Ranking Now</span>
                  <Star className="w-4 h-4 text-purple-400" />
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center text-5xl md:text-7xl font-bold mb-6"
              >
                <span className="text-white">Rank #1 on</span>
                <br />
                <span className="text-6xl md:text-8xl font-black">
                  <span className="bg-gradient-to-r from-purple-400 to-purple-800 bg-clip-text text-transparent" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>Google</span>
                  <span> </span>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-700 bg-clip-text text-transparent" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>Maps</span>
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
              >
                Instantly see where any business ranks against competitors on Google Maps
              </motion.p>

              {/* Search Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-2xl mx-auto mb-20"
              >
                <form onSubmit={handleSearch} className="bg-gray-900 shadow-xl border border-gray-700 rounded-2xl p-8">
                  
                  <div className="space-y-6 mb-6">
                    {/* Business Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Business Name
                      </label>
                      <input
                        ref={businessInputRef}
                        type="text"
                        value={businessName}
                        onChange={handleBusinessInputChange}
                        onBlur={handleBusinessInputBlur}
                        onKeyDown={handleBusinessKeyDown}
                        onFocus={handleBusinessFocus}
                        placeholder="Start typing to search..."
                        className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationError 
                            ? 'border-red-500 focus:border-red-500' 
                            : isValidBusiness 
                              ? 'border-green-500 focus:border-green-500'
                              : 'border-gray-600 focus:border-purple-500'
                        }`}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        name="business"
                        required
                      />
                      {validationError && (
                        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationError}
                        </p>
                      )}
                      {isValidBusiness && extractedLocation && (
                        <>
                          <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Valid business selected - {extractedLocation.city}, {extractedLocation.state}
                          </p>
                          {hasExistingData && existingSearchData && (
                            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                              <p className="text-sm text-blue-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-semibold">Previous data found!</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {existingSearchData.uniqueSearchCount || existingSearchData.searches?.length || 0} previous {(existingSearchData.uniqueSearchCount || existingSearchData.searches?.length) === 1 ? 'search' : 'searches'} • 
                                {existingSearchData.totalCompetitorCount || existingSearchData.bestResult?.competitors?.length || 0} competitors analyzed • 
                                Keywords: {existingSearchData.searchTermsUsed?.join(', ') || 'various'}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Niche Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Search Keyword/Service
                      </label>
                      <input
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder={
                          businessName.toLowerCase().includes('hair') || businessName.toLowerCase().includes('salon')
                            ? "e.g., hair salon, haircut, hair color, barber"
                            : businessName.toLowerCase().includes('dental') || businessName.toLowerCase().includes('dentist')
                            ? "e.g., dentist, dental implants, teeth whitening"
                            : businessName.toLowerCase().includes('law') || businessName.toLowerCase().includes('attorney')
                            ? "e.g., lawyer, attorney, personal injury lawyer"
                            : "e.g., med spa, botox, dental implants"
                        }
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValidBusiness || !businessName.trim()}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      isValidBusiness && businessName.trim()
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-lg hover:shadow-purple-600/25 cursor-pointer'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    style={{ textShadow: isValidBusiness ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}
                  >
                    <Sparkles className={`w-5 h-5 ${isValidBusiness ? 'text-white' : 'text-gray-400'}`} />
                    <span className={isValidBusiness ? 'text-white' : 'text-gray-400'}>
                      {!businessName.trim() ? 'Enter a Business Name' : !isValidBusiness ? 'Select from Dropdown' : 'Get Free Analysis'}
                    </span>
                    <ChevronRight className={`w-5 h-5 ${isValidBusiness ? 'text-white' : 'text-gray-400'}`} />
                  </button>

                  <p className="text-center text-sm text-gray-400 mt-4">
                    No credit card required • Results in 60 seconds
                  </p>
                </form>
              </motion.div>
            </div>
          </section>


          {/* Social Proof Image */}
          {!analysisResults && <SocialProofImage />}
          {/* Results Section */}
          {analysisResults && (
            <div id="results-section">
              <ResultsSectionV2 
                results={analysisResults} 
                businessName={businessName} 
                niche={niche}
                city={extractedLocation?.city}
                state={extractedLocation?.state}
              />
            </div>
          )}

          {/* Features */}
          {!analysisResults && (
            <>
              {/* Spacer between hero and features */}
              <div className="h-24 md:h-32"></div>
              
              <section className="px-8 py-16 md:py-24 bg-gray-900 -mt-16 md:-mt-24">
                <div className="max-w-6xl mx-auto">
                <div className="mb-16">
                  <h2 className="text-4xl font-bold text-center text-white mb-16">
                    What You'll Discover
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-8 mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-lg border border-gray-700"
                  >
                    <Trophy className="w-10 h-10 text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Your Current Rank</h3>
                    <p className="text-gray-400">
                      See exactly where you rank in Google Maps for your keywords
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-lg border border-gray-700"
                  >
                    <Users className="w-10 h-10 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Top Competitors</h3>
                    <p className="text-gray-400">
                      Detailed analysis of who's beating you and why
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-lg border border-gray-700"
                  >
                    <Target className="w-10 h-10 text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">90-Day Plan</h3>
                    <p className="text-gray-400">
                      Step-by-step roadmap to reach the #1 position
                    </p>
                  </motion.div>
                </div>
                
                {/* Customer Journey Bypass Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-16"
                >
                  <h3 className="text-2xl font-bold text-center text-white mb-6">
                    Why You're Losing Customers Right Now
                  </h3>
                  <Image
                    src="/customer-journey-bypass.webp"
                    alt="How customers bypass your business"
                    width={1200}
                    height={1000}
                    loading="lazy"
                    className="rounded-xl shadow-2xl mx-auto w-full h-auto"
                  />
                </motion.div>
                </div>
              </div>
            </section>

            {/* Spacer between sections */}
            <div className="py-12 md:py-20"></div>
            
            {/* Trust Indicators */}
            <section className="relative px-4 py-24 bg-black">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>500+ businesses ranked #1</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Average 3x increase in leads</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>90-day guarantee</span>
                  </span>
                </div>
                <div className="h-24"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
            </section>
            </>
          )}
        </main>

        {/* Analysis Modal */}
        <AnalysisModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          businessName={businessName}
          niche={niche}
          jobId="direct"
          analysisData={extractedLocation ? {
            place_id: extractedLocation.placeId,
            city: extractedLocation.city,
            state: extractedLocation.state,
            formatted_address: extractedLocation.formattedAddress,
            geometry: extractedLocation.geometry
          } : undefined}
          onComplete={handleAnalysisComplete}
        />
        
        {/* Existing Search Modal */}
        <ExistingSearchModal
          isOpen={showExistingSearchModal}
          onClose={() => setShowExistingSearchModal(false)}
          existingSearchData={existingSearchData}
          businessName={businessName}
          niche={niche}
          onRunNewSearch={() => {
            setShowExistingSearchModal(false);
            setShowModal(true);
          }}
          onUseExisting={(data) => {
            setShowExistingSearchModal(false);
            handleAnalysisComplete(data);
          }}
        />

        <Footer />
      </div>
    </>
  );
}