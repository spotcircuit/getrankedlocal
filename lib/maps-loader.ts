'use client';

export function ensureGoogleMapsLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as any;
  // If already available, resolve immediately
  if (w.google?.maps?.places && w.google?.maps?.marker) return Promise.resolve();
  if (w.google?.maps && typeof w.google.maps.importLibrary === 'function') {
    // Maps core is present; ensure required libraries are loaded
    return w.google.maps
      .importLibrary('places')
      .then(() => w.google.maps.importLibrary('marker'))
      .then(() => {});
  }
  if (w.__gmapsPromise) return w.__gmapsPromise as Promise<void>;

  w.__gmapsPromise = new Promise<void>((resolve, reject) => {
    // Detect any existing Google Maps script regardless of id
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement | null;
    if (existing) {
      const onReady = () => {
        // Ensure both places and marker
        if (w.google?.maps && typeof w.google.maps.importLibrary === 'function') {
          const needPlaces = !w.google.maps.places;
          const needMarker = !(w.google.maps as any).marker;
          if (needPlaces || needMarker) {
            (needPlaces
              ? w.google.maps.importLibrary('places')
              : Promise.resolve()
            )
              .then(() => (needMarker ? w.google.maps.importLibrary('marker') : Promise.resolve()))
              .then(() => resolve())
              .catch(reject);
            return;
          }
        }
        resolve();
      };
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), { once: true });
      // If already loaded, resolve
      if ((existing as any).dataset?.loaded === 'true' || w.google?.maps?.places) resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.onload = () => {
      (script as any).dataset.loaded = 'true';
      // Ensure both places and marker
      if (w.google?.maps && typeof w.google.maps.importLibrary === 'function') {
        w.google.maps
          .importLibrary('places')
          .then(() => w.google.maps.importLibrary('marker'))
          .then(() => resolve())
          .catch(reject);
        return;
      }
      resolve();
    };
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });

  return w.__gmapsPromise as Promise<void>;
}
