'use client';

import { motion } from 'framer-motion';
import { Flame, Scale, Sprout, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface RankingFactor {
  priority: 'critical' | 'important' | 'growth';
  area: string;
  competitorHas: string;
  whyItHelps: string;
  yourNextMove: string;
}

const rankingFactors: RankingFactor[] = [
  {
    priority: 'critical',
    area: 'Google Reviews',
    competitorHas: 'More reviews, higher average rating (4.7–5.0), steady new reviews monthly',
    whyItHelps: 'Reviews drive Map Pack rankings and clicks',
    yourNextMove: 'Launch a simple "ask-for-review" flow after every visit; aim for +10/month; reply to all reviews'
  },
  {
    priority: 'critical',
    area: 'Google Business Profile (GBP) Basics',
    competitorHas: 'Primary category "Medical Spa" + all relevant services added',
    whyItHelps: 'Improves relevance for "med spa" and service searches',
    yourNextMove: 'Set category to Medical Spa; add Botox, Fillers, Laser Hair Removal, etc. as services with descriptions'
  },
  {
    priority: 'critical',
    area: 'GBP Photos',
    competitorHas: 'Fresh, high-quality photos added weekly (team, rooms, before/after)',
    whyItHelps: 'Signals an active, trusted business; boosts conversion',
    yourNextMove: 'Post 5–10 new photos monthly; use real, well-lit shots; include exterior & team'
  },
  {
    priority: 'critical',
    area: 'Proximity & Coverage',
    competitorHas: 'Location close to dense Dallas searchers; service areas configured',
    whyItHelps: 'Closer businesses often surface first in Maps',
    yourNextMove: 'If far from core Dallas, build Dallas-specific landing pages and strengthen city signals'
  },
  {
    priority: 'critical',
    area: 'On-Page Targeting',
    competitorHas: 'Homepage and "Dallas Med Spa" page optimized with the exact phrase and related terms',
    whyItHelps: 'Confirms to Google "this page answers that query"',
    yourNextMove: 'Create/upgrade a "Med Spa in Dallas, TX" page with clear headline, intro, services, FAQs'
  },
  {
    priority: 'critical',
    area: 'Site Layout for Keywords',
    competitorHas: 'Clear nav: Services (Botox, Filler, Laser, Facial…), each with its own page',
    whyItHelps: 'One focused topic per page ranks better',
    yourNextMove: 'Give every money service its own page targeting [Service] Dallas, TX'
  },
  {
    priority: 'critical',
    area: 'Content Freshness',
    competitorHas: 'Blog/education updated monthly (e.g., "Botox vs. Dysport in Dallas")',
    whyItHelps: 'Fresh content maintains visibility, earns links',
    yourNextMove: 'Publish 1–2 short educational posts/month tied to Dallas'
  },
  {
    priority: 'critical',
    area: 'Structured FAQs',
    competitorHas: 'FAQ sections with simple, scannable answers',
    whyItHelps: 'Matches real questions; can win rich results',
    yourNextMove: 'Add 6–10 FAQs per key page: candid, plain English answers'
  },
  {
    priority: 'critical',
    area: 'Conversion UX',
    competitorHas: 'Prominent "Book Now," phone, and chat on mobile; online booking works',
    whyItHelps: 'Better conversion → better engagement signals',
    yourNextMove: 'Put Book Now top-right + sticky on mobile; ensure 2-click booking'
  },
  {
    priority: 'critical',
    area: 'Page Speed (Mobile)',
    competitorHas: 'Fast pages, compressed images, lightweight code',
    whyItHelps: 'Slow sites bleed visitors and rankings',
    yourNextMove: 'Compress images, lazy-load photos, fix bloated plugins'
  },
  {
    priority: 'critical',
    area: 'E-E-A-T / Trust',
    competitorHas: 'Doctor/NP bios, credentials, real team photos, media mentions',
    whyItHelps: 'Builds medical trust and higher conversions',
    yourNextMove: 'Add provider bios with credentials, headshots, and safety protocols'
  },
  {
    priority: 'important',
    area: 'Local Links',
    competitorHas: 'Mentions from Dallas sites (D Magazine, chambers, neighborhood blogs)',
    whyItHelps: 'Local authority boosts local rank',
    yourNextMove: 'Sponsor a local event; pitch a skincare Q&A to Dallas media; get listed'
  },
  {
    priority: 'important',
    area: 'Citations/NAP',
    competitorHas: 'Consistent name, address, phone across directories (Yelp, Healthgrades, BBB)',
    whyItHelps: 'Confirms business data; reduces confusion',
    yourNextMove: 'Audit top 30 citations; fix mismatches; add missing listings'
  },
  {
    priority: 'important',
    area: 'Social Proof Signals',
    competitorHas: 'Active Instagram/TikTok/Facebook with Dallas hashtags, UGC',
    whyItHelps: 'Not a direct ranking factor, but increases brand searches & clicks',
    yourNextMove: 'Post weekly before/afters (no PHI), reels, staff tips; link back to key pages'
  },
  {
    priority: 'important',
    area: 'GBP Posts & Offers',
    competitorHas: 'Weekly GBP "Updates," offers, events',
    whyItHelps: 'Keeps the profile fresh; boosts engagement',
    yourNextMove: 'Publish a weekly post: promotion, tip, or new service'
  },
  {
    priority: 'important',
    area: 'GBP Q&A',
    competitorHas: 'Common questions asked & answered on the profile',
    whyItHelps: 'Reduces friction; can influence rank/CTR',
    yourNextMove: 'Seed 5–10 real Q&As (pricing ranges, downtime, parking)'
  },
  {
    priority: 'important',
    area: 'Internal Linking',
    competitorHas: 'Service pages interlink (e.g., Botox → Memberships → Financing)',
    whyItHelps: 'Helps users (and Google) find key pages',
    yourNextMove: 'Add 3–5 helpful internal links per page'
  },
  {
    priority: 'important',
    area: 'Dallas Signals On-Site',
    competitorHas: 'Dallas in page titles, H1s, and content (naturally), embedded map & driving directions',
    whyItHelps: 'Strengthens city relevance',
    yourNextMove: 'Add neighborhood call-outs (Uptown, Oak Lawn, Deep Ellum) where relevant'
  },
  {
    priority: 'important',
    area: 'Schema (Structured Data)',
    competitorHas: 'LocalBusiness/MedicalBusiness + FAQ + Review schema',
    whyItHelps: 'Enhances eligibility for rich results',
    yourNextMove: 'Add basic schema via your SEO plugin; keep it simple and accurate'
  },
  {
    priority: 'important',
    area: 'Before/After Galleries',
    competitorHas: 'Real, categorized galleries with short captions',
    whyItHelps: 'High conversion; users spend longer on site',
    yourNextMove: 'Build a lightweight gallery; add 2–3 new cases monthly'
  },
  {
    priority: 'growth',
    area: 'Video',
    competitorHas: 'Short explainer videos embedded (site + GBP)',
    whyItHelps: 'Improves time on page & trust',
    yourNextMove: 'Film 30–60s "what to expect" clips; upload to GBP & pages'
  },
  {
    priority: 'growth',
    area: 'Spammy Competitor Names',
    competitorHas: 'Some competitors have keywords in their business name',
    whyItHelps: 'Can unfairly boost them in Maps',
    yourNextMove: 'If it\'s not their legal name, suggest an edit in Maps'
  },
  {
    priority: 'growth',
    area: 'Accessibility & UX polish',
    competitorHas: 'Readable fonts, contrast, ADA basics',
    whyItHelps: 'Better user engagement & conversions',
    yourNextMove: 'Run an accessibility pass; fix obvious issues'
  }
];

export default function RankingFactorsTable() {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'important':
        return <Scale className="w-5 h-5 text-yellow-500" />;
      case 'growth':
        return <Sprout className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const criticalFactors = rankingFactors.filter(f => f.priority === 'critical');
  const importantFactors = rankingFactors.filter(f => f.priority === 'important');
  const growthFactors = rankingFactors.filter(f => f.priority === 'growth');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="mt-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">
          The <span className="text-red-500">23 Ranking Factors</span> They Have (And You Don't)
        </h3>
        <p className="text-lg text-gray-400">
          Here's exactly what your competitors are doing to dominate Google
        </p>
      </div>

      {/* Priority Legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <span className="text-sm font-semibold text-gray-300">Critical - Fix These First (11)</span>
        </div>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-300">Important - Fix Next (9)</span>
        </div>
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-500" />
          <span className="text-sm font-semibold text-gray-300">Growth - Future Wins (3)</span>
        </div>
      </div>

      {/* Critical Factors - Card Grid */}
      <div className="mb-12">
        <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-500" />
          Critical Factors - Must Fix Now
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {criticalFactors.map((factor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-red-900/20 to-red-950/10 border border-red-500/30 rounded-xl p-5 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start gap-2 mb-3">
                <Flame className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <h5 className="font-bold text-sm text-white leading-tight">{factor.area}</h5>
              </div>
              
              {/* What They Have */}
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">They Have:</p>
                <p className="text-xs text-gray-300 leading-relaxed">{factor.competitorHas}</p>
              </div>
              
              {/* Why It Wins */}
              <div className="mb-3">
                <p className="text-[10px] text-yellow-400 uppercase tracking-wide font-semibold mb-1">Why It Wins:</p>
                <p className="text-xs text-gray-300 leading-relaxed">{factor.whyItHelps}</p>
              </div>
              
              {/* Your Fix */}
              <div className="pt-3 border-t border-red-500/20">
                <p className="text-[10px] text-green-400 uppercase tracking-wide font-semibold mb-1">Your Fix:</p>
                <p className="text-xs text-green-300 leading-relaxed">{factor.yourNextMove}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Important Factors - Card Grid */}
      <div className="mb-12">
        <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Scale className="w-6 h-6 text-yellow-500" />
          Important Factors - Fix Soon
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {importantFactors.map((factor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/10 border border-yellow-500/30 rounded-xl p-5 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start gap-2 mb-3">
                <Scale className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <h5 className="font-bold text-sm text-white leading-tight">{factor.area}</h5>
              </div>
              
              {/* What They Have */}
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">They Have:</p>
                <p className="text-xs text-gray-300 leading-relaxed">{factor.competitorHas}</p>
              </div>
              
              {/* Why It Wins */}
              <div className="mb-3">
                <p className="text-[10px] text-yellow-400 uppercase tracking-wide font-semibold mb-1">Why It Wins:</p>
                <p className="text-xs text-gray-300 leading-relaxed">{factor.whyItHelps}</p>
              </div>
              
              {/* Your Fix */}
              <div className="pt-3 border-t border-yellow-500/20">
                <p className="text-[10px] text-green-400 uppercase tracking-wide font-semibold mb-1">Your Fix:</p>
                <p className="text-xs text-green-300 leading-relaxed">{factor.yourNextMove}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Growth Factors - Horizontal Cards */}
      <div className="mb-12">
        <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sprout className="w-6 h-6 text-green-500" />
          Growth Factors - Future Opportunities
        </h4>
        <div className="space-y-3">
          {growthFactors.map((factor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-green-900/20 to-green-950/10 border border-green-500/30 rounded-xl p-5 hover:border-green-500/50 transition-all"
            >
              <div className="grid md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                  <div className="flex items-start gap-2">
                    <Sprout className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="font-bold text-sm text-white">{factor.area}</span>
                  </div>
                </div>
                <div className="md:col-span-4">
                  <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">What They Have:</p>
                  <p className="text-xs text-gray-300">{factor.competitorHas}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-[10px] text-yellow-400 mb-1 font-semibold uppercase tracking-wide">Why It Wins:</p>
                  <p className="text-xs text-gray-300">{factor.whyItHelps}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-[10px] text-green-400 mb-1 font-semibold uppercase tracking-wide">Your Fix:</p>
                  <p className="text-xs text-green-300">{factor.yourNextMove}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-8 text-center"
      >
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
          onClick={() => {
            const leadForm = document.querySelector('#action-plan');
            if (leadForm) {
              leadForm.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg">
          Get Your Custom Fix Priority Plan →
        </button>
      </motion.div>
    </motion.div>
  );
}