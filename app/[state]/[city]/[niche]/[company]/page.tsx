'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ComplianceDisclaimer from '@/components/ComplianceDisclaimer';
import Breadcrumbs from '@/components/Breadcrumbs';
import HeroSection from '@/components/HeroSection-improved';
import ProblemSection from '@/components/ProblemSection';
import CompetitorAnalysis from '@/components/CompetitorAnalysis';
import BusinessInsights from '@/components/BusinessInsights';
import ActionPlan from '@/components/ActionPlan';
import SocialProof from '@/components/SocialProof';
import PricingSection from '@/components/PricingSection';
import BookingSection from '@/components/BookingSection';
import CTASection from '@/components/CTASection';
import { BusinessData, AnalysisData } from '@/types';
import { MapPin, Building2, Users, Briefcase } from 'lucide-react';

export default function DynamicFunnelPage() {
  const params = useParams<{ state: string; city: string; niche: string; company: string }>();

  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pitch, setPitch] = useState<any | null>(null);

  // Ensure competitors conform to strict component prop type
  const competitorsSafe = useMemo(() => {
    // Use top_competitors from marketIntel if available (has ratings), otherwise fall back
    const topCompetitors = analysisData?.marketIntel?.top_competitors || [];
    const fallbackList = analysisData?.competitors || [];
    
    // Take first 3 from top_competitors if available
    const list = topCompetitors.length >= 3 ? topCompetitors.slice(0, 3) : fallbackList;
    
    return list.map((c: any, idx: number) => ({
      name: c?.name || 'Top Competitor',
      rank: c?.rank || idx + 1,
      reviews: typeof c?.reviews === 'number' ? c.reviews : Number(c?.reviews) || 0,
      rating: c?.rating != null ? Number(c.rating) : 0,
      advantages: Array.isArray(c?.advantages) ? c.advantages : [],
      city: c?.city,
      website: c?.website,
      phone: c?.phone,
      display_rank: c?.rank || idx + 1,
    }));
  }, [analysisData?.competitors, analysisData?.marketIntel?.top_competitors]);

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

    const state = slugToWords(stRaw).toUpperCase(); // assume state code like 'TX'
    const city = toTitle(slugToWords(cityRaw));
    const niche = normalizeNiche(slugToWords(nicheRaw));
    const company = toTitle(slugToWords(companyRaw));

    const cityWithState = state ? `${city}, ${state}` : city;

    return { state, city, cityWithState, niche, company };
  }, [params]);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const query = new URLSearchParams({
          id: '',
          name: decoded.company,
          // Pass only city name for better DB match (API uses ILIKE %city%)
          city: decoded.city,
          niche: decoded.niche,
          state: decoded.state,
        });
        const response = await fetch(`/api/analyze?${query.toString()}`);
        if (!response.ok) {
          throw new Error(`Analyze API ${response.status}`);
        }
        const data = await response.json();
        if (!data || (data.error && !data.business)) {
          throw new Error(data?.error || 'Invalid analyze payload');
        }
        setBusinessData(data.business);
        setAnalysisData(data.analysis);
        setPitch(data.pitch || null);
      } catch (err) {
        console.error('Error fetching dynamic page data:', err);
        // Fallback demo
        setBusinessData({
          name: decoded.company || 'Your Business',
          rating: 4.2,
          reviewCount: 85,
          city: decoded.city,
          niche: decoded.niche || 'med spas',
        } as BusinessData);
        setAnalysisData({
          currentRank: 7,
          potentialTraffic: '85%',
          lostRevenue: 75000,
          painPoints: [
            { issue: 'Review Deficit', severity: 'high', impact: 'Missing 150+ reviews vs competitors' },
            { issue: 'No AI Optimization', severity: 'critical', impact: 'Invisible to 60% of AI searches' },
          ],
          competitors: [],
          solutions: ['AI-Optimized Content Strategy', 'Review Generation System', 'Technical SEO Overhaul'],
          timeline: '90 days to #1',
          urgency: 'Competitors gaining 10+ reviews monthly',
        } as AnalysisData);
        setPitch(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [decoded.cityWithState, decoded.company, decoded.niche]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Analyzing your competition...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Breadcrumbs items={[
        { label: decoded.state, href: `/${decoded.state.toLowerCase()}`, icon: MapPin },
        { label: decoded.city, href: `/${decoded.state.toLowerCase()}/${params?.city}`, icon: Building2 },
        { label: decoded.niche === "med spas" ? "Medical Spas" : decoded.niche === "law firms" ? "Law Firms" : decoded.niche === "home services" ? "Home Services" : decoded.niche.charAt(0).toUpperCase() + decoded.niche.slice(1), href: `/${decoded.state.toLowerCase()}/${params?.city}/${params?.niche}`, icon: Users },
        { label: businessData?.name || decoded.company, href: "#", icon: Briefcase }
      ]} />
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {!!businessData && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'LocalBusiness',
                  name: businessData.name,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: businessData.city || '',
                    addressRegion: decoded.state || '',
                  },
                  aggregateRating: businessData.rating
                    ? { '@type': 'AggregateRating', ratingValue: businessData.rating, reviewCount: businessData.reviewCount || 0 }
                    : undefined,
                  url: businessData.website || undefined,
                  telephone: businessData.phone || undefined,
                  knowsAbout: [businessData.niche || 'med spas', 'Botox', 'Fillers', 'Laser Hair Removal'],
                }),
              }}
            />
          </>
        )}

        <HeroSection
          businessName={businessData?.name || decoded.company || 'Your Business'}
          currentRank={analysisData?.currentRank ?? undefined}
          potentialTraffic={String(analysisData?.potentialTraffic ?? '85%')}
          competitors={analysisData?.competitors || []}
          niche={businessData?.niche || decoded.niche}
          city={decoded.city}
        />

        <BusinessInsights business={businessData} analysis={analysisData} />

        <CompetitorAnalysis
          competitors={competitorsSafe}
          businessName={businessData?.name || decoded.company || 'Your Business'}
          businessRating={businessData?.rating}
          businessReviews={businessData?.reviewCount}
          currentRank={analysisData?.currentRank ?? undefined}
          businessWebsite={businessData?.website ?? undefined}
          city={decoded.city}
          state={decoded.state}
        />

        <ProblemSection
          painPoints={analysisData?.painPoints || []}
          lostRevenue={analysisData?.lostRevenue || 50000}
          reviewDeficit={analysisData?.reviewDeficit ?? undefined}
        />

        <ActionPlan
          timeline={analysisData?.timeline || '90 days to #1'}
          solutions={analysisData?.solutions || []}
          actionPlan={analysisData?.actionPlan || []}
          businessName={businessData?.name || decoded.company || 'Your Business'}
          businessWebsite={businessData?.website ?? undefined}
          currentRank={analysisData?.currentRank || 9}
        />

        <SocialProof />

        <PricingSection 
          businessName={businessData?.name || decoded.company || 'Your Business'}
          businessWebsite={businessData?.website ?? undefined}
        />

        <BookingSection 
          businessName={businessData?.name || decoded.company || 'Your Business'}
          currentRank={analysisData?.currentRank ?? undefined}
        />

        <CTASection
          businessName={businessData?.name || decoded.company || 'Your Business'}
          businessWebsite={businessData?.website ?? undefined}
          urgency={analysisData?.urgency || 'Competitors are pulling ahead daily'}
        />

        <ComplianceDisclaimer />
        <Footer />
      </main>
    </>
  );
}
