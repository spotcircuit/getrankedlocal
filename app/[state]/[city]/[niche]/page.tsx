'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { MapPin, Building2, Star, Phone, Globe, ArrowRight, TrendingUp, Award, Users } from 'lucide-react';

interface BusinessData {
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
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const state = (params?.state || '').toString().toUpperCase();
  const collectionSlug = (params?.city || '').toString();  // This is actually collection
  const nicheSlug = (params?.niche || '').toString();
  
  const collectionName = collectionSlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  const nicheDisplay = nicheSlug === 'medspas' ? 'Medical Spas' :
                       nicheSlug === 'dentists' ? 'Dental Practices' :
                       nicheSlug === 'lawfirms' ? 'Law Firms' :
                       nicheSlug === 'homeservices' ? 'Home Services' :
                       nicheSlug.charAt(0).toUpperCase() + nicheSlug.slice(1);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch(`/api/directory?state=${state}&collection=${collectionName}&niche=${nicheSlug}`);
        const data = await response.json();
        const normalized: BusinessData[] = (data.businesses || []).map((b: any) => ({
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
  }, [state, collectionName, nicheSlug]);

  const breadcrumbs = [
    { label: state, href: `/${state.toLowerCase()}`, icon: MapPin },
    { label: `${collectionName} Collection`, href: `/${state.toLowerCase()}/${collectionSlug}`, icon: Building2 },
    { label: nicheDisplay, href: `/${state.toLowerCase()}/${collectionSlug}/${nicheSlug}`, icon: Users }
  ];

  return (
    <>
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        <div className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {nicheDisplay} - <span className="text-purple-400">{collectionName} Collection</span>
              </h1>
              <p className="text-xl text-gray-300">
                Top-ranked {nicheDisplay.toLowerCase()} in the {collectionName} area, {state}
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
                    href={`/${state.toLowerCase()}/${collectionSlug}/${nicheSlug}/${business.slug}`}
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
                Want to Rank #1 in the {collectionName} Collection?
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