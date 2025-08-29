'use client';

import { motion } from 'framer-motion';
import { TrendingDown, AlertCircle, Search, ChevronDown } from 'lucide-react';
import type { CompetitorItem as Competitor } from '@/types';
import { useEffect } from 'react';

interface HeroSectionProps {
  businessName: string;
  currentRank?: number;
  potentialTraffic: string;
  competitors?: Competitor[];
  niche?: string;
  city?: string;
  state?: string;
}

export default function HeroSection({ businessName, currentRank, potentialTraffic, competitors, niche, city, state }: HeroSectionProps) {
  // Debug: verify real values are reaching the UI
  useEffect(() => {
    if (Array.isArray(competitors)) {
      // Only log small summary
      // eslint-disable-next-line no-console
      console.log('Hero competitors:', competitors.map(c => ({ name: c.name, rank: c.rank, reviews: c.reviews, rating: c.rating })));
    }
  }, [competitors]);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Aesthetic gradient background (no external assets) */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% 0%, rgba(139, 92, 246, 0.25), transparent 60%), ' +
              'radial-gradient(800px 400px at 10% 20%, rgba(59, 130, 246, 0.25), transparent 60%), ' +
              'radial-gradient(800px 400px at 90% 30%, rgba(244, 63, 94, 0.15), transparent 60%)'
          }}
        />
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background:
              'linear-gradient(120deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.7) 100%)'
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '50px',
            color: '#fca5a5',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(10px)'
          }}>
            <AlertCircle className="w-4 h-4" />
            URGENT: Your Ranking is Costing You Customers
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            textShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          {businessName} is{' '}
          <span style={{
            background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Losing {potentialTraffic}
          </span>{' '}
          of Potential Customers
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: '#e5e7eb',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}
        >
          You're currently ranked{' '}
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontWeight: '700',
            fontSize: '1.25em'
          }}>
            #{typeof currentRank === 'number' ? currentRank : '??'}
          </span>{' '}for {niche || 'your niche'} in {city ? `${city}${state ? `, ${state}` : ''}` : 'your area'}
          <br />
          while your competitors dominate the Top 3
        </motion.p>
        {/* Removed inline competitor text list (cards below show details) */}
        {Array.isArray(competitors) && competitors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '1.75rem'
            }}
          >
            {competitors
              .filter(c => c?.name && c.name !== businessName)
              .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
              .slice(0, 3)
              .map((c, i) => (
                <div
                  key={`${c.name}-${i}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e5e7eb'
                  }}
                >
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ color: '#fbbf24' }}>★ {typeof c.rating === 'number' ? c.rating.toFixed(1) : c.rating}</span>
                  <span style={{ color: '#9ca3af' }}>({c.reviews} reviews)</span>
                </div>
              ))}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            alignItems: 'center',
            marginBottom: '3rem'
          }}
        >
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#9ca3af',
              fontSize: '16px'
            }}>
              <Search className="w-5 h-5" style={{ color: '#fbbf24' }} />
              <span>93% of customers never go past the top 3 results</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#9ca3af',
              fontSize: '16px'
            }}>
              <TrendingDown className="w-5 h-5" style={{ color: '#f87171' }} />
              <span>Many patients now search on AI platforms (ChatGPT, Claude)</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ marginBottom: '2rem' }}
        >
          <button style={{
            padding: '18px 40px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '18px',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transform: 'translateZ(0)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => {
            const competitorSection = document.querySelector('#competitor-analysis');
            if (competitorSection) {
              competitorSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
          }}>
            See Why You're Not Ranking #1
          </button>
          <p style={{
            marginTop: '12px',
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            Free competitive analysis • No credit card required
          </p>
        </motion.div>
        
        {/* Floating competitor badges - IMPROVED */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1 }}
          style={{
            position: 'absolute',
            top: '20%',
            left: '5%',
            display: 'none'
          }}
          className="lg:block"
        >
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '2px solid rgba(34, 197, 94, 0.5)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)',
            transform: 'rotate(-5deg)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <span style={{ color: '#86efac', fontSize: '14px', fontWeight: '600' }}>
              {(() => {
                const top = (competitors || []).slice().sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
                const first = top[0];
                const reviews = first?.reviews ?? '—';
                return `Competitor #1: ${reviews} reviews ⭐`;
              })()}
            </span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '5%',
            display: 'none'
          }}
          className="lg:block"
        >
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '2px solid rgba(251, 191, 36, 0.5)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)',
            transform: 'rotate(3deg)',
            animation: 'float 3s ease-in-out infinite 0.5s'
          }}>
            <span style={{ color: '#fde047', fontSize: '14px', fontWeight: '600' }}>
              You: Only #{currentRank} 😔
            </span>
          </div>
        </motion.div>
      </div>
      
      {/* Improved scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Scroll to see the truth
        </span>
        <div className="animate-bounce">
          <ChevronDown className="w-6 h-6" style={{ color: '#9ca3af' }} />
        </div>
      </motion.div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(-5deg);
          }
          50% {
            transform: translateY(-10px) rotate(-5deg);
          }
        }
      `}</style>
    </section>
  );
}