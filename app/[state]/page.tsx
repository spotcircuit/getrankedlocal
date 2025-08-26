'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import LeadCaptureForm, { LeadData } from '@/components/LeadCaptureForm';
import { MapPin, Building2, TrendingUp, Users } from 'lucide-react';

interface CollectionData {
  collection: string;
  businessCount: number;
  niche: string;  // Since we only have med spas for now
}

export default function StatePage() {
  const params = useParams<{ state: string }>();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  
  const state = (params?.state || '').toString().toUpperCase();
  const stateName = state; // Could map to full names if needed
  
  const handleLeadSubmit = (data: LeadData) => {
    setShowLeadForm(false);
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-lg z-50';
    successMessage.textContent = 'Thank you! We\'ll send your free analysis within 24 hours.';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 5000);
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`/api/directory?state=${state}`);
        const data = await response.json();
        setCollections(data.collections || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [state]);

  const breadcrumbs = [
    { label: state, href: `/${state.toLowerCase()}`, icon: MapPin }
  ];

  return (
    <>
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      {/* Structured Data: State Collections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Medical Spa Collections - ${stateName}`,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${state.toLowerCase()}`,
            hasPart: {
              '@type': 'ItemList',
              numberOfItems: collections.length,
              itemListElement: collections.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: c.collection,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${state.toLowerCase()}/${c.collection.toLowerCase().replace(/\s+/g, '-')}`,
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
                Medical Spa Collections - <span className="text-purple-400">{stateName}</span>
              </h1>
              <p className="text-xl text-gray-300">
                {collections.length > 0 ? `Browse ${collections.length} curated collection${collections.length > 1 ? 's' : ''} of top-ranked med spas` : 'Collections coming soon'}
              </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <MapPin className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{collections.length}</div>
                <div className="text-sm text-gray-400">Collections</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {collections.reduce((sum, col) => sum + col.businessCount, 0)}
                </div>
                <div className="text-sm text-gray-400">Med Spas</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">Top Rated</div>
                <div className="text-sm text-gray-400">Quality Verified</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">89%</div>
                <div className="text-sm text-gray-400">Avg Growth</div>
              </div>
            </div>

            {/* Collections Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-400">Loading collections...</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection, index) => (
                  <Link
                    key={index}
                    href={`/${state.toLowerCase()}/${collection.collection.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group"
                  >
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                            {collection.collection}
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">
                            {collection.businessCount} med spas
                          </p>
                        </div>
                        <MapPin className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Collection Focus</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 font-semibold">
                            Medical Spas
                          </span>
                          <span className="px-2 py-1 bg-black/50 rounded-full text-xs text-gray-300">
                            Botox & Fillers
                          </span>
                          <span className="px-2 py-1 bg-black/50 rounded-full text-xs text-gray-300">
                            Laser Treatments
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <span className="text-sm text-purple-400 group-hover:text-purple-300 flex items-center gap-2">
                          View {collection.collection} Collection →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-16 text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">
                Is Your Business Listed?
              </h2>
              <p className="text-gray-300 mb-6">
                Get your free ranking analysis and see how you compare to competitors
              </p>
              <button
                onClick={() => setShowLeadForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Get Your Free Analysis
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        title="Get Your Free Ranking Analysis"
        subtitle="See how you compare to competitors in your area"
      />
    </>
  );
}