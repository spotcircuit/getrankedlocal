'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, TrendingUp, Sparkles, Star, ChevronRight, Target, Zap, Trophy, Users, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalysisModal from '@/components/AnalysisModal';
import ResultsSectionV2 from '@/components/ResultsSectionV2';

export default function HomePage() {
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [extractedLocation, setExtractedLocation] = useState<any>(null);
  const businessInputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const existing = document.querySelector('script[data-gma="places"]');
      if (existing) return;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.dataset.gma = 'places';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (!businessInputRef.current || !(window as any).google) return;
        
        const autocomplete = new (window as any).google.maps.places.Autocomplete(
          businessInputRef.current,
          {
            types: ['establishment'],
            fields: ['name', 'place_id', 'formatted_address', 'address_components', 'geometry']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place) return;

          // Extract location data
          const components = place.address_components || [];
          let city = '', state = '';
          
          for (const comp of components) {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
          }

          setExtractedLocation({
            placeId: place.place_id,
            name: place.name,
            formattedAddress: place.formatted_address,
            city,
            state,
            geometry: place.geometry
          });

          // Update input with full name and address
          const displayName = place.name + (place.formatted_address ? ', ' + place.formatted_address : '');
          setBusinessName(displayName);
        });
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    // Set default niche if empty
    const searchNiche = niche.trim() || 'med spas';
    setNiche(searchNiche);

    // Open modal immediately
    setShowModal(true);
  };

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
    setShowModal(false);
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
                  
                  <div className="space-y-4 mb-6">
                    {/* Business Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Business Name
                      </label>
                      <input
                        ref={businessInputRef}
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Start typing to search..."
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        required
                      />
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
                        placeholder="e.g., med spa, botox, dental implants"
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-white text-lg transition-all hover:shadow-lg hover:shadow-purple-600/25 flex items-center justify-center gap-2"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                    <span className="text-white">Get Free Analysis</span>
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>

                  <p className="text-center text-sm text-gray-400 mt-4">
                    No credit card required • Results in 60 seconds
                  </p>
                </form>
              </motion.div>
            </div>
          </section>

          {/* Results Section */}
          {analysisResults && (
            <ResultsSectionV2 results={analysisResults} businessName={businessName} niche={niche} />
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
            formatted_address: extractedLocation.formattedAddress
          } : undefined}
          onComplete={handleAnalysisComplete}
        />

        <Footer />
      </div>
    </>
  );
}