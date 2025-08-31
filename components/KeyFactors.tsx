'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Scale, Sprout, ArrowRight, Zap } from 'lucide-react';
import LeadCaptureForm, { LeadData } from './LeadCaptureForm';

type Factor = {
  title: string;
  theyHave: string;
  whyItWins: string;
  yourFix: string;
};

type FactorSection = {
  heading: string;
  icon: React.ReactNode;
  color: string; // tailwind color suffix e.g., 'red', 'yellow'
  factors: Factor[];
};

const critical: FactorSection = {
  heading: 'Critical Factors - Must Fix Now',
  icon: <Flame className="w-5 h-5" />,
  color: 'red',
  factors: [
    {
      title: 'Google Reviews',
      theyHave:
        'More reviews, higher average rating (4.7–5.0), steady new reviews monthly',
      whyItWins: 'Reviews drive Map Pack rankings and clicks',
      yourFix:
        'Automate requests + make it 1-click easy, capture 10+ new reviews/month',
    },
    {
      title: 'Google Business Profile',
      theyHave:
        'Fully filled out, weekly photos, Google Posts monthly, Q&A active',
      whyItWins: 'Higher ranking + profile gets 2x clicks',
      yourFix: 'Overhaul GBP: new photos weekly, AI response management',
    },
    {
      title: 'Response Rate',
      theyHave: 'Replies to reviews < 24hrs, personalized',
      whyItWins: 'Shows engagement; boosts trust',
      yourFix: 'Use AI templates for fast, thoughtful replies',
    },
    {
      title: 'NAP Consistency',
      theyHave: 'Name, Address, Phone identical across 100+ directories',
      whyItWins: 'Google trusts consistent businesses',
      yourFix: 'Citation cleanup service + monitoring',
    },
    {
      title: 'Primary Category',
      theyHave: 'Exact-match category (e.g., "Medical Spa")',
      whyItWins: 'Core ranking signal',
      yourFix: 'Verify and optimize your primary category',
    },
    {
      title: 'Service Keywords in Reviews',
      theyHave: 'Natural mentions of "Botox," "lip filler," etc.',
      whyItWins: "Tells Google what you're known for",
      yourFix: 'Guide happy clients to mention specific treatments',
    },
    {
      title: 'Website Mobile Speed',
      theyHave: 'Loads < 3 seconds on mobile',
      whyItWins: 'Poor speed = lost rankings and customers',
      yourFix: 'Compress images, upgrade hosting, remove bloat',
    },
  ],
};

const getImportantFactors = (city: string): FactorSection => ({
  heading: 'Important Factors - 30-60 Day Fixes',
  icon: <Scale className="w-5 h-5" />,
  color: 'yellow',
  factors: [
    {
      title: 'Local Backlinks',
      theyHave:
        `Featured in ${city || 'local'} magazines, health blogs, chamber listings`,
      whyItWins: 'Authority signals boost both Maps & organic',
      yourFix: 'PR outreach: 3-5 local mentions monthly',
    },
    {
      title: 'Service Pages',
      theyHave:
        'Individual pages for each treatment (Botox, Filler, PDO Threads)',
      whyItWins: 'Captures specific searches',
      yourFix: 'Build 10-15 targeted treatment pages',
    },
    {
      title: 'Fresh Content',
      theyHave: 'Blog posts or updates weekly',
      whyItWins: 'Google favors active sites',
      yourFix: 'Publish 2x/month: tips, FAQs, seasonal specials',
    },
    {
      title: 'Internal Linking',
      theyHave:
        'Service pages interlink (e.g., Botox → Memberships → Financing)',
      whyItWins: 'Helps users (and Google) find key pages',
      yourFix: 'Add 3–5 helpful internal links per page',
    },
    {
      title: 'Local Signals On-Site',
      theyHave:
        `${city || 'City'} in page titles, H1s, and content (naturally), embedded map & driving directions`,
      whyItWins: 'Strengthens city relevance',
      yourFix:
        `Add neighborhood call-outs where relevant to ${city || 'your city'}`,
    },
    {
      title: 'Schema (Structured Data)',
      theyHave: 'LocalBusiness/MedicalBusiness + FAQ + Review schema',
      whyItWins: 'Enhances eligibility for rich results',
      yourFix:
        'Add basic schema via your SEO plugin; keep it simple and accurate',
    },
    {
      title: 'Before/After Galleries',
      theyHave: 'Real, categorized galleries with short captions',
      whyItWins: 'High conversion; users spend longer on site',
      yourFix: 'Build a lightweight gallery; add 2–3 new cases monthly',
    },
  ],
});

const growth: FactorSection = {
  heading: 'Growth Factors - Future Opportunities',
  icon: <Sprout className="w-5 h-5" />,
  color: 'green',
  factors: [
    {
      title: 'Video',
      theyHave: 'Short explainer videos embedded (site + GBP)',
      whyItWins: 'Improves time on page & trust',
      yourFix: 'Film 30–60s "what to expect" clips; upload to GBP & pages',
    },
    {
      title: 'Spammy Competitor Names',
      theyHave: 'Some competitors have keywords in their business name',
      whyItWins: 'Can unfairly boost them in Maps',
      yourFix: "If it's not their legal name, suggest an edit in Maps",
    },
    {
      title: 'Accessibility & UX polish',
      theyHave: 'Readable fonts, contrast, ADA basics',
      whyItWins: 'Better user engagement & conversions',
      yourFix: 'Run an accessibility pass; fix obvious issues',
    },
  ],
};

 

function Card({ factor, color }: { factor: Factor; color: string }) {
  let bgClass = '';
  let borderClass = '';
  let borderTopClass = '';
  
  switch (color) {
    case 'red':
      bgClass = 'bg-gradient-to-br from-red-900/20 to-red-950/10';
      borderClass = 'border border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10';
      borderTopClass = 'border-red-500/20';
      break;
    case 'yellow':
      bgClass = 'bg-gradient-to-br from-yellow-900/20 to-yellow-950/10';
      borderClass = 'border border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10';
      borderTopClass = 'border-yellow-500/20';
      break;
    case 'green':
      bgClass = 'bg-gradient-to-br from-green-900/20 to-green-950/10';
      borderClass = 'border border-green-500/30 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10';
      borderTopClass = 'border-green-500/20';
      break;
    default:
      bgClass = 'bg-gradient-to-br from-gray-900/20 to-gray-950/10';
      borderClass = 'border border-gray-500/30 hover:border-gray-500/50';
      borderTopClass = 'border-gray-500/20';
  }
  
  return (
    <div className={`rounded-xl p-5 transition-all ${bgClass} ${borderClass}`}>
      <h5 className="font-bold text-sm text-white leading-tight mb-3">{factor.title}</h5>
      
      <div className="mb-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">They Have:</p>
        <p className="text-xs text-gray-300 leading-relaxed">{factor.theyHave}</p>
      </div>
      
      <div className="mb-3">
        <p className="text-[10px] text-yellow-400 uppercase tracking-wide font-semibold mb-1">Why It Wins:</p>
        <p className="text-xs text-gray-300 leading-relaxed">{factor.whyItWins}</p>
      </div>
      
      <div className={`pt-3 border-t ${borderTopClass}`}>
        <p className="text-[10px] text-green-400 uppercase tracking-wide font-semibold mb-1">Your Fix:</p>
        <p className="text-xs text-green-300 leading-relaxed">{factor.yourFix}</p>
      </div>
    </div>
  );
}

interface KeyFactorsProps {
  businessName?: string;
  businessWebsite?: string;
  city?: string;
  state?: string;
  onPrimaryClick?: () => void;
}

export default function KeyFactors({ businessName = '', businessWebsite = '', city = '', state = '', onPrimaryClick }: KeyFactorsProps = {}) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasSubmittedForm, setHasSubmittedForm] = useState(false);
  
  useEffect(() => {
    const leadData = localStorage.getItem('leadCaptured');
    if (leadData) {
      setHasSubmittedForm(true);
    }
  }, []);
  
  const handleLeadSubmit = (data: LeadData) => {
    setHasSubmittedForm(true);
    setShowLeadForm(false);
  };
  
  const handleCTAClick = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
      return;
    }
    setShowLeadForm(true);
  };
  
  const important = getImportantFactors(city);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Main Header */}
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">
          The <span className="text-red-500">23 Ranking Factors</span> They Have (And You Don't)
        </h3>
        <p className="text-lg text-gray-400 mb-8">
          Here's exactly what your competitors are doing to dominate Google
        </p>
        
        {/* CTA Button Before Factors */}
        <button 
          onClick={handleCTAClick}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg inline-flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <Zap className="w-5 h-5" />
          Get Your Custom Fix Priority Plan
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Free analysis of your specific gaps
        </p>
      </div>
      
      {/* Critical Factors */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-red-500">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold">{critical.heading}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {critical.factors.map((f, i) => (
            <Card key={i} factor={f} color={critical.color} />
          ))}
        </div>
      </div>
      
      {/* CTA Button in Middle of Factors */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6 text-center my-8">
        <p className="text-lg font-semibold text-white mb-4">
          Stop Losing Customers to These Missing Factors
        </p>
        <button 
          onClick={handleCTAClick}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:scale-105 transition-transform inline-flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Analyze My Gaps Now
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Important Factors */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-yellow-500">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold">{important.heading}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {important.factors.map((f, i) => (
            <Card key={i} factor={f} color={important.color} />
          ))}
        </div>
      </div>
      
      {/* Growth Factors */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-green-500">
            <Sprout className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold">{growth.heading}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {growth.factors.map((f, i) => (
            <Card key={i} factor={f} color={growth.color} />
          ))}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-8 text-center mt-12">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-4xl font-bold text-red-400">11</div>
            <div className="text-sm text-gray-400">Critical Gaps</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-400">9</div>
            <div className="text-sm text-gray-400">Missing Factors</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">90</div>
            <div className="text-sm text-gray-400">Days to #1</div>
          </div>
        </div>
        <p className="text-gray-300 mb-6">
          Your competitors have optimized <span className="text-yellow-400 font-bold">18+ of these factors</span>. 
          You're currently at <span className="text-red-400 font-bold">3-5</span>.
        </p>
        <button 
          onClick={handleCTAClick}
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg inline-flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <Zap className="w-5 h-5" />
          Get Your Custom Fix Priority Plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Lead Capture Modal */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={handleLeadSubmit}
        businessName={businessName}
        businessWebsite={businessWebsite}
      />
    </section>
  );
}