'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { 
  generateCanonicalUrl, 
  generateMetaTags, 
  generateBreadcrumbSchema,
  generateCollectionSchema,
  serviceSlugMap,
  stateNames as stateNameMap,
  serviceMetadata 
} from '@/lib/seo-utils';
import { MapPin, Building2, Star, Phone, Globe, ArrowRight, TrendingUp, Award, Users } from 'lucide-react';

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
}

export default function NichePage() {
  const params = useParams<{ state: string; city: string; niche: string }>();
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const state = (params?.state || '').toString().toUpperCase();
  const citySlug = (params?.city || '').toString();
  const nicheSlug = (params?.niche || '').toString();
  const businessId = searchParams?.get('id');
  
  const cityName = citySlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  // Collection name is the city name for the old API
  const collectionName = cityName;
  
  // Get service metadata - dynamic approach
  const serviceSlug = serviceSlugMap[nicheSlug] || nicheSlug;
  
  // Make service configuration dynamic based on the niche
  const formatServiceName = (slug: string) => {
    return slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const service = (serviceMetadata as any)[serviceSlug] || {
    name: formatServiceName(nicheSlug.replace(/-/g, ' ')),
    shortName: formatServiceName(nicheSlug.replace(/-/g, ' ')),
    description: `Professional ${formatServiceName(nicheSlug)} services in ${cityName}, ${state}`,
    keywords: [nicheSlug.replace(/-/g, ' '), formatServiceName(nicheSlug)],
    schemaType: 'LocalBusiness'
  };
  
  const stateName = stateNameMap[state.toLowerCase()] || state;
  
  // CRITICAL: Generate canonical URL pointing to service-first pattern
  const canonicalUrl = generateCanonicalUrl({
    type: 'service-city',
    state: state.toLowerCase(),
    city: citySlug,
    service: nicheSlug
  });
  
  // Generate SEO meta tags
  const metaTags = generateMetaTags({
    title: `Best ${service.name} in ${cityName}, ${state}`,
    description: `Find the best ${service.name.toLowerCase()} in ${cityName}, ${stateName}. Compare top-rated providers with verified reviews, ratings, and detailed service information. ${service.description}`,
    canonical: canonicalUrl
  });

  useEffect(() => {
    // If there's a business ID in the URL, redirect to the company detail page
    if (businessId) {
      // Find the business to get its slug
      fetch(`/api/directory?state=${state}&collection=${collectionName}&niche=${nicheSlug}`)
        .then(res => res.json())
        .then(data => {
          const business = data.businesses?.find((b: any) => b.id === parseInt(businessId));
          if (business) {
            const businessSlug = business.name.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            window.location.href = `/${state.toLowerCase()}/${citySlug}/${nicheSlug}/${businessSlug}?id=${businessId}`;
          }
        });
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const response = await fetch(`/api/directory?state=${state}&collection=${collectionName}&niche=${nicheSlug}`);
        const data = await response.json();
        const normalized: BusinessData[] = (data.businesses || []).map((b: any) => ({
          id: Number(b?.id),
          ...b,
          rating: Number(b?.rating) || 0,
          reviewCount: Number(b?.reviewCount) || 0,
          rank: Number(b?.rank) || 0,
        }));
        if (process.env.NODE_ENV !== 'production') {
          console.table(
            normalized.slice(0, 10).map(b => ({ name: b.name, rating: b.rating, reviewCount: b.reviewCount }))
          );
        }
        setBusinesses(normalized);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [state, collectionName, nicheSlug, businessId, citySlug]);

  const breadcrumbs = [
    { label: stateName, href: `/${state.toLowerCase()}`, icon: MapPin },
    { label: cityName, href: `/${state.toLowerCase()}/${citySlug}`, icon: Building2 },
    { label: service.name, href: `/${state.toLowerCase()}/${citySlug}/${nicheSlug}`, icon: Users }
  ];

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com' },
    { name: stateName, url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/${state.toLowerCase()}` },
    { name: cityName, url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/${state.toLowerCase()}/${citySlug}` },
    { name: service.name, url: canonicalUrl }
  ]);

  const collectionSchema = generateCollectionSchema({
    name: `${service.name} in ${cityName}, ${stateName}`,
    description: metaTags.description,
    url: canonicalUrl,
    items: businesses.map(b => ({
      name: b.name,
      url: `${canonicalUrl}/${b.slug}`,
      description: b.description,
      rating: b.rating,
      reviewCount: b.reviewCount,
      address: b.address,
      phone: b.phone
    }))
  });

  return (
    <>
      <Head>
        {/* CRITICAL: Canonical URL pointing to service-first pattern */}
        <link rel="canonical" href={canonicalUrl} />
        
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="robots" content="index,follow" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTags.ogTitle} />
        <meta property="og:description" content={metaTags.ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="GetLocalRanked" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTags.twitterTitle} />
        <meta name="twitter:description" content={metaTags.twitterDescription} />
        <meta name="twitter:site" content="@getlocalranked" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content={service.keywords.join(', ')} />
        <meta name="author" content="GetLocalRanked" />
      </Head>
      
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        <div className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {service.name} in <span className="text-purple-400">{cityName}, {state}</span>
              </h1>
              <p className="text-xl text-gray-300">
                Top-ranked {service.name.toLowerCase()} serving {cityName} and surrounding areas
              </p>
            </div>

            {/* Stats Bar */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{businesses.length}</div>
                  <div className="text-sm text-gray-400">Listed Businesses</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {(() => {
                      const rated = businesses.filter(b => b.reviewCount > 0 && b.rating > 0);
                      if (!rated.length) return 'N/A';
                      const totalWeight = rated.reduce((sum, b) => sum + b.reviewCount, 0);
                      const weighted = rated.reduce((sum, b) => sum + b.rating * b.reviewCount, 0) / (totalWeight || 1);
                      const floored = Math.floor(weighted * 100) / 100; // avoid rounding up to 5.00 unless truly 5
                      return floored.toFixed(2);
                    })()}
                  </div>
                  <div className="text-sm text-gray-400">Average Rating</div>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {businesses.reduce((sum, b) => sum + b.reviewCount, 0).toLocaleString()}
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

            {/* Business Listings */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-400">Loading businesses...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {businesses.map((business, index) => (
                  <Link
                    key={index}
                    href={`/${state.toLowerCase()}/${citySlug}/${nicheSlug}/${business.slug}?id=${business.id}`}
                    className="block group"
                  >
                    <div className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border ${
                      business.rank <= 3 ? 'border-purple-500/50' : 'border-gray-700'
                    } rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-[1.02]`}>
                      
                      {/* Trending Badge - only show for some */}
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
                                {/* Rank Badge with medal for top 3 */}
                                {business.rank === 1 && (
                                  <div className="px-3 py-1 rounded-lg flex items-center gap-1 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 text-white font-black shadow-lg drop-shadow">
                                    <span className="text-lg">🥇</span>
                                    <span className="text-sm">#1</span>
                                  </div>
                                )}
                                {business.rank === 2 && (
                                  <div className="px-3 py-1 rounded-lg flex items-center gap-1 bg-gradient-to-br from-slate-300 via-gray-300 to-slate-400 text-white font-black shadow-lg drop-shadow">
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
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 text-white font-bold text-sm drop-shadow">
                                    #{business.rank}
                                  </span>
                                )}
                              </div>
                              
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
                              </div>
                              
                              <p className="text-gray-300 mb-4">{business.description}</p>
                              
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <MapPin className="w-4 h-4" />
                                  <span>{business.address}</span>
                                </div>
                                {business.website && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Globe className="w-4 h-4" />
                                    <span>{business.website}</span>
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
                              View Analysis
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-16 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-8 text-center">
              <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">
                Want to Rank #1 for {service.name} in {cityName}?
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get your free competitive analysis and see exactly how to outrank these businesses in 90 days
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform">
                Get Your Free Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}