'use client';

import { X, Calendar, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  prefillEmail?: string;
  prefillPhone?: string;
}

export default function BookingModal({ isOpen, onClose, businessName, prefillEmail, prefillPhone }: BookingModalProps) {
  const bookingUrl = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1IGmJmeolvCr-1mAhIcq0FGzQnKFhqk1_CeKr7u7q89Ns6NIGr23udz1ad4RfVRd9CMPbHmlZH';

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="relative animate-fadeIn" 
          style={{ width: '320px', maxWidth: '90vw' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-600 to-blue-600" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 rounded-lg p-2 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl mb-4">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Schedule Your Strategy Call
              </h3>
              <p className="text-sm text-gray-400">
                Let's discuss your path to #1
              </p>
            </div>
            
            <div className="px-6 pb-6">
              <iframe
                src={bookingUrl}
                width="100%"
                height="400"
                frameBorder="0"
                className="rounded-lg"
                title="Schedule Strategy Call"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}