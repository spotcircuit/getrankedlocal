'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { MapPin, Building2, Sparkles, Star, TrendingUp, Users } from 'lucide-react';

interface NicheData {
  niche: string;
  displayName: string;
  businessCount: number;
  averageRating: number;
  topBusinesses: string[];
  icon: string;
}

export default function CityPage() {
  const params = useParams<{ state: string; city: string }>();
  const [niches, setNiches] = useState<NicheData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const state = (params?.state || '').toString().toUpperCase();
  const collectionSlug = (params?.city || '').toString(); // URL param is still 'city' but it's a collection
  const collectionName = collectionSlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  useEffect(() => {
    const fetchNiches = async () => {
      try {
        const response = await fetch(`/api/directory?state=${state}&collection=${collectionName}`);
        const data = await response.json();
        setNiches(data.niches || []);
      } catch (error) {
        console.error('Error fetching niches:', error);
        setNiches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNiches();
  }, [state, collectionName]);

  const breadcrumbs = [
    { label: state, href: `/${state.toLowerCase()}`, icon: MapPin },
    { label: `${collectionName} Collection`, href: `/${state.toLowerCase()}/${collectionSlug}`, icon: Building2 }
  ];

  return (
    <>
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      {/* Structured Data: Collection (City) with Niches */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${collectionName} Collection`,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${state.toLowerCase()}/${collectionSlug}`,
            hasPart: {
              '@type': 'ItemList',
              numberOfItems: niches.length,
              itemListElement: niches.map((n, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: n.displayName,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${state.toLowerCase()}/${collectionSlug}/${n.niche}`,
              })),
            },
          }),
        }}
      />
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
                name: state,
                item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${state.toLowerCase()}`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: `${collectionName} Collection`,
                item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${state.toLowerCase()}/${collectionSlug}`,
              },
            ],
          }),
        }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        <div className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-purple-400">{collectionName}</span> Collection
              </h1>
              <p className="text-xl text-gray-300">
                Curated med spas from the {collectionName} area in {state}
              </p>
            </div>

            {/* City Stats */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {niches.reduce((sum, n) => sum + n.businessCount, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Businesses</div>
                </div>
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{niches.length}</div>
                  <div className="text-sm text-gray-400">Categories</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {(niches.reduce((sum, n) => sum + n.averageRating, 0) / niches.length || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Avg Rating</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-gray-400">Growth Rate</div>
                </div>
              </div>
            </div>

            {/* Business Categories Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-400">Loading categories...</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {niches.map((niche, index) => (
                  <Link
                    key={index}
                    href={`/${state.toLowerCase()}/${collectionSlug}/${niche.niche}`}
                    className="group"
                  >
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{niche.icon}</span>
                          <div>
                            <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                              {niche.displayName}
                            </h2>
                            <p className="text-sm text-gray-400">
                              {niche.businessCount} businesses
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          <span className="text-lg font-semibold">{niche.averageRating}</span>
                        </div>
                      </div>
                      
                      {/* Top Businesses */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Top Performers</p>
                        <div className="space-y-1">
                          {niche.topBusinesses.map((business, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{idx + 1}.</span>
                              <span className="text-sm text-gray-300">{business}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* View All Link */}
                      <div className="pt-4 border-t border-gray-700">
                        <span className="text-sm text-purple-400 group-hover:text-purple-300 flex items-center gap-2">
                          View {collectionName} {niche.displayName.toLowerCase()} →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Add Your Business</h3>
                <p className="text-sm text-gray-400 mb-4">Get listed and start ranking</p>
                <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">
                  Submit Business →
                </Link>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                <TrendingUp className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Ranking Analysis</h3>
                <p className="text-sm text-gray-400 mb-4">See how you rank locally</p>
                <Link href="#" className="text-green-400 hover:text-green-300 text-sm">
                  Get Free Report →
                </Link>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Premium Listing</h3>
                <p className="text-sm text-gray-400 mb-4">Stand out from competitors</p>
                <Link href="#" className="text-yellow-400 hover:text-yellow-300 text-sm">
                  Learn More →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}