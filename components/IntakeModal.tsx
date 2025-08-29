"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { business: string; niche: string }) => void;
  initialBusiness?: string;
  initialNiche?: string;
}

export default function IntakeModal({
  isOpen,
  onClose,
  onSubmit,
  initialBusiness = '',
  initialNiche = 'med spas',
}: IntakeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [business, setBusiness] = useState(initialBusiness);
  const [niche, setNiche] = useState(initialNiche);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Prefill when opened
  useEffect(() => {
    if (isOpen) {
      setBusiness(initialBusiness || '');
      setNiche(initialNiche || '');
    }
  }, [isOpen, initialBusiness, initialNiche]);

  // Load Places API (idempotent) and attach autocomplete
  useEffect(() => {
    if (!isOpen) return;
    if (scriptLoadedRef.current) {
      attachAutocomplete();
      return;
    }

    const existing = document.querySelector(
      'script[data-grl=gmp-places]'
    ) as HTMLScriptElement | null;

    const ensureInit = () => {
      scriptLoadedRef.current = true;
      attachAutocomplete();
    };

    if (existing) {
      if ((window as any).google?.maps?.places) {
        ensureInit();
      } else {
        existing.addEventListener('load', ensureInit, { once: true });
      }
      return () => existing.removeEventListener('load', ensureInit);
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.dataset.grl = 'gmp-places';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.addEventListener('load', ensureInit, { once: true });
    document.head.appendChild(script);
    return () => script.removeEventListener('load', ensureInit);
  }, [isOpen]);

  const attachAutocomplete = () => {
    if (!inputRef.current || !(window as any).google?.maps?.places) return;
    const google = (window as any).google as any;
    const ac = new google.maps.places.Autocomplete(inputRef.current!, {
      types: ['establishment'],
      fields: ['name', 'formatted_address', 'place_id', 'website', 'address_components'],
    } as any);
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place) return;
      const full = [place.name, place.formatted_address].filter(Boolean).join(', ');
      setBusiness(full || '');
      if (inputRef.current) inputRef.current.value = full;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!business.trim()) return;
    onSubmit({ business: business.trim(), niche: niche.trim() });
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 overflow-y-auto isolate" role="dialog" aria-modal="true" style={{ zIndex: 2147483647 }}>
      <div className="absolute inset-0 z-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex items-center justify-center px-4 py-6 sm:py-8" style={{ minHeight: '100dvh' }}>
        <div className="relative z-10" style={{ width: '90%', maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
          <div className="relative z-10 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-600 to-blue-600" />
            <button onClick={onClose} className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 rounded-lg p-3 transition-colors z-10" aria-label="Close">
              <X className="w-5 h-5 text-gray-300" />
            </button>
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Start Your Free Analysis</h3>
              <p className="text-sm text-gray-400">Enter your business and niche to get started</p>
            </div>
            <form onSubmit={handleSubmit} className="px-8 pb-8 grid grid-cols-12 gap-3">
              <input
                ref={inputRef}
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Business Name"
                className="w-full rounded-lg px-4 py-3 border focus:border-purple-500 outline-none text-white placeholder-gray-400 bg-black/40 col-span-12 md:col-span-8"
              />
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Niche or keyword"
                className="w-full rounded-lg px-4 py-3 border focus:border-purple-500 outline-none text-white placeholder-gray-400 bg-black/40 col-span-12 md:col-span-4"
              />
              <div className="col-span-12 flex justify-center">
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-transform hover:scale-105 text-white">
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
