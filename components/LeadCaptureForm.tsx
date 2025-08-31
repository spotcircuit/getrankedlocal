'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, ArrowRight, Sparkles, CheckCircle, Calendar } from 'lucide-react';
import BookingModal from './BookingModal';

interface LeadCaptureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadData) => void;
  title?: string;
  subtitle?: string;
  businessName?: string;
  businessWebsite?: string;
  // Business context for linking
  searchedPlaceId?: string;
  currentRank?: number;
  monthlyLoss?: number;
  topCompetitors?: any[];
  city?: string;
  state?: string;
  niche?: string;
}

export interface LeadData {
  businessName: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  // Business context
  searchedPlaceId?: string;
  currentRank?: number;
  monthlyLoss?: number;
  topCompetitors?: any[];
  city?: string;
  state?: string;
  niche?: string;
}

export default function LeadCaptureForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  title = "Get Your Free Competitive Analysis",
  subtitle = "See exactly how to outrank your competitors",
  businessName = "",
  businessWebsite = "",
  searchedPlaceId,
  currentRank,
  monthlyLoss,
  topCompetitors,
  city,
  state,
  niche
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<LeadData>({
    businessName: businessName || '',
    name: '',
    email: '',
    phone: '',
    website: businessWebsite || '',
    searchedPlaceId,
    currentRank,
    monthlyLoss,
    topCompetitors,
    city,
    state,
    niche
  });
  
  const [errors, setErrors] = useState<Partial<LeadData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prefill business name and website when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        businessName: businessName || prev.businessName || '',
        website: businessWebsite || prev.website || '',
        searchedPlaceId,
        currentRank,
        monthlyLoss,
        topCompetitors,
        city,
        state,
        niche
      }));
    }
  }, [businessName, businessWebsite, isOpen, searchedPlaceId, currentRank, monthlyLoss, topCompetitors, city, state, niche]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen || showBookingModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, showBookingModal]);

  // Ensure portal only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<LeadData> = {};
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Your name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Store lead data
      // Try the enhanced endpoint first with business context
      const enhancedResponse = await fetch('/api/leads/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(() => null);

      // If enhanced endpoint fails, fallback to original endpoint
      if (!enhancedResponse || !enhancedResponse.ok) {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: formData.businessName,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            website: formData.website
          })
        });
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('leadCaptured', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
      
      // Show success message
      setShowSuccess(true);
      setIsSubmitting(false);
      onSubmit(formData);
      
      // Close modal after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !showBookingModal) return null;

  // Show booking modal after success
  if (showBookingModal) {
    return (
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setShowSuccess(false);
          onClose();
        }}
        businessName={businessName || formData.businessName}
        prefillEmail={formData.email}
        prefillPhone={formData.phone}
      />
    );
  }

  const content = (
    <div className="fixed inset-0 overflow-y-auto isolate" role="dialog" aria-modal="true" style={{ zIndex: 2147483647 }}>
      {/* Background overlay */}
      <div className="absolute inset-0 z-0 bg-black/90 backdrop-blur-sm" onClick={!isSubmitting && !showSuccess ? onClose : undefined} />
      
      {/* Modal container - centered and prevents scrolling */}
      <div className="relative z-10 flex items-center justify-center px-4 py-6 sm:py-8" style={{ minHeight: '100dvh' }}>
        <div 
          className="relative z-10 animate-fadeIn overflow-y-auto" 
          style={{ width: '90%', maxWidth: '550px', maxHeight: 'calc(100dvh - 3rem)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative glow effect */}
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
          
          <div className="relative z-10 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
            {/* Top accent bar */}
            <div className={`h-1 bg-gradient-to-r ${showSuccess ? 'from-green-500 to-green-600' : 'from-purple-600 to-blue-600'}`} />
            
            {/* Close button - positioned on the right */}
            {!isSubmitting && !showSuccess && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 rounded-lg p-3 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            )}
            
            {/* Header with icon */}
            <div className="px-8 pt-8 pb-6 text-center">
              {showSuccess ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-xl mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Success! Your Analysis is Being Prepared
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    You'll receive your competitive analysis and custom action plan within 24 hours
                  </p>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-4 py-3 font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Your FREE Strategy Call
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Optional: Book a call to review your personalized roadmap
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl mb-4">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Get Your Free Competitive Analysis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Custom action plan to dominate your local market
                  </p>
                </>
              )}
            </div>
            
            {/* Success content or form */}
            {showSuccess ? (
              <div className="px-8 pb-8">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Your information has been received</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Competitive analysis report in progress</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>You'll be notified via email within 24 hours</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-6 py-3 font-semibold transition-all inline-flex items-center justify-center gap-2 mb-3"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Your FREE Strategy Call
                  </button>
                  <p className="text-xs text-gray-400">
                    Optional: Book a call to review your roadmap
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* What's included */}
                <div className="px-8 pb-6">
                  <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-4 border border-green-800/30">
                    <p className="text-sm font-semibold text-green-400 mb-3">You'll receive:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>Complete competitor analysis report</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>90-day action plan to reach #1</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>Revenue opportunity assessment</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
                  <div>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className={`w-full px-5 py-4 bg-blue-100 border-2 ${
                        errors.businessName ? 'border-red-500' : 'border-blue-300'
                      } rounded-lg focus:border-purple-500 focus:bg-blue-50 focus:outline-none text-gray-900 placeholder-gray-500 text-base font-medium`}
                      placeholder="Your Business Name"
                      disabled={isSubmitting}
                    />
                    {errors.businessName && (
                      <p className="text-red-400 text-xs mt-1">{errors.businessName}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-5 py-4 bg-blue-100 border-2 ${
                        errors.name ? 'border-red-500' : 'border-blue-300'
                      } rounded-lg focus:border-purple-500 focus:bg-blue-50 focus:outline-none text-gray-900 placeholder-gray-500 text-base font-medium`}
                      placeholder="Your Name"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-5 py-4 bg-blue-100 border-2 ${
                        errors.email ? 'border-red-500' : 'border-blue-300'
                      } rounded-lg focus:border-purple-500 focus:bg-blue-50 focus:outline-none text-gray-900 placeholder-gray-500 text-base font-medium`}
                      placeholder="Your Email"
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-5 py-4 bg-blue-100 border-2 ${
                        errors.phone ? 'border-red-500' : 'border-blue-300'
                      } rounded-lg focus:border-purple-500 focus:bg-blue-50 focus:outline-none text-gray-900 placeholder-gray-500 text-base font-medium`}
                      placeholder="Your Phone Number"
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-300 rounded-lg focus:border-purple-500 focus:bg-blue-50 focus:outline-none text-gray-900 placeholder-gray-500 text-base font-medium"
                      placeholder="Website (Optional)"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-white hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Get My Free Analysis
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1 mt-3">
                    <Lock className="w-3 h-3" />
                    Your information is secure and confidential
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}