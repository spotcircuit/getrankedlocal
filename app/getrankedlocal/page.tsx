'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import Footer from '@/components/Footer';
import KeyFactors from '@/components/KeyFactors';
import ActionPlan from '@/components/ActionPlan';
import CTASection from '@/components/CTASection';
import ProblemSection from '@/components/ProblemSection';
import LeadCaptureForm from '@/components/LeadCaptureForm';

export default function GetRankedLocal() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('med spas');
  const [showLeadForm, setShowLeadForm] = useState(false);

  const slugify = (s: string, { collapseSpaces = true, removeSpaces = false }: { collapseSpaces?: boolean; removeSpaces?: boolean } = {}) => {
    const base = (s || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s-]/g, '');
    const spaced = collapseSpaces ? base.replace(/\s+/g, ' ').trim() : base.trim();
    if (removeSpaces) return spaced.replace(/\s+/g, '');
    return spaced.replace(/\s+/g, '-');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, show the lead capture modal instead of navigating.
    if (!name.trim()) return;
    setShowLeadForm(true);
  };

  return (
    <>
      <Header />
      <Breadcrumbs
        items={[
          { label: 'Get Ranked Local', href: '/getrankedlocal' },
        ]}
      />
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Premium Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at top, rgba(88,28,135,0.4) 0%, rgba(0,0,0,0) 60%)',
            }}
          />
          <div
            className="max-w-6xl mx-auto px-4 pt-10 sm:pt-12"
            style={{ paddingBottom: '2.5rem' }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight text-center"
            >
              Rank Top 3 in Google Maps
              <span
                className="block bg-clip-text text-transparent tracking-tight"
                style={{
                  backgroundImage: 'linear-gradient(to right, #ffffff, #bfdbfe, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  textShadow: '0 1px 1px rgba(255,255,255,0.45)',
                }}
              >
                for Your City & Niche
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-3 sm:mt-4 text-center text-gray-300 text-base sm:text-lg"
            >
              We execute reviews, GBP optimization, content, and technical SEO to get you into the Local Pack.
            </motion.p>

            {/* Intake Form - premium card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="relative z-10 mx-auto max-w-4xl mt-8 rounded-2xl border p-6 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))',
              }}
            >
              <div className="text-center mb-4">
                <span
                  className="inline-block px-3 py-1 text-xs rounded-full border"
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.20)',
                    borderColor: 'rgba(192, 132, 252, 0.30)',
                    color: '#c084fc',
                  }}
                >
                  Free, no-obligation analysis
                </span>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Business Name"
                  className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-3 border focus:border-purple-500 outline-none text-white placeholder-gray-400"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                  required
                />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g., Dallas, TX)"
                  className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-3 border focus:border-purple-500 outline-none text-white placeholder-gray-400"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                  // Optional while instant analysis is coming soon
                />
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-3 border focus:border-purple-500 outline-none text-white bg-black/40"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                >
                  <option value="med spas">Med Spas</option>
                  <option value="dentists">Dentists</option>
                  <option value="law firms">Law Firms</option>
                  <option value="home services">Home Services</option>
                </select>
                <div className="md:col-span-1 flex">
                  <button
                    type="submit"
                    className="w-full px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold text-sm sm:text-base hover:scale-[1.02] transition-transform"
                  >
                    Get Instant Analysis
                  </button>
                </div>
              </form>
              <p className="text-center text-gray-400 text-xs mt-3">
                Instant analysis is launching soon. Enter your business to get prioritized and receive a manual analysis within 24 hours.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Prominent CTA below hero */}
        <section className="px-4 mt-10">
          <div className="mx-auto max-w-4xl rounded-2xl border border-purple-500/40 bg-gray-900 p-8 text-center shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white">
              Get Listed and Analyzed Now
            </h3>
            <p className="text-gray-200 mb-6 text-base sm:text-lg">
              We’ll prioritize your practice and deliver a manual competitive analysis within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => setShowLeadForm(true)}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 sm:px-10 sm:py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-transform hover:scale-105 shadow-purple-500/30 shadow-lg text-white"
            >
              Start Free Analysis
            </button>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-6xl mx-auto px-4 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <h3 className="font-semibold text-purple-400 mb-1">Review Engine</h3>
              <p className="text-sm text-gray-300">Install a simple post-visit flow to add 10+ reviews/mo and close the review gap.</p>
            </div>
            <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <h3 className="font-semibold text-blue-400 mb-1">GBP that Ranks</h3>
              <p className="text-sm text-gray-300">Categories, services, photos, and posts tuned to your city and services.</p>
            </div>
            <div className="rounded-xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <h3 className="font-semibold text-green-400 mb-1">Local Pages</h3>
              <p className="text-sm text-gray-300">Build city + service pages that capture “near me” searches and convert.</p>
            </div>
          </div>
        </section>

        {/* Problem framing (generic) */}
        <section className="mx-auto max-w-6xl px-4 mt-12">
          <ProblemSection
            painPoints={[
              { issue: 'Low Map Pack visibility', severity: 'high', impact: 'Competitors outrank you in Maps' },
              { issue: 'Review deficit vs. leaders', severity: 'high', impact: 'Fewer clicks and calls' },
              { issue: 'No location-focused pages', severity: 'medium', impact: 'Missed “near me” searches' },
            ]}
            lostRevenue={50000}
          />
        </section>

        {/* Education: what moves the needle */}
        <KeyFactors />

        {/* 90-Day Action Plan */}
        <ActionPlan timeline={'90 days to #1'} />

        {/* Dynamic route takes over rendering; no inline map embed here */}

        {/* Social proof + CTA */}
        <section className="mx-auto max-w-4xl px-4 mt-10">
          <div className="rounded-2xl border p-6 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-center text-gray-300 text-sm">“We went from invisible to top 3 in 90 days. Calls doubled.” — Practice Owner</p>
          </div>
          <CTASection businessName={'Get Ranked Local'} urgency={'Get into the Local Pack in ~90 days'} />
        </section>
      </main>
      {/* Lead capture modal triggered from hero form */}
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={() => setShowLeadForm(false)}
        title="Get Your Free Competitive Analysis"
        subtitle="See exactly how to outrank your competitors"
        businessName={name}
        businessWebsite={''}
      />
      <Footer />
    </>
  );
}
