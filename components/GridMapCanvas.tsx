'use client';

import { useEffect, useRef, useState } from 'react';
import { milesToMeters, generateGridPoints, calculateZoomLevel } from '@/lib/grid-calculations';
import { ensureGoogleMapsLoaded } from '@/lib/maps-loader';

type LatLng = { lat: number; lng: number };

interface GridMapCanvasProps {
  center: LatLng | null;
  gridSize: number;
  radiusMiles: number; // derived from spacing when using spacing control
  spacingMiles?: number; // optional: explicit spacing control
  searchMode?: 'all' | 'targeted';
  businessName?: string;
  city?: string;
  state?: string;
  onCenterChange?: (center: LatLng) => void;
  renderAsSquares?: boolean;
  showCoverageCircle?: boolean;
  targetBusiness?: {
    name: string;
    lat: number;
    lng: number;
    rating?: number;
    reviews?: number;
    phone?: string;
    address?: string;
  };
}

// Loader is centralized in lib/maps-loader

export default function GridMapCanvas({
  center,
  gridSize,
  radiusMiles,
  spacingMiles,
  searchMode,
  businessName,
  city,
  state,
  onCenterChange,
  renderAsSquares = true,
  showCoverageCircle = false,
  targetBusiness,
}: GridMapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const gridMarkersRef = useRef<any[]>([]);
  const coverageCircleRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);
  const businessMarkerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const dragRafRef = useRef<number | null>(null);
  const handleMarkerRef = useRef<any>(null);
  const [initializing, setInitializing] = useState(false);
  const userZoomRef = useRef<number | null>(null);
  const initAttemptsRef = useRef(0);

  // Init map when we have a center and container
  useEffect(() => {
    if (!center) return;

    let cancelled = false;
    setInitializing(true);

    const init = async () => {
      if (cancelled) return;
      const el = mapRef.current;
      if (!el) {
        setTimeout(init, 50);
        return;
      }
      const rect = el.getBoundingClientRect();
      if ((rect.width === 0 || rect.height === 0) && initAttemptsRef.current < 40) {
        initAttemptsRef.current++;
        setTimeout(init, 50);
        return;
      }
      try {
        await ensureGoogleMapsLoaded();
        try { console.log('[GridMapCanvas] Maps loaded'); } catch {}
      } catch (e) {
        console.error(e);
        setInitializing(false);
        return;
      }

      if (!mapInstanceRef.current) {
        const g = (window as any).google;
        const mapOptions: any = {
          center,
          // Only set initial zoom; do not auto-change later when spacing/grid size changes
          zoom: calculateZoomLevel(radiusMiles),
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };
        const mapId = (process.env.NEXT_PUBLIC_GOOGLE_MAP_ID as any) as string | undefined;
        if (mapId) mapOptions.mapId = mapId;
        mapInstanceRef.current = new g.maps.Map(mapRef.current!, mapOptions);

        // Track user-driven zoom so we never override it later
        mapInstanceRef.current.addListener('zoom_changed', () => {
          try { userZoomRef.current = mapInstanceRef.current.getZoom?.(); } catch {}
        });

        // Draggable center marker (hidden in targeted mode to keep it separate from the business pin)
        const markerLib = ((window as any).google.maps as any).marker;
        const supportsAdvanced = !!markerLib?.AdvancedMarkerElement && !!mapId;
        if (!targetBusiness) {
          if (supportsAdvanced) {
            const pin = new markerLib.PinElement({
              background: '#ef4444',
              borderColor: '#ffffff',
              glyphColor: '#ffffff',
              scale: 1.0,
            });
            centerMarkerRef.current = new markerLib.AdvancedMarkerElement({
              map: mapInstanceRef.current,
              position: center,
              content: pin.element,
              gmpDraggable: true,
              title: searchMode === 'targeted' ? (businessName || 'Target Business') : `${city || ''}${state ? ', ' + state : ''}`,
              zIndex: 900,
            });
            centerMarkerRef.current.addListener('drag', (ev: any) => {
              const ll = ev?.latLng;
              if (!ll || !onCenterChange) return;
              if (dragRafRef.current) return;
              dragRafRef.current = requestAnimationFrame(() => {
                dragRafRef.current = null;
                onCenterChange({ lat: ll.lat(), lng: ll.lng() });
              });
            });
            centerMarkerRef.current.addListener('dragend', (ev: any) => {
              const ll = ev?.latLng;
              if (ll && onCenterChange) onCenterChange({ lat: ll.lat(), lng: ll.lng() });
            });
          } else {
            centerMarkerRef.current = new (window as any).google.maps.Marker({
              position: center,
              map: mapInstanceRef.current,
              draggable: true,
              title: searchMode === 'targeted' ? (businessName || 'Target Business') : `${city || ''}${state ? ', ' + state : ''}`,
            });
            centerMarkerRef.current.addListener('drag', () => {
              const pos = centerMarkerRef.current?.getPosition?.();
              if (!pos || !onCenterChange) return;
              if (dragRafRef.current) return;
              dragRafRef.current = requestAnimationFrame(() => {
                dragRafRef.current = null;
                onCenterChange({ lat: pos.lat(), lng: pos.lng() });
              });
            });
            centerMarkerRef.current.addListener('dragend', () => {
              const pos = centerMarkerRef.current?.getPosition?.();
              if (pos && onCenterChange) onCenterChange({ lat: pos.lat(), lng: pos.lng() });
            });
          }
        }

        // Create a secondary drag handle slightly south of center for easier dragging
        try {
          const milesPerDegreeLat = 69.0;
          const spacing = (typeof spacingMiles === 'number' && spacingMiles > 0)
            ? spacingMiles
            : (radiusMiles * 2) / Math.max(gridSize - 1, 1);
          const handleOffsetMiles = Math.max(spacing * 0.2, 0.1); // 20% of spacing or at least 0.1 mi
          const latOffset = handleOffsetMiles / milesPerDegreeLat; // move slightly south
          const handlePos = { lat: center.lat - latOffset, lng: center.lng };

          // Use classic marker for broad compatibility as the drag handle
          handleMarkerRef.current = new (window as any).google.maps.Marker({
            position: handlePos,
            map: mapInstanceRef.current,
            draggable: true,
            title: 'Drag to move grid',
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#ffffff',
              fillOpacity: 0.95,
              strokeColor: '#111827',
              strokeWeight: 2,
            },
            zIndex: 950,
          });

          handleMarkerRef.current.addListener('drag', () => {
            const pos = handleMarkerRef.current?.getPosition?.();
            if (!pos || !onCenterChange) return;
            const newLat = pos.lat() + latOffset;
            const newLng = pos.lng();
            if (dragRafRef.current) return;
            dragRafRef.current = requestAnimationFrame(() => {
              dragRafRef.current = null;
              onCenterChange({ lat: newLat, lng: newLng });
            });
          });
          handleMarkerRef.current.addListener('dragend', () => {
            const pos = handleMarkerRef.current?.getPosition?.();
            if (!pos || !onCenterChange) return;
            const newLat = pos.lat() + latOffset;
            const newLng = pos.lng();
            onCenterChange({ lat: newLat, lng: newLng });
          });
        } catch {}
      }

      drawOverlays();

      try {
        (window as any).google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
          setInitializing(false);
          try { console.log('[GridMapCanvas] Map idle (ready)'); } catch {}
          try { (window as any).google.maps.event.trigger(mapInstanceRef.current, 'resize'); } catch {}
          try { mapInstanceRef.current.setCenter(center); } catch {}
        });
      } catch {
        setInitializing(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [center]);

  // Update overlays on config changes or visibility toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    drawOverlays();
  }, [gridSize, radiusMiles, center, showCoverageCircle, spacingMiles]);

  // Create/update business marker when targetBusiness changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const g = (window as any).google;
    // Remove marker if no target
    if (!targetBusiness) {
      if (businessMarkerRef.current) {
        businessMarkerRef.current.setMap(null);
        businessMarkerRef.current = null;
      }
      // Recreate center marker if it was hidden before
      if (!centerMarkerRef.current && center) {
        try {
          const markerLib = (g.maps as any).marker;
          const mapId = mapInstanceRef.current?.get('mapId');
          const supportsAdvanced = !!markerLib?.AdvancedMarkerElement && !!mapId;
          if (supportsAdvanced) {
            const pin = new markerLib.PinElement({ background: '#ef4444', borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.0 });
            centerMarkerRef.current = new markerLib.AdvancedMarkerElement({
              map: mapInstanceRef.current,
              position: center,
              content: pin.element,
              gmpDraggable: true,
              zIndex: 900,
            });
          } else {
            centerMarkerRef.current = new g.maps.Marker({ map: mapInstanceRef.current, position: center, draggable: true });
          }
        } catch {}
      }
      return;
    }

    // Ensure marker exists
    if (!businessMarkerRef.current) {
      const markerLib = (g.maps as any).marker;
      const mapId = mapInstanceRef.current?.get('mapId');
      const supportsAdvanced = !!markerLib?.AdvancedMarkerElement && !!mapId;
      if (supportsAdvanced) {
        const pin = new markerLib.PinElement({
          background: '#3b82f6',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
        });
        businessMarkerRef.current = new markerLib.AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat: targetBusiness.lat, lng: targetBusiness.lng },
          content: pin.element,
          title: targetBusiness.name,
          zIndex: 1000,
          gmpDraggable: false,
        });
      } else {
        businessMarkerRef.current = new g.maps.Marker({
          position: { lat: targetBusiness.lat, lng: targetBusiness.lng },
          map: mapInstanceRef.current,
          title: targetBusiness.name,
          zIndex: 1000,
          draggable: false,
        });
      }
      infoWindowRef.current = new g.maps.InfoWindow();
      businessMarkerRef.current.addListener('click', () => {
        const rating = targetBusiness.rating ?? null;
        const reviews = targetBusiness.reviews ?? null;
        const phone = targetBusiness.phone ?? null;
        const addr = targetBusiness.address ?? '';
        const html = `
          <div style="min-width:260px; background:#0b0f1a; color:#fff; border-radius:10px; padding:12px 14px; box-shadow:0 10px 30px rgba(0,0,0,0.4); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;">
            <div style="font-weight:800; font-size:14px; margin-bottom:6px; line-height:1.2; color:#ffffff;">${targetBusiness.name}</div>
            ${addr ? `<div style=\"font-size:12px; color:#9ca3af;\">${addr}</div>` : ''}
            <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
              <div style="font-size:12px; color:#fbbf24;">${rating !== null ? `⭐ ${rating}` : 'No rating'}</div>
              ${reviews !== null ? `<div style=\"font-size:12px; color:#9ca3af;\">(${reviews})</div>` : ''}
            </div>
            ${phone ? `<div style=\"font-size:12px; color:#e5e7eb; margin-top:6px;\">📞 ${phone}</div>` : ''}
          </div>
        `;
        infoWindowRef.current.setContent(html);
        infoWindowRef.current.open({ map: mapInstanceRef.current, anchor: businessMarkerRef.current });
      });
    } else {
      businessMarkerRef.current.setPosition({ lat: targetBusiness.lat, lng: targetBusiness.lng });
      businessMarkerRef.current.setTitle(targetBusiness.name);
    }
    // Hide the center marker in targeted mode so only the drag handle moves the grid
    if (centerMarkerRef.current) {
      try { centerMarkerRef.current.setMap && centerMarkerRef.current.setMap(null); } catch {}
      centerMarkerRef.current = null;
    }
  }, [targetBusiness]);

  const drawOverlays = () => {
    if (!mapInstanceRef.current || !center) return;

    // Clear old markers
    gridMarkersRef.current.forEach((m) => m.setMap && m.setMap(null));
    gridMarkersRef.current = [];
    if (coverageCircleRef.current) {
      coverageCircleRef.current.setMap(null);
      coverageCircleRef.current = null;
    }

    // Optional true circle boundary that matches the configured radius
    if (showCoverageCircle) {
      coverageCircleRef.current = new (window as any).google.maps.Circle({
        center,
        radius: milesToMeters(radiusMiles),
        map: mapInstanceRef.current,
        fillOpacity: 0.06,
        fillColor: '#7c3aed',
        strokeColor: '#7c3aed',
        strokeOpacity: 0.6,
        strokeWeight: 1.2,
        clickable: false,
      });
    }

    // Grid points
    const points = generateGridPoints(center.lat, center.lng, radiusMiles, gridSize);
    try { console.log('[GridMapCanvas] Drawing grid', { count: points.length, gridSize, radiusMiles, center }); } catch {}

    if (renderAsSquares) {
      // Compute spacing in degrees based on either provided spacing or from radius/grid size
      const spacing = spacingMiles && spacingMiles > 0
        ? spacingMiles
        : (radiusMiles * 2) / Math.max(gridSize - 1, 1);
      const milesPerDegreeLat = 69.0;
      const milesPerDegreeLng = Math.cos((center.lat * Math.PI) / 180) * 69.0;
      const latHalf = (spacing / milesPerDegreeLat) / 2;
      const lngHalf = (spacing / milesPerDegreeLng) / 2;

      const milesPerDegreeLat_local = 69.0;
      const milesPerDegreeLng_local = Math.cos((center.lat * Math.PI) / 180) * 69.0;
      points.forEach((p) => {
        // Clip to true radius so squares outside the circle are not rendered
        const dLatMi = (p.lat - center.lat) * milesPerDegreeLat_local;
        const dLngMi = (p.lng - center.lng) * milesPerDegreeLng_local;
        const distMi = Math.sqrt(dLatMi * dLatMi + dLngMi * dLngMi);
        if (distMi > radiusMiles) return;
        const rect = new (window as any).google.maps.Rectangle({
          bounds: {
            north: p.lat + latHalf,
            south: p.lat - latHalf,
            east: p.lng + lngHalf,
            west: p.lng - lngHalf,
          },
          fillColor: '#10b981',
          fillOpacity: 0.45,
          strokeColor: '#0ea5e9',
          strokeOpacity: 0.5,
          strokeWeight: 0.5,
          clickable: false,
          map: mapInstanceRef.current,
        });
        gridMarkersRef.current.push(rect);
      });
    } else {
      points.forEach((p) => {
        const circle = new (window as any).google.maps.Circle({
          center: p,
          radius: 150,
          map: mapInstanceRef.current,
          fillColor: '#10b981',
          fillOpacity: 0.6,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          clickable: false,
        });
        gridMarkersRef.current.push(circle);
      });
    }

    if (centerMarkerRef.current) {
      if (typeof centerMarkerRef.current.setPosition === 'function') {
        centerMarkerRef.current.setPosition(center);
      } else {
        // AdvancedMarkerElement
        centerMarkerRef.current.position = center;
      }
    }
    // Update drag handle to remain slightly south of center
    if (handleMarkerRef.current) {
      const milesPerDegreeLat = 69.0;
      const spacing = (typeof spacingMiles === 'number' && spacingMiles > 0)
        ? spacingMiles
        : (radiusMiles * 2) / Math.max(gridSize - 1, 1);
      const handleOffsetMiles = Math.max(spacing * 0.2, 0.1);
      const latOffset = handleOffsetMiles / milesPerDegreeLat;
      const handlePos = { lat: center.lat - latOffset, lng: center.lng };
      handleMarkerRef.current.setPosition?.(handlePos);
    }
    if (targetBusiness && businessMarkerRef.current) {
      const ll = { lat: targetBusiness.lat, lng: targetBusiness.lng };
      if (typeof businessMarkerRef.current.setPosition === 'function') {
        businessMarkerRef.current.setPosition(ll);
      } else {
        businessMarkerRef.current.position = ll;
      }
    }
    mapInstanceRef.current.setCenter(center);
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="absolute inset-0" />
      {initializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-3"></div>
            <p className="text-sm text-gray-300">Loading map...</p>
          </div>
        </div>
      )}
      {/* On-map scale indicator (non-interactive) */}
      {center && (
        <div
          className="absolute left-4 bottom-4 z-20"
          style={{ pointerEvents: 'none' }}
        >
          {(() => {
            const denom = Math.max(gridSize - 1, 1);
            const spacing = (typeof spacingMiles === 'number' && spacingMiles > 0)
              ? spacingMiles
              : (radiusMiles * 2) / denom;
            const span = spacing * denom;
            return (
              <div className="rounded-md px-4 py-3 bg-black/75 text-white text-[13px] shadow-lg border border-white/10 min-w-[220px]">
                <div>
                  <span className="text-gray-300">Spacing:</span> <span className="font-semibold">{spacing.toFixed(2)} mi</span>
                </div>
                <div>
                  <span className="text-gray-300">Grid:</span> <span className="font-semibold">{gridSize} × {gridSize}</span>
                </div>
                <div>
                  <span className="text-gray-300">Span:</span> <span className="font-semibold">{span.toFixed(2)} mi</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
