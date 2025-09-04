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
  Shield, Award, Clock, Target, CheckCircle
} from 'lucide-react';

interface StateData {
  code: string;
  name: string;
  businessCount: number;
  averageRating: number;
  topCities: string[];
  growth: string;
  featured?: boolean;
}

interface ServiceStats {
  totalBusinesses: number;
  totalStates: number;
  totalCities: number;
  averageRating: number;
  totalReviews: number;
}

export default function ServiceDirectoryPage() {
  const params = useParams<{ service: string }>();
  const [states, setStates] = useState<StateData[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Decode the URL parameter to handle encoded characters like %20
  const serviceSlug = decodeURIComponent((params?.service || '').toString());
  
  // Service metadata - handle both URL slugs and database collection names
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
    'dental-practices': {
      name: 'Dental Practices',
      description: 'General dentistry, cosmetic dentistry, orthodontics, and oral surgery services',
      icon: Activity,
      color: 'cyan',
      gradient: 'from-cyan-600 to-blue-600',
      keywords: ['dentist', 'dental', 'orthodontist', 'oral surgery', 'teeth'],
      searchIntent: 'dental services'
    },
    'law-firms': {
      name: 'Law Firms',
      description: 'Legal services, personal injury, family law, criminal defense, and business law',
      icon: Shield,
      color: 'amber',
      gradient: 'from-amber-600 to-orange-600',
      keywords: ['lawyer', 'attorney', 'law firm', 'legal services'],
      searchIntent: 'legal services'
    },
    'marketing-agencies': {
      name: 'Marketing Agencies',
      description: 'Digital marketing, SEO, social media, PPC, and branding services',
      icon: TrendingUp,
      color: 'indigo',
      gradient: 'from-indigo-600 to-purple-600',
      keywords: ['marketing', 'SEO', 'digital marketing', 'advertising'],
      searchIntent: 'marketing services'
    },
    'home-services': {
      name: 'Home Services',
      description: 'Plumbing, HVAC, electrical, roofing, and home improvement services',
      icon: Building2,
      color: 'orange',
      gradient: 'from-orange-600 to-red-600',
      keywords: ['plumber', 'electrician', 'HVAC', 'contractor', 'home repair'],
      searchIntent: 'home services'
    },
    'plumbers': {
      name: 'Plumbers',
      description: 'Plumbing repair, installation, drain cleaning, and emergency plumbing services',
      icon: Building2,
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-600',
      keywords: ['plumber', 'plumbing', 'pipe repair', 'drain cleaning', 'water heater'],
      searchIntent: 'plumbing services'
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

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const response = await fetch(`/api/directory/services/${serviceSlug}`);
        const data = await response.json();
        
        if (data.success) {
          setStates(data.states || []);
          setStats(data.stats || null);
        } else {
          // Mock data for development
          setStates([
            { code: 'TX', name: 'Texas', businessCount: 1247, averageRating: 4.7, topCities: ['Houston', 'Dallas', 'Austin'], growth: '+23%', featured: true },
            { code: 'CA', name: 'California', businessCount: 2341, averageRating: 4.6, topCities: ['Los Angeles', 'San Francisco', 'San Diego'], growth: '+31%', featured: true },
            { code: 'FL', name: 'Florida', businessCount: 987, averageRating: 4.8, topCities: ['Miami', 'Orlando', 'Tampa'], growth: '+18%', featured: true },
            { code: 'NY', name: 'New York', businessCount: 1123, averageRating: 4.5, topCities: ['New York City', 'Buffalo', 'Albany'], growth: '+27%' },
            { code: 'AZ', name: 'Arizona', businessCount: 456, averageRating: 4.6, topCities: ['Phoenix', 'Tucson', 'Mesa'], growth: '+42%' },
            { code: 'IL', name: 'Illinois', businessCount: 678, averageRating: 4.4, topCities: ['Chicago', 'Rockford', 'Peoria'], growth: '+15%' },
          ]);
          setStats({
            totalBusinesses: serviceSlug === 'medical-spas' ? 3247 : 2134,
            totalStates: 50,
            totalCities: 847,
            averageRating: 4.7,
            totalReviews: 45232
          });
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceSlug]);

  const breadcrumbs = [
    { label: 'Directory', href: '/directory', icon: Building2 },
    { label: service.name, href: `/directory/${serviceSlug}`, icon: ServiceIcon }
  ];

  const filteredStates = states;

  const pageTitle = `${service.name} Directory - Find Top-Rated Providers Nationwide`;
  const pageDescription = `Discover top-rated ${service.name.toLowerCase()} across all 50 states. ${service.description}. Verified reviews and rankings.`;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory/${serviceSlug}`;

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
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="GetLocalRanked" />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Structured Data for Service Directory */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${service.name} Directory`,
            description: service.description,
            url: canonicalUrl,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: stats?.totalBusinesses || 0,
              itemListElement: states.slice(0, 10).map((state, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Place',
                  name: `${service.name} in ${state.name}`,
                  description: `Find top-rated ${service.name.toLowerCase()} in ${state.name}`,
                  url: `${canonicalUrl}/${state.code.toLowerCase()}`
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
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full mb-8">
                <ServiceIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm font-semibold text-green-400">
                  {stats?.totalBusinesses.toLocaleString() || '2,500+'} Providers Nationwide
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="block">Find Top-Rated</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  {service.name}
                </span>
                <span className="block">Nationwide</span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
                {service.description}.
                <span className="text-white font-semibold"> Browse by state to find verified providers near you.</span>
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto mb-12">
                {[
                  { number: stats?.totalBusinesses.toLocaleString() || '2,500+', label: 'Providers' },
                  { number: stats?.totalStates.toString() || '50', label: 'States' },
                  { number: stats?.averageRating ? stats.averageRating.toFixed(1) + '★' : '4.7★', label: 'Average Rating' },
                  { number: stats?.totalReviews.toLocaleString() || '45k+', label: 'Total Reviews' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      {stat.number}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </div>
        </section>

        {/* States Directory */}
        <section className="py-20 px-4 sm:px-6 bg-gray-900/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Browse <span className="text-purple-400">{service.name}</span> by State
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Select a state to find top-rated {service.name.toLowerCase()} in your area
              </p>
            </motion.div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
                    <div className="h-8 bg-gray-700 rounded mb-4" />
                    <div className="h-4 bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-2/3 mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStates.map((state, index) => (
                  <motion.div
                    key={state.code}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link href={`/directory/${serviceSlug}/${state.code.toLowerCase()}`} className="block group">
                      <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
                        
                        {/* Featured Badge - positioned to not overlap with growth percentage */}
                        {state.featured && (
                          <div className="absolute top-12 right-4">
                            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400 font-semibold">
                              Popular
                            </span>
                          </div>
                        )}

                        {/* State Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                              {state.name}
                            </h3>
                            <p className="text-sm text-gray-400">{state.code}</p>
                          </div>
                          <div className="text-green-400 text-sm font-bold">
                            {state.growth}
                          </div>
                        </div>

                        {/* State Stats */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Providers</span>
                            <span className="text-lg font-bold text-white">{state.businessCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Avg Rating</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-lg font-bold text-yellow-400">{state.averageRating.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Cities */}
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Top Cities:</p>
                          <div className="flex flex-wrap gap-1">
                            {state.topCities.slice(0, 3).map(city => (
                              <span key={city} className="text-xs px-2 py-1 bg-gray-800/50 rounded text-gray-300">
                                {city}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Call to Action */}
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Find {service.name.toLowerCase()}
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

            {!loading && filteredStates.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No states found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why Choose Our <span className="text-purple-400">{service.name}</span> Directory
              </h2>
              <p className="text-xl text-gray-400">
                Verified providers. Real reviews. Trusted rankings.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Verified Providers",
                  description: `All ${service.name.toLowerCase()} verified through multiple data sources`,
                  stat: "100% verified"
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: "Real Reviews",
                  description: "Authentic patient reviews from Google, Yelp, and other platforms",
                  stat: `${stats?.totalReviews.toLocaleString() || '45k+'} reviews`
                },
                {
                  icon: <Target className="w-8 h-8" />,
                  title: "Local Focus",
                  description: "Find providers in your specific area with local expertise",
                  stat: `${stats?.totalCities || 800}+ cities`
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
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* For Providers */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 rounded-2xl p-8">
                  <ServiceIcon className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">For {service.name}</h3>
                  <p className="text-gray-400 mb-6">
                    Get listed in our directory and improve your local search rankings. Start attracting more patients today.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Free competitive analysis',
                      'Local SEO optimization',
                      'Review management',
                      'Increased visibility'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/"
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
                    Find the best {service.name.toLowerCase()} in your area with verified reviews and easy comparison.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Top-rated providers only',
                      'Verified patient reviews',
                      'Compare services & prices',
                      'Easy appointment booking'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold hover:scale-105 transition-transform"
                  >
                    Find Providers
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}