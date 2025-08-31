'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, X, CheckCircle, ArrowRight, Users, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BookingSectionProps {
  businessName?: string;
  currentRank?: number;
}

export default function BookingSection({ businessName, currentRank }: BookingSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: ''
  });

  // Your Google Calendar booking URL
  const bookingUrl = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1IGmJmeolvCr-1mAhIcq0FGzQnKFhqk1_CeKr7u7q89Ns6NIGr23udz1ad4RfVRd9CMPbHmlZH';

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally submit the form data to your backend
    // For now, we'll just show the booking iframe
    console.log('Form data:', formData);
  };

  return (
    <>
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-black via-purple-900/10 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full text-green-400 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Limited Spots Available
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to <span className="text-green-400">Dominate</span> Your Market?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get your personalized 90-day roadmap to #1. 
              See exactly how we'll get {businessName || 'you'} more customers.
            </p>

            {/* Single CTA Button */}
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-3 mx-auto"
            >
              <Calendar className="w-5 h-5" />
              Book Your Free Strategy Call
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>30-minute call</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>$2,500 value</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No obligation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative bg-gray-900 rounded-2xl border border-gray-700 shadow-xl"
              style={{ width: '90%', maxWidth: '550px' }}
            >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-50 bg-gray-900 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2">Book Your Strategy Call</h3>
              <p className="text-gray-400 mb-6">
                Select a time that works best for you
              </p>

              {/* Calendar Iframe */}
              <div className="bg-white rounded-lg p-1 custom-scrollbar" style={{ height: '600px', overflowY: 'auto' }}>
                <iframe
                  src={bookingUrl}
                  className="w-full h-full rounded"
                  style={{ border: 0, minHeight: '580px', background: 'white' }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                Questions? We'll address them during your strategy call.
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      )}
    </>
  );
}