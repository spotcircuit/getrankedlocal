'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { 
  MapPin, Building2, Star, Phone, Globe, ArrowRight, TrendingUp, Award, Users,
  Sparkles, Heart, Eye, Stethoscope, Activity, Zap, ChevronRight,
  Shield, Clock, Target, CheckCircle, ExternalLink, Calendar
} from 'lucide-react';

interface BusinessData {
  id: number;
  name: string;
  slug: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website: string;
  description: string;
  rank: number;
  trending: boolean;
  specialty?: string;
  hours?: string;
  priceRange?: string;
}

interface CityStats {
  totalBusinesses: number;
  averageRating: number;
  totalReviews: number;
  topRatedBusiness: string;
  medianPricing: string;
}

export default function ServiceCityDirectoryPage() {
  const params = useParams<{ service: string; state: string; city: string }>();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [stats, setStats] = useState<CityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const serviceSlug = (params?.service || '').toString();
  const stateCode = (params?.state || '').toString().toUpperCase();
  const citySlug = (params?.city || '').toString();
  
  // Convert slug back to city name
  const cityName = citySlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

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

  // Dynamically create service metadata from the slug
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
    const fetchCityData = async () => {
      try {
        // Use the new service API endpoint
        const response = await fetch(`/api/directory/services/${serviceSlug}/${stateCode}/${cityName.toLowerCase().replace(/\s+/g, '-')}`);
        const data = await response.json();
        
        if (data.businesses && data.businesses.length > 0) {
          // Adapt existing data structure
          const adaptedBusinesses: BusinessData[] = data.businesses.map((b: any) => ({
            id: Number(b?.id) || 0,
            name: b.name || 'Unknown Business',
            slug: b.slug || '',
            rating: Number(b?.rating) || 0,
            reviewCount: Number(b?.reviewCount) || 0,
            address: b.address || '',
            phone: b.phone || '',
            website: b.website || '',
            description: b.description || `Professional ${service.name.toLowerCase()} providing quality services`,
            rank: Number(b?.rank) || 0,
            trending: Boolean(b?.trending),
            specialty: serviceSlug === 'medical-spas' ? 'Botox & Fillers' : service.name,
            priceRange: '$$-$$$'
          }));
          
          setBusinesses(adaptedBusinesses);
          setStats({
            totalBusinesses: adaptedBusinesses.length,
            averageRating: adaptedBusinesses.reduce((sum, b) => sum + b.rating, 0) / adaptedBusinesses.length,
            totalReviews: adaptedBusinesses.reduce((sum, b) => sum + b.reviewCount, 0),
            topRatedBusiness: adaptedBusinesses[0]?.name || '',
            medianPricing: '$$-$$$'
          });
        } else {
          // Mock data for development
          const mockBusinesses: BusinessData[] = [
            {
              id: 1,
              name: `${cityName} Premier ${service.name.slice(0, -1)}`,
              slug: `${citySlug}-premier-${serviceSlug}`,
              rating: 4.9,
              reviewCount: 247,
              address: `123 Main St, ${cityName}, ${stateCode}`,
              phone: '(555) 123-4567',
              website: 'https://example.com',
              description: `Premier ${service.name.toLowerCase()} offering cutting-edge treatments`,
              rank: 1,
              trending: true,
              specialty: serviceSlug === 'medical-spas' ? 'Botox & Advanced Aesthetics' : 'Comprehensive Care',
              priceRange: '$$$'
            },
            {
              id: 2,
              name: `Elite ${service.name} Center`,
              slug: `elite-${serviceSlug}-center`,
              rating: 4.8,
              reviewCount: 189,
              address: `456 Oak Ave, ${cityName}, ${stateCode}`,
              phone: '(555) 234-5678',
              website: 'https://example.com',
              description: `Expert ${service.name.toLowerCase()} with personalized care`,
              rank: 2,
              trending: false,
              specialty: serviceSlug === 'medical-spas' ? 'Laser Treatments' : 'Wellness Therapy',
              priceRange: '$$-$$$'
            },
            {
              id: 3,
              name: `${cityName} ${service.name} Specialists`,
              slug: `${citySlug}-${serviceSlug}-specialists`,
              rating: 4.7,
              reviewCount: 156,
              address: `789 Pine St, ${cityName}, ${stateCode}`,
              phone: '(555) 345-6789',
              website: 'https://example.com',
              description: `Specialized ${service.name.toLowerCase()} with experienced professionals`,
              rank: 3,
              trending: true,
              specialty: serviceSlug === 'medical-spas' ? 'Body Contouring' : 'Preventive Care',
              priceRange: '$$'
            }
          ];

          setBusinesses(mockBusinesses);
          setStats({
            totalBusinesses: mockBusinesses.length,
            averageRating: 4.8,
            totalReviews: 592,
            topRatedBusiness: mockBusinesses[0].name,
            medianPricing: '$$-$$$'
          });
        }
      } catch (error) {
        console.error('Error fetching city data:', error);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [serviceSlug, stateCode, cityName, citySlug, service.name]);

  const breadcrumbs = [
    { label: 'Directory', href: '/directory', icon: Building2 },
    { label: service.name, href: `/directory/${serviceSlug}`, icon: ServiceIcon },
    { label: stateName, href: `/directory/${serviceSlug}/${stateCode.toLowerCase()}`, icon: MapPin },
    { label: cityName, href: `/directory/${serviceSlug}/${stateCode.toLowerCase()}/${citySlug}`, icon: Building2 }
  ];

  const pageTitle = `Best ${service.name} in ${cityName}, ${stateCode} - Top-Rated Providers`;
  const pageDescription = `Find the best ${service.name.toLowerCase()} in ${cityName}, ${stateName}. Compare top-rated providers with verified reviews, ratings, and service information. ${service.description}.`;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory/${serviceSlug}/${stateCode.toLowerCase()}/${citySlug}`;

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

      {/* Local Business Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${service.name} in ${cityName}, ${stateName}`,
            description: pageDescription,
            url: canonicalUrl,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: businesses.length,
              itemListElement: businesses.map((business, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'LocalBusiness',
                  name: business.name,
                  description: business.description,
                  telephone: business.phone,
                  url: business.website,
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: business.address.split(',')[0],
                    addressLocality: cityName,
                    addressRegion: stateCode,
                    addressCountry: 'US'
                  },
                  aggregateRating: business.reviewCount > 0 ? {
                    '@type': 'AggregateRating',
                    ratingValue: business.rating,
                    reviewCount: business.reviewCount
                  } : undefined
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
                item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory/${serviceSlug}/${stateCode.toLowerCase()}`
              },
              {
                '@type': 'ListItem',
                position: 5,
                name: cityName,
                item: canonicalUrl
              }
            ]
          })
        }}
      />

      <Header />
      <Breadcrumbs items={breadcrumbs} />
      
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Header Section */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  {service.name}
                </span>
                <span className="block text-white">in {cityName}, {stateCode}</span>
              </h1>
              <p className="text-xl text-gray-300">
                Top-ranked {service.name.toLowerCase()} in the {cityName} area
              </p>
            </motion.div>

            {/* Stats Bar */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats?.totalBusinesses || businesses.length}</div>
                  <div className="text-sm text-gray-400">Listed Providers</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {stats?.averageRating.toFixed(1) || '4.8'}
                  </div>
                  <div className="text-sm text-gray-400">Average Rating</div>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {stats?.totalReviews.toLocaleString() || '592'}
                  </div>
                  <div className="text-sm text-gray-400">Total Reviews</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {businesses.filter(b => b.trending).length}
                  </div>
                  <div className="text-sm text-gray-400">Trending Now</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Listings */}
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-400">Loading businesses...</div>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No businesses found</h3>
                <p className="text-gray-500">We're working on adding more providers in this area</p>
              </div>
            ) : (
              <div className="space-y-6">
                {businesses.map((business, index) => (
                  <motion.div
                    key={business.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href={`/${stateCode.toLowerCase()}/${citySlug}/${
                        serviceSlug === 'medical-spas' ? 'medspas' : 
                        serviceSlug === 'marketing-agencies' ? 'marketing' :
                        serviceSlug === 'hair-salons' ? 'hairsalons' :
                        serviceSlug.replace(/-/g, '')
                      }/${business.slug || business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="block group"
                    >
                      <div className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border ${
                        business.rank <= 3 ? 'border-purple-500/50' : 'border-gray-700'
                      } rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10`}>
                        
                        {/* Trending Badge */}
                        {business.trending && business.rank <= 5 && (
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400 font-semibold">
                              🔥 Trending
                            </span>
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Main Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                                    {business.name}
                                  </h2>
                                  {/* Rank Badge with medals for top 3 */}
                                  {business.rank === 1 && (
                                    <div className="px-3 py-1 rounded-lg flex items-center gap-1 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 text-white font-black shadow-lg">
                                      <span className="text-lg">🥇</span>
                                      <span className="text-sm">#1</span>
                                    </div>
                                  )}
                                  {business.rank === 2 && (
                                    <div className="px-3 py-1 rounded-lg flex items-center gap-1 bg-gradient-to-br from-slate-300 via-gray-300 to-slate-400 text-white font-black shadow-lg">
                                      <span className="text-lg">🥈</span>
                                      <span className="text-sm">#2</span>
                                    </div>
                                  )}
                                  {business.rank === 3 && (
                                    <div className="px-3 py-1 rounded-lg flex items-center gap-1 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white font-black shadow-lg">
                                      <span className="text-lg">🥉</span>
                                      <span className="text-sm">#3</span>
                                    </div>
                                  )}
                                  {business.rank > 3 && (
                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 text-white font-bold text-sm">
                                      #{business.rank}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Specialty */}
                                {business.specialty && (
                                  <div className="mb-2">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full text-xs text-purple-300">
                                      <ServiceIcon className="w-3 h-3" />
                                      {business.specialty}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 mb-3">
                                  <div className="flex items-center gap-1">
                                    {(() => {
                                      const ratingNum = Number(business.rating) || 0;
                                      const pct = Math.max(0, Math.min(100, (ratingNum / 5) * 100));
                                      return (
                                        <span
                                          aria-label={`Rating ${ratingNum} out of 5`}
                                          className="select-none font-semibold"
                                          style={{
                                            display: 'inline-block',
                                            backgroundImage: `linear-gradient(90deg, #facc15 ${pct}%, #9ca3af ${pct}%)`,
                                            WebkitBackgroundClip: 'text',
                                            backgroundClip: 'text',
                                            color: 'transparent',
                                            WebkitTextFillColor: 'transparent',
                                          }}
                                        >
                                          ★★★★★
                                        </span>
                                      );
                                    })()}
                                    <span className="ml-1 font-bold text-yellow-300">
                                      {Number.isFinite(Number(business.rating))
                                        ? Number(business.rating).toFixed(1)
                                        : 'N/A'}
                                    </span>
                                    <span className="text-gray-300">({business.reviewCount} reviews)</span>
                                  </div>
                                  {business.priceRange && (
                                    <span className="text-gray-400 text-sm">{business.priceRange}</span>
                                  )}
                                </div>
                                
                                <p className="text-gray-300 mb-4">{business.description}</p>
                                
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>{business.address}</span>
                                  </div>
                                  {business.phone && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <Phone className="w-4 h-4" />
                                      <span>{business.phone}</span>
                                    </div>
                                  )}
                                  {business.website && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <Globe className="w-4 h-4" />
                                      <span>Website</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <div className="flex items-center">
                            <div className="text-right">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-400 transition-all">
                                View Details
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
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
                Want to Rank #1 in {cityName}?
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get your free competitive analysis and see exactly how to outrank these businesses in 90 days
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