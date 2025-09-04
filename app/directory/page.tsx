'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DirectorySEO from '@/components/DirectorySEO';
import { JsonLd } from '@/components/JsonLd';
import { 
  MapPin, TrendingUp, Users, Star, ArrowRight, Search, 
  Building2, Sparkles, Trophy, Shield, Zap, Heart,
  Activity, Stethoscope, Brain, Eye, ChevronRight,
  Clock, DollarSign, Target, CheckCircle, Grid3X3, Globe
} from 'lucide-react';


interface Collection {
  collection: string;
  totalBusinesses: number;
  totalLocations: number;
  locationsByState: Record<string, string[]>;
  searchTerms: string[];
}

interface DirectoryStats {
  total_leads: number;
  total_collections: number;
  total_destinations: number;
  total_relationships: number;
}

export default function DirectoryPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<DirectoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/directory/collections');
        const data = await response.json();
        
        if (data.success) {
          setCollections(data.data.collections || []);
          setStats(data.data.stats || null);
        } else {
          console.error('API error:', data.error);
        }
      } catch (error) {
        console.error('Error fetching directory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCollectionIcon = (collectionName: string) => {
    const name = collectionName.toLowerCase();
    if (name.includes('medspa') || name.includes('med spa')) return <Sparkles className="w-6 h-6" />;
    if (name.includes('dental')) return <Heart className="w-6 h-6" />;
    if (name.includes('wellness') || name.includes('health')) return <Activity className="w-6 h-6" />;
    if (name.includes('aesthetic') || name.includes('beauty')) return <Eye className="w-6 h-6" />;
    if (name.includes('medical') || name.includes('clinic')) return <Stethoscope className="w-6 h-6" />;
    if (name.includes('fitness') || name.includes('gym')) return <Zap className="w-6 h-6" />;
    return <Building2 className="w-6 h-6" />;
  };

  const getCollectionColor = (index: number) => {
    const colors = [
      'from-purple-600/20 to-pink-600/20 border-purple-500/30',
      'from-blue-600/20 to-cyan-600/20 border-blue-500/30',
      'from-green-600/20 to-emerald-600/20 border-green-500/30',
      'from-orange-600/20 to-red-600/20 border-orange-500/30',
      'from-indigo-600/20 to-purple-600/20 border-indigo-500/30',
      'from-pink-600/20 to-rose-600/20 border-pink-500/30',
      'from-teal-600/20 to-cyan-600/20 border-teal-500/30',
      'from-amber-600/20 to-yellow-600/20 border-amber-500/30',
      'from-gray-600/20 to-slate-600/20 border-gray-500/30'
    ];
    return colors[index % colors.length];
  };

  const filteredCollections = collections;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'GetLocalRanked Business Directory',
    'description': 'Find top-rated local businesses across multiple industries and locations',
    'url': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory`,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Business Directory',
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory`
      }
    ]
  };

  return (
    <>
      <DirectorySEO 
        collection="directory"
        collectionDisplayName="Business Directory"
        city="United States"
        state="United States"
        stateAbbr="US"
        businessCount={stats?.total_leads || 6511}
        averageRating={4.7}
        totalReviews={25000}
      />
      
      {/* Canonical URL for main directory */}
      <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory`} />
      
      {/* SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="GetLocalRanked" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@getlocalranked" />
      
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbData} />
      
      <Header />
      
      {/* Analysis CTA Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center justify-center gap-3 group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30" />
                <div className="relative bg-white rounded-full p-2">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-lg">Check Where You Stand</p>
                <p className="text-purple-100 text-sm">Free instant analysis - See your Google Maps ranking now</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
      
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow bg-gradient-to-b from-gray-900 to-black text-white pt-16">
        {/* Hero Section */}
        <section className="px-8 pt-12 pb-32">
          
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full mb-6 sm:mb-8">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">
                  {stats ? `${stats.total_leads.toLocaleString()}+ Businesses` : '6,500+ Businesses'} Indexed
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="block">Business Directory</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  Find What's Best
                </span>
                <span className="block">Near You</span>
              </h1>
              
              <p className="text-base sm:text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl mx-auto">
                Discover top-rated businesses across {stats?.total_collections || 9} industries in {stats?.total_destinations || 200}+ locations. 
                <span className="text-white font-semibold"> Real reviews. Verified rankings.</span>
              </p>


              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[
                  { number: stats?.total_collections.toString() || '9', label: 'Industries' },
                  { number: stats?.total_destinations.toString() || '200+', label: 'Cities' },
                  { number: stats?.total_leads.toLocaleString() || '6,511', label: 'Businesses' },
                  { number: '4.7★', label: 'Avg Rating' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Browse by Industry
              </h2>
              <p className="text-lg text-gray-400">
                Explore businesses across different industries and locations
              </p>
            </motion.div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
                    <div className="h-6 w-6 bg-gray-700 rounded mb-4" />
                    <div className="h-6 bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-2/3 mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection, index) => (
                  <motion.div
                    key={collection.collection}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link 
                      href={`/directory/${encodeURIComponent(collection.collection)}`} 
                      className="block group h-full"
                    >
                      <div className="relative bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 h-full flex flex-col">
                        {/* Collection Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
                            {getCollectionIcon(collection.collection)}
                          </div>
                          <div className="text-green-400 text-sm font-bold">
                            {collection.totalBusinesses} businesses
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                          {collection.collection}
                        </h3>

                        <p className="text-gray-400 text-sm mb-4 flex-grow">
                          {collection.totalLocations} locations • {Object.keys(collection.locationsByState).length} states
                        </p>

                        {/* Popular Locations Preview */}
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-gray-500 font-medium">Popular in:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(collection.locationsByState)
                              .slice(0, 3)
                              .map(([state, cities]) => (
                                <span 
                                  key={state}
                                  className="text-xs px-2 py-1 bg-gray-800/50 rounded text-gray-300"
                                >
                                  {state} ({cities.length})
                                </span>
                              ))}
                            {Object.keys(collection.locationsByState).length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-800/50 rounded text-gray-300">
                                +{Object.keys(collection.locationsByState).length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover Action */}
                        <div className="pt-4 border-t border-gray-700">
                          <span className="text-sm text-purple-400 group-hover:text-purple-300 flex items-center gap-2">
                            Explore {collection.collection}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredCollections.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No collections found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </section>

        {/* Value Proposition */}
        <section className="px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why Choose <span className="text-purple-400">Our Directory</span>
              </h2>
              <p className="text-xl text-gray-400">
                Verified data. Real reviews. Trusted rankings.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Verified Listings",
                  description: "All businesses verified through multiple data sources and regular updates",
                  stat: "100% verified"
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: "Real Reviews",
                  description: "Authentic customer reviews from Google, Yelp, and other trusted platforms",
                  stat: "25k+ reviews"
                },
                {
                  icon: <Globe className="w-8 h-8" />,
                  title: "Comprehensive Coverage",
                  description: "Nationwide coverage across multiple industries and service categories",
                  stat: `${stats?.total_destinations || 200}+ cities`
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

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-2xl p-12">
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Own a Business?
                </h3>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Get your free ranking analysis and see where you stand against competitors. 
                  Improve your visibility and attract more customers.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                >
                  Get Free Analysis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        </main>
      </div>
      
      <Footer />
    </>
  );
}