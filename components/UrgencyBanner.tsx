'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, TrendingDown, Clock, Users, Star, 
  X, ChevronRight, Zap, ArrowDown, ArrowUp 
} from 'lucide-react';

interface UrgencyBannerProps {
  currentRank?: number;
  competitorMovement?: {
    name: string;
    previousRank: number;
    currentRank: number;
    reviewsGained: number;
  }[];
  reviewVelocity?: {
    yourBusiness: number;
    topCompetitor: number;
  };
  timeLimit?: {
    message: string;
    endsAt: Date;
  };
  dismissible?: boolean;
}

export default function UrgencyBanner({
  currentRank = 7,
  competitorMovement = [
    { name: "Elite Med Spa", previousRank: 8, currentRank: 5, reviewsGained: 12 },
    { name: "Luxury Aesthetics", previousRank: 9, currentRank: 6, reviewsGained: 8 }
  ],
  reviewVelocity = {
    yourBusiness: 2,
    topCompetitor: 15
  },
  timeLimit,
  dismissible = true
}: UrgencyBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate time remaining for limited offers
  useEffect(() => {
    if (timeLimit?.endsAt) {
      const timer = setInterval(() => {
        const now = new Date();
        const end = new Date(timeLimit.endsAt);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('Expired');
          clearInterval(timer);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h remaining`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m remaining`);
          } else {
            setTimeRemaining(`${minutes} minutes remaining`);
          }
        }
      }, 60000); // Update every minute
      
      return () => clearInterval(timer);
    }
  }, [timeLimit]);

  // Rotate through different alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedAlert((prev) => (prev + 1) % 3);
    }, 8000); // Change every 8 seconds
    
    return () => clearInterval(interval);
  }, []);

  const competitorsPassed = competitorMovement.filter(c => c.currentRank < currentRank);
  const reviewGap = reviewVelocity.topCompetitor - reviewVelocity.yourBusiness;

  const alerts = [
    {
      type: 'competitor',
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'red',
      message: competitorsPassed.length > 0 
        ? `⚠️ ${competitorsPassed.length} competitor${competitorsPassed.length > 1 ? 's' : ''} passed you this month!`
        : `📈 Your top competitor gained ${reviewVelocity.topCompetitor} reviews last month`,
      detail: competitorsPassed.length > 0
        ? `${competitorsPassed[0].name} jumped from #${competitorsPassed[0].previousRank} to #${competitorsPassed[0].currentRank}`
        : `You only gained ${reviewVelocity.yourBusiness} reviews`
    },
    {
      type: 'review',
      icon: <Star className="w-5 h-5" />,
      color: 'yellow',
      message: `📊 You're losing ${reviewGap} reviews/month to competitors`,
      detail: `At this rate, you'll drop to #${Math.min(currentRank + 2, 20)} in 60 days`
    },
    {
      type: 'urgency',
      icon: <Clock className="w-5 h-5" />,
      color: 'purple',
      message: timeLimit ? `🔥 ${timeLimit.message}` : '⏰ 3 spots left for November onboarding',
      detail: timeRemaining || 'Lock in 2024 pricing before increase'
    }
  ];

  const currentAlert = alerts[selectedAlert];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r ${
          currentAlert.color === 'red' 
            ? 'from-red-900/95 to-orange-900/95' 
            : currentAlert.color === 'yellow'
            ? 'from-yellow-900/95 to-orange-900/95'
            : 'from-purple-900/95 to-blue-900/95'
        } backdrop-blur-sm border-b-2 ${
          currentAlert.color === 'red' 
            ? 'border-red-500' 
            : currentAlert.color === 'yellow'
            ? 'border-yellow-500'
            : 'border-purple-500'
        } shadow-2xl`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Alert Icon */}
              <div className={`p-2 rounded-full ${
                currentAlert.color === 'red' 
                  ? 'bg-red-500' 
                  : currentAlert.color === 'yellow'
                  ? 'bg-yellow-500'
                  : 'bg-purple-500'
              } animate-pulse`}>
                {currentAlert.icon}
              </div>
              
              {/* Alert Message */}
              <div>
                <p className="text-white font-bold text-sm md:text-base">
                  {currentAlert.message}
                </p>
                <p className="text-gray-200 text-xs md:text-sm">
                  {currentAlert.detail}
                </p>
              </div>
            </div>

            {/* CTA and Close */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const section = document.querySelector('#booking-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                Fix This Now
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {dismissible && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5 text-white/70 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-1 mt-2">
            {alerts.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx === selectedAlert 
                    ? currentAlert.color === 'red'
                      ? 'bg-red-400'
                      : currentAlert.color === 'yellow'
                      ? 'bg-yellow-400'
                      : 'bg-purple-400'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating Competitor Alert Component
export function CompetitorAlert({ 
  competitor,
  position = 'bottom-right' 
}: { 
  competitor: any;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Show after 5 seconds on page
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-24 right-6',
    'top-left': 'top-24 left-6'
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className={`fixed ${positionClasses[position]} z-40 max-w-sm`}
      >
        <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-xl p-4 shadow-2xl border border-red-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="font-bold text-white">Competitor Alert</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-white font-semibold">
              {competitor.name} just passed you!
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <ArrowUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-200">
                  Moved to #{competitor.currentRank}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-200">
                  +{competitor.reviewsGained} reviews
                </span>
              </div>
            </div>
            <button className="w-full mt-3 px-4 py-2 bg-white text-red-900 rounded-lg font-bold text-sm hover:bg-gray-100 transition-all">
              See How to Beat Them →
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Limited Time Offer Banner
export function LimitedOfferBanner({ 
  offerText = "50% off setup fee",
  endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
}: {
  offerText?: string;
  endsAt?: Date;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Offer Expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    }, 60000);
    
    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 text-center">
      <p className="font-bold">
        <Zap className="w-4 h-4 inline mr-2" />
        LIMITED TIME: {offerText} - {timeLeft}
        <button className="ml-4 px-3 py-1 bg-white text-green-600 rounded-full text-sm font-bold hover:bg-gray-100">
          Claim Now
        </button>
      </p>
    </div>
  );
}