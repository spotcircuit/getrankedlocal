'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { 
  MapPin, Building2, Star, Users, TrendingUp, ArrowRight, Search,
  Sparkles, Heart, Eye, Stethoscope, Activity, Zap, ChevronRight,
  Shield, Award, Clock, Target, CheckCircle, Phone, Globe
} from 'lucide-react';

interface CityData {
  name: string;
  slug: string;
  businessCount: number;
  averageRating: number;
  totalReviews: number;
  topBusinesses: string[];
  growth: string;
  featured?: boolean;
}

interface StateStats {
  totalBusinesses: number;
  totalCities: number;
  averageRating: number;
  totalReviews: number;
  topRatedBusiness: string;
}

export default function ServiceStateDirectoryPage() {
  const params = useParams<{ service: string; state: string }>();
  const [cities, setCities] = useState<CityData[]>([]);
  const [stats, setStats] = useState<StateStats | null>(null);
  const [loading, setLoading] = useState(true);

  const serviceSlug = (params?.service || '').toString();
  const stateCode = (params?.state || '').toString().toUpperCase();
  
  // Service metadata
  const serviceConfig = {
    'medical-spas': {
      name: 'Medical Spas',
      description: 'Advanced aesthetic treatments, Botox, fillers, laser therapy, and cosmetic procedures',
      icon: Sparkles,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      keywords: ['medical spa', 'botox', 'fillers', 'aesthetic', 'cosmetic'],
      searchIntent: 'medical spa treatments'
    },
    'medspas': {
      name: 'Medical Spas',
      description: 'Advanced aesthetic treatments, Botox, fillers, laser therapy, and cosmetic procedures',
      icon: Sparkles,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      keywords: ['medical spa', 'botox', 'fillers', 'aesthetic', 'cosmetic'],
      searchIntent: 'medical spa treatments'
    },
    'wellness-centers': {
      name: 'Wellness Centers', 
      description: 'Holistic health services, IV therapy, wellness treatments, and preventive care',
      icon: Heart,
      color: 'green',
      gradient: 'from-green-600 to-teal-600',
      keywords: ['wellness', 'holistic', 'IV therapy', 'health center'],
      searchIntent: 'wellness and health services'
    },
    'aesthetic-clinics': {
      name: 'Aesthetic Clinics',
      description: 'Laser treatments, body contouring, skin rejuvenation, and beauty procedures',
      icon: Eye,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      keywords: ['aesthetic', 'laser', 'skin care', 'beauty clinic'],
      searchIntent: 'aesthetic and beauty treatments'
    },
    'health-clinics': {
      name: 'Health Clinics',
      description: 'Primary care, preventive medicine, health screenings, and general medical services',
      icon: Stethoscope,
      color: 'emerald',
      gradient: 'from-emerald-600 to-cyan-600',
      keywords: ['health clinic', 'primary care', 'medical care'],
      searchIntent: 'healthcare services'
    },
    'hair-salons': {
      name: 'Hair Salons',
      description: 'Professional hair styling, coloring, treatments, and beauty services',
      icon: Activity,
      color: 'pink',
      gradient: 'from-pink-600 to-rose-600',
      keywords: ['hair salon', 'hair stylist', 'hair color', 'beauty'],
      searchIntent: 'hair salon services'
    },
    'marketing-agencies': {
      name: 'Marketing Agencies',
      description: 'Digital marketing, SEO, social media, and advertising services',
      icon: TrendingUp,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      keywords: ['marketing', 'SEO', 'digital marketing', 'advertising'],
      searchIntent: 'marketing services'
    }
  };

  // Dynamically create service metadata from the slug if not in config
  const service = serviceConfig[serviceSlug as keyof typeof serviceConfig] || {
    name: serviceSlug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: `Professional ${serviceSlug.replace(/-/g, ' ')} services`,
    icon: Building2,
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600',
    keywords: [serviceSlug.replace(/-/g, ' ')],
    searchIntent: `${serviceSlug.replace(/-/g, ' ')} services`
  };

  const ServiceIcon = service.icon;

  // State names mapping
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  const stateName = stateNames[stateCode] || stateCode;

  useEffect(() => {
    const fetchStateData = async () => {
      try {
        const response = await fetch(`/api/directory/services/${serviceSlug}/${stateCode.toLowerCase()}`);
        const data = await response.json();
        
        if (data.success) {
          setCities(data.cities || []);
          setStats(data.stats || null);
        } else {
          // Mock data for development
          const mockCities = stateCode === 'TX' ? [
            { name: 'Houston', slug: 'houston', businessCount: 247, averageRating: 4.8, totalReviews: 3421, topBusinesses: ['Auveau Aesthetics', 'Elite MedSpa', 'Revive Wellness'], growth: '+25%', featured: true },
            { name: 'Dallas', slug: 'dallas', businessCount: 189, averageRating: 4.7, totalReviews: 2845, topBusinesses: ['Luxe Aesthetics', 'Dallas MedSpa', 'Wellness Plus'], growth: '+31%', featured: true },
            { name: 'Austin', slug: 'austin', businessCount: 142, averageRating: 4.9, totalReviews: 2156, topBusinesses: ['Austin Aesthetics', 'Hill Country Wellness', 'Capital MedSpa'], growth: '+18%', featured: true },
            { name: 'San Antonio', slug: 'san-antonio', businessCount: 98, averageRating: 4.6, totalReviews: 1543, topBusinesses: ['Alamo City Spa', 'Riverwalk Wellness'], growth: '+22%' },
            { name: 'Fort Worth', slug: 'fort-worth', businessCount: 76, averageRating: 4.5, totalReviews: 1287, topBusinesses: ['Cowtown MedSpa', 'Trinity Aesthetics'], growth: '+19%' },
            { name: 'Plano', slug: 'plano', businessCount: 54, averageRating: 4.8, totalReviews: 987, topBusinesses: ['North Dallas Spa', 'Plano Wellness'], growth: '+35%' }
          ] : [
            { name: 'Los Angeles', slug: 'los-angeles', businessCount: 387, averageRating: 4.7, totalReviews: 5234, topBusinesses: ['Beverly Hills MedSpa', 'Hollywood Aesthetics'], growth: '+28%', featured: true },
            { name: 'San Francisco', slug: 'san-francisco', businessCount: 156, averageRating: 4.8, totalReviews: 2876, topBusinesses: ['SF Wellness Center', 'Bay Area Spa'], growth: '+22%', featured: true },
            { name: 'San Diego', slug: 'san-diego', businessCount: 134, averageRating: 4.6, totalReviews: 2341, topBusinesses: ['Coastal MedSpa', 'Sunset Wellness'], growth: '+31%', featured: true }
          ];
          
          setCities(mockCities);
          setStats({
            totalBusinesses: mockCities.reduce((sum, city) => sum + city.businessCount, 0),
            totalCities: mockCities.length,
            averageRating: mockCities.reduce((sum, city) => sum + city.averageRating, 0) / mockCities.length,
            totalReviews: mockCities.reduce((sum, city) => sum + city.totalReviews, 0),
            topRatedBusiness: mockCities[0].topBusinesses[0]
          });
        }
      } catch (error) {
        console.error('Error fetching state data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStateData();
  }, [serviceSlug, stateCode]);

  const breadcrumbs = [
    { label: 'Directory', href: '/directory', icon: Building2 },
    { label: service.name, href: `/directory/${serviceSlug}`, icon: ServiceIcon },
    { label: stateName, href: `/directory/${serviceSlug}/${stateCode.toLowerCase()}`, icon: MapPin }
  ];

  const filteredCities = cities;

  const pageTitle = `${service.name} in ${stateName} - Top-Rated Providers by City`;
  const pageDescription = `Find the best ${service.name.toLowerCase()} in ${stateName}. Browse by city to discover top-rated providers with verified reviews and ratings. ${service.description}.`;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory/${serviceSlug}/${stateCode.toLowerCase()}`;

  return (
    <>
      {/* Canonical URL - Service-first pattern is canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />

      {/* Structured Data for State Service Directory */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${service.name} in ${stateName}`,
            description: `Find top-rated ${service.name.toLowerCase()} across ${stateName}`,
            url: canonicalUrl,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: stats?.totalCities || 0,
              itemListElement: cities.slice(0, 10).map((city, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Place',
                  name: `${service.name} in ${city.name}, ${stateName}`,
                  description: `Find top-rated ${service.name.toLowerCase()} in ${city.name}, ${stateName}`,
                  url: `${canonicalUrl}/${city.slug}`
                }
              }))
            }
          })
        }}
      />

      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Directory',
                item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: service.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory/${serviceSlug}`
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: stateName,
                item: canonicalUrl
              }
            ]
          })
        }}
      />

      <Header />
      <Breadcrumbs items={breadcrumbs} />
      
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* State Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full mb-8">
                <MapPin className="w-5 h-5 text-green-400" />
                <span className="text-sm font-semibold text-green-400">
                  {stats?.totalBusinesses.toLocaleString() || '500+'} {service.name} in {stateName}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  {service.name}
                </span>
                <span className="block text-white">in {stateName}</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Browse {service.name.toLowerCase()} by city across {stateName}. Find top-rated providers with verified reviews and comprehensive service information.
              </p>

              {/* Quick Stats Bar */}
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <ServiceIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats?.totalBusinesses.toLocaleString() || '500+'}</div>
                    <div className="text-sm text-gray-400">Total Providers</div>
                  </div>
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats?.totalCities || cities.length}</div>
                    <div className="text-sm text-gray-400">Cities</div>
                  </div>
                  <div className="text-center">
                    <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats?.averageRating.toFixed(1) || '4.7'}</div>
                    <div className="text-sm text-gray-400">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stats?.totalReviews.toLocaleString() || '15k+'}</div>
                    <div className="text-sm text-gray-400">Total Reviews</div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </section>

        {/* Cities Grid */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-700 rounded mb-4" />
                    <div className="h-4 bg-gray-700 rounded mb-2" />
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                    </div>
                    <div className="h-8 bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCities.map((city, index) => (
                  <motion.div
                    key={city.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link href={`/directory/${serviceSlug}/${stateCode.toLowerCase()}/${city.slug}`} className="block group">
                      <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                        
                        {/* Featured Badge */}
                        {city.featured && (
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400 font-semibold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Featured
                            </span>
                          </div>
                        )}

                        {/* City Header */}
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                            {city.name}
                          </h3>
                          <p className="text-sm text-gray-400">{stateName}</p>
                        </div>

                        {/* City Stats */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Providers</span>
                            <span className="text-lg font-bold text-white">{city.businessCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Avg Rating</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-bold text-yellow-400">{city.averageRating.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Reviews</span>
                            <span className="text-sm font-bold text-blue-400">{city.totalReviews.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Top Businesses Preview */}
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Top Providers:</p>
                          <div className="space-y-1">
                            {city.topBusinesses.slice(0, 2).map(business => (
                              <div key={business} className="text-xs text-gray-300 flex items-center gap-1">
                                <div className="w-1 h-1 bg-purple-400 rounded-full" />
                                {business}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Growth Indicator */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs text-gray-500">Growth</span>
                          <span className="text-xs font-bold text-green-400">{city.growth}</span>
                        </div>

                        {/* Call to Action */}
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              View {service.name.toLowerCase()}
                            </span>
                            <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300">
                              <span className="text-sm font-semibold">Explore</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredCities.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No cities found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Own a {service.name.slice(0, -1)} in {stateName}?
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get your free competitive analysis and see exactly how to outrank your competition in local search results.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:scale-105 transition-transform"
              >
                Get Your Free Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}