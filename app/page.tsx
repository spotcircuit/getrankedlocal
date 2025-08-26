'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  MapPin, TrendingUp, Users, Star, ArrowRight, Search, 
  Building2, Sparkles, Trophy, Shield, Zap, Heart,
  Activity, Stethoscope, Brain, Eye, ChevronRight,
  Clock, DollarSign, Target, CheckCircle
} from 'lucide-react';

interface StateData {
  code: string;
  name: string;
  cities: number;
  businesses: number;
  featured?: boolean;
}

interface FeaturedBusiness {
  name: string;
  city: string;
  state: string;
  niche: string;
  rating: number;
  reviews: number;
  rank: number;
  slug: string;
  specialty?: string;
  bookingsThisWeek?: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [states, setStates] = useState<StateData[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<FeaturedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'medspas' | 'wellness' | 'aesthetics'>('medspas');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/directory');
        const data = await response.json();
        setStates(data.states || []);
        setFeaturedBusinesses(data.featured || []);
      } catch (error) {
        console.error('Error fetching directory data:', error);
        // Demo data with medical focus
        setStates([
          { code: 'TX', name: 'Texas', cities: 45, businesses: 1247, featured: true },
          { code: 'CA', name: 'California', cities: 62, businesses: 2341, featured: true },
          { code: 'FL', name: 'Florida', cities: 38, businesses: 987, featured: true },
          { code: 'NY', name: 'New York', cities: 29, businesses: 1123 },
        ]);
        setFeaturedBusinesses([
          {
            name: 'Auveau Aesthetics & Wellness',
            city: 'West Lake Hills',
            state: 'TX',
            niche: 'medspas',
            rating: 4.9,
            reviews: 312,
            rank: 1,
            slug: 'tx/west-lake-hills/medspas/auveau-aesthetics-wellness-medical-spa-botox-fillers-lasers',
            specialty: 'Botox & Fillers',
            bookingsThisWeek: 47
          },
          {
            name: 'Revive Wellness Center',
            city: 'Austin',
            state: 'TX',
            niche: 'wellness',
            rating: 4.8,
            reviews: 245,
            rank: 1,
            slug: 'tx/austin/wellness/revive-wellness-center',
            specialty: 'IV Therapy & Wellness',
            bookingsThisWeek: 38
          },
          {
            name: 'Luxe Aesthetics',
            city: 'Houston',
            state: 'TX',
            niche: 'aesthetics',
            rating: 4.7,
            reviews: 189,
            rank: 2,
            slug: 'tx/houston/aesthetics/luxe-aesthetics',
            specialty: 'Laser & Body Contouring',
            bookingsThisWeek: 52
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSpecialtyIcon = (niche: string) => {
    switch(niche) {
      case 'medspas': return <Sparkles className="w-5 h-5" />;
      case 'wellness': return <Heart className="w-5 h-5" />;
      case 'aesthetics': return <Eye className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const filteredBusinesses = featuredBusinesses.filter(b => 
    activeTab === 'medspas' ? b.niche === 'medspas' :
    activeTab === 'wellness' ? b.niche === 'wellness' :
    b.niche === 'aesthetics'
  );

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-black text-white">
        {/* New Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full mb-8">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">Trusted by 10,000+ Med Spas</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
                <span className="block">Your Patients</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  Are Searching
                </span>
                <span className="block">Are You #1?</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                90% of patients never scroll past the first 3 results. 
                <span className="text-white font-semibold"> We get med spas there in 90 days.</span>
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/getrankedlocal"
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-xl hover:shadow-purple-500/25 flex items-center gap-2"
                >
                  Get Your Free Analysis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gray-800/50 border border-gray-700 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Find Top Practices
                </button>
              </div>

              {/* Live stats ticker */}
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-gray-400">247 practices analyzing now</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400">Average rank improvement: +8.3</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">Results in 7-14 days</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-black to-gray-900/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why <span className="text-purple-400">Med Spas</span> Choose Us
              </h2>
              <p className="text-xl text-gray-400">
                We speak healthcare. HIPAA-compliant. Results-guaranteed.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="w-8 h-8" />,
                  title: "Hyper-Local Targeting",
                  description: "Dominate 'near me' searches in your exact service radius",
                  stat: "3-mile precision"
                },
                {
                  icon: <DollarSign className="w-8 h-8" />,
                  title: "ROI You Can Measure",
                  description: "Track new patient calls, form fills, and appointment bookings",
                  stat: "$47 return per $1"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Med Spa Marketing Experts",
                  description: "HIPAA-compliant strategies that protect your practice",
                  stat: "500+ med spa clients"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-purple-500/50 transition-all">
                    <div className="text-purple-400 mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400 mb-4">{item.description}</p>
                    <div className="text-sm font-semibold text-green-400">{item.stat}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by State Directory */}
        <section id="search-section" className="py-20 px-4 sm:px-6 bg-gray-900/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-center mb-4">
                Browse Med Spas by Location
              </h2>
              <p className="text-xl text-gray-400 text-center mb-12">
                Explore top-ranked med spas across the United States
              </p>

              {/* Quick Search */}
              <div className="max-w-2xl mx-auto mb-16 relative">
                {/* Soft glow background */}
                <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl" aria-hidden="true" />
                <div className="relative bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-4 shadow-2xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search states or cities (e.g., Texas, TX, Miami)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-black/40 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all text-base shadow-xl"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700 transition-colors"
                        aria-label="Clear search"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {/* Suggestions */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {['California', 'TX', 'New York', 'Miami', 'Phoenix'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSearchQuery(s)}
                        className="px-3 py-1.5 text-xs rounded-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-semibold"
                        type="button"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* States Grid */}
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { code: 'TX', name: 'Texas', clinics: 1247, collections: 15, topCity: 'Houston', growth: '+23%' },
                  { code: 'CA', name: 'California', clinics: 2341, collections: 28, topCity: 'Los Angeles', growth: '+31%' },
                  { code: 'FL', name: 'Florida', clinics: 987, collections: 12, topCity: 'Miami', growth: '+18%' },
                  { code: 'NY', name: 'New York', clinics: 1123, collections: 14, topCity: 'New York City', growth: '+27%' },
                  { code: 'AZ', name: 'Arizona', clinics: 456, collections: 8, topCity: 'Phoenix', growth: '+42%' },
                  { code: 'IL', name: 'Illinois', clinics: 678, collections: 9, topCity: 'Chicago', growth: '+15%' },
                  { code: 'GA', name: 'Georgia', clinics: 543, collections: 7, topCity: 'Atlanta', growth: '+35%' },
                  { code: 'NV', name: 'Nevada', clinics: 234, collections: 4, topCity: 'Las Vegas', growth: '+52%' },
                ].filter(state => 
                  searchQuery === '' || 
                  state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  state.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((state, index) => (
                  <motion.div
                    key={state.code}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link href={`/${state.code.toLowerCase()}`} className="block group">
                      <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
                        {/* State Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                              {state.code}
                            </h3>
                            <p className="text-sm text-gray-400">{state.name}</p>
                          </div>
                          <div className="text-green-400 text-sm font-bold">
                            {state.growth}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Med Spas</span>
                            <span className="text-lg font-bold text-white">{state.clinics.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Collections</span>
                            <span className="text-lg font-bold text-purple-400">{state.collections}</span>
                          </div>
                          <div className="pt-3 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Top City</span>
                              <span className="text-sm text-gray-300">{state.topCity}</span>
                            </div>
                          </div>
                        </div>

                        {/* Hover Action */}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <span className="text-sm text-purple-400 group-hover:text-purple-300 flex items-center gap-2">
                            Explore {state.name}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Featured Collections */}
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-center mb-8">Popular Collections</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'Dallas Top 10', count: 47, state: 'TX', trend: 'Most Competitive' },
                    { name: 'Miami Beach Elite', count: 31, state: 'FL', trend: 'Fastest Growing' },
                    { name: 'Beverly Hills Premium', count: 28, state: 'CA', trend: 'Highest Rated' },
                  ].map((collection, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-bold">{collection.name}</h4>
                        <span className="text-xs px-2 py-1 bg-green-500/20 rounded text-green-400">
                          {collection.trend}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{collection.count} Med Spas</p>
                      <Link 
                        href={`/${collection.state.toLowerCase()}`}
                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                      >
                        View Collection <ArrowRight className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof Banner */}
        <section className="py-12 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: '500+', label: 'Med Spas Ranked' },
                { number: '$2.4M', label: 'Monthly Revenue Generated' },
                { number: '73 Days', label: 'Average Time to #1' },
                { number: '4.9★', label: 'Client Satisfaction' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center"
                >
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                    {stat.number}
                  </div>
                  <div className="mt-1 text-sm text-gray-400 leading-snug whitespace-normal">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual CTA Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* For Medical Practices */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 rounded-2xl p-8">
                  <Stethoscope className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">For Med Spas</h3>
                  <p className="text-gray-400 mb-6">
                    Stop losing patients to competitors. Get your free competitive analysis and custom 90-day roadmap to #1.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'See exactly why competitors outrank you',
                      'Get your custom fix-it roadmap',
                      'HIPAA-compliant strategies',
                      'Results in 7-14 days'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/getrankedlocal"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:scale-105 transition-transform"
                  >
                    Get Free Analysis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* For Patients */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-2xl p-8">
                  <Users className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">For Patients</h3>
                  <p className="text-gray-400 mb-6">
                    Find the best-rated med spas in your area. Real reviews, verified rankings, instant booking.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Top-rated med spas only',
                      'Verified patient reviews',
                      'Compare by specialty',
                      'Book appointments directly'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold hover:scale-105 transition-transform"
                  >
                    Browse Directory
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500 mb-4">Trusted by leading aesthetic centers</p>
              <div className="flex flex-wrap justify-center gap-8 opacity-50">
                {['Auveau Aesthetics', 'Elite Med Spa', 'Radiance Wellness', 'Glow Aesthetics'].map((name, i) => (
                  <div key={i} className="text-gray-400 font-semibold">{name}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}