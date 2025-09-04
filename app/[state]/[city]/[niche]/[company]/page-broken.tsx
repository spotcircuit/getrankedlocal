'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResultsSectionV2 from '@/components/ResultsSectionV2';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function UnifiedDetailsPage() {
  const params = useParams<{ state: string; city: string; niche: string; company: string }>();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Decode URL parameters
  const decoded = useMemo(() => {
    const slugToWords = (s?: string) => decodeURIComponent((s || '').replace(/-/g, ' ')).trim();
    const toTitle = (s: string) => s.replace(/\b\w/g, (m) => m.toUpperCase());
    const normalizeNiche = (n: string) => {
      const t = (n || '').toLowerCase().replace(/\s+/g, '');
      if (t === 'medspas' || t === 'med-spas') return 'med spas';
      if (t === 'lawfirms' || t === 'law-firms') return 'law firms';
      if (t === 'homeservices' || t === 'home-services') return 'home services';
      return n;
    };

    const stRaw = (params?.state || '').toString();
    const cityRaw = (params?.city || '').toString();
    const nicheRaw = (params?.niche || '').toString();
    const companyRaw = (params?.company || '').toString();

    const state = slugToWords(stRaw).toUpperCase();
    const city = toTitle(slugToWords(cityRaw));
    const niche = normalizeNiche(slugToWords(nicheRaw));
    const company = toTitle(slugToWords(companyRaw));

    return { state, city, niche, company };
  }, [params]);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the analyze API which handles everything
        const analyzeUrl = `/api/analyze?name=${encodeURIComponent(decoded.company)}&city=${encodeURIComponent(decoded.city)}&state=${decoded.state}&niche=${encodeURIComponent(decoded.niche)}`;
        
        const analyzeRes = await fetch(analyzeUrl);
        if (!analyzeRes.ok) {
          throw new Error('Failed to fetch business data');
        }
        
        const data = await analyzeRes.json();
        
        if (!data.business) {
          throw new Error('Business not found');
        }
        
        // Structure data to match ResultsSectionV2 expectations
        const formattedResults = {
          business: {
            name: data.business.name || decoded.company,
            rating: data.business.rating,
            review_count: data.business.reviewCount,
            rank: data.analysis?.currentRank || 999,
            website: data.business.website,
            phone: data.business.phone,
            address: data.business.address,
            city: data.business.city || decoded.city,
            state: data.business.state || decoded.state,
            place_id: data.business.place_id,
            total_competitors: data.analysis?.competitors?.length || 0
          },
          competitors: data.analysis?.competitors || [],
          top_competitors: (data.analysis?.competitors || []).slice(0, 3),
          all_competitors: data.analysis?.competitors || [],
          ai_intelligence: data.business.additional_data?.ai_intelligence,
          market_analysis: {
            total_competitors: data.analysis?.competitors?.length || 0,
            in_top_3: (data.analysis?.currentRank || 999) <= 3,
            in_top_10: (data.analysis?.currentRank || 999) <= 10,
            rank_position: data.analysis?.currentRank || 999,
            market_share_position: (data.analysis?.currentRank || 999) <= 3 ? 'Dominant' : 
                                   (data.analysis?.currentRank || 999) <= 10 ? 'Competitive' : 'Needs Improvement'
          },
          analysis: {
            competitors: (data.analysis?.competitors || []).map((c: any) => ({
              name: c.name || c.business_name,
              rank: c.rank || c.local_pack_rank || 999,
              reviews: c.reviews || c.review_count,
              rating: c.rating,
              advantages: [
                ((c.reviews || c.review_count) > (data.business.reviewCount || 0)) ? `${(c.reviews || c.review_count) - (data.business.reviewCount || 0)} more reviews` : null,
                (c.rating > (data.business.rating || 0)) ? `Higher rating (${c.rating})` : null
              ].filter(Boolean)
            }))
          }
        };
        
        setResults(formattedResults);
      } catch (err) {
        console.error('Error fetching business data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load business data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessData();
  }, [decoded, params, searchParams]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading business analysis...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-white mb-4">Business Not Found</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <a href="/" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Return Home
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-gradient-to-b from-gray-900 to-black min-h-screen pt-16">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="text-sm text-gray-400">
            <a href="/" className="hover:text-white">Home</a>
            <span className="mx-2">/</span>
            <a href="/med-spa-directory" className="hover:text-white">Directory</a>
            <span className="mx-2">/</span>
            <a href={`/${params?.state}/${params?.city}/${params?.niche}`} className="hover:text-white">
              {decoded.city}, {decoded.state}
            </a>
            <span className="mx-2">/</span>
            <span className="text-white">{decoded.company}</span>
          </nav>
        </div>
        
        {/* Main Results Section - Using the same component as dynamic search */}
        <ResultsSectionV2
          results={results}
          businessName={decoded.company}
          niche={decoded.niche}
          city={decoded.city}
          state={decoded.state}
        />
      </main>
      <Footer />
    </>
  );
}