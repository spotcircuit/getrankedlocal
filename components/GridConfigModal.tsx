'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Grid3x3, Ruler, Info } from 'lucide-react';
import { 
  generateGridPoints, 
  calculateZoomLevel, 
  calculateGridSpacing,
  calculateCoverageArea,
  getTotalPoints,
  milesToMeters,
  getGridSummary
} from '@/lib/grid-calculations';
import { ensureGoogleMapsLoaded } from '@/lib/maps-loader';

interface GridConfigModalProps {
  isOpen: boolean;
  searchMode: 'all' | 'targeted';
  businessName?: string;
  city: string;
  state: string;
  niche: string;
  locationCoords: { lat: number; lng: number } | null;
  onConfirm: (config: { gridSize: number; radiusMiles: number }) => void;
  onCancel: () => void;
}

export default function GridConfigModal({
  isOpen,
  searchMode,
  businessName,
  city,
  state,
  niche,
  locationCoords,
  onConfirm,
  onCancel
}: GridConfigModalProps) {
  const [gridSize, setGridSize] = useState(13);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const gridMarkersRef = useRef<any[]>([]);
  const coverageCircleRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);

  // Initialize and update map
  useEffect(() => {
    if (!isOpen || !locationCoords) return;

    const initMap = async () => {
      try {
        await ensureGoogleMapsLoaded();
      } catch (e) {
        console.error('Failed to load Google Maps in GridConfigModal', e);
        return;
      }

      // Initialize map if not already done
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current!, {
          center: locationCoords,
          zoom: calculateZoomLevel(radiusMiles),
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#1f2937" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#111827" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca3af" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#374151" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#111827" }]
            }
          ]
        });

        // Add center marker
        centerMarkerRef.current = new (window as any).google.maps.Marker({
          position: locationCoords,
          map: mapInstanceRef.current,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: searchMode === 'targeted' ? businessName : `${city}, ${state}`
        });
      }

      // Update map display
      updateMapDisplay();
    };

    initMap();
  }, [isOpen, locationCoords, businessName, city, state, searchMode]);

  // Update map when grid config changes
  useEffect(() => {
    if (mapInstanceRef.current && locationCoords) {
      updateMapDisplay();
    }
  }, [gridSize, radiusMiles, locationCoords]);

  const updateMapDisplay = () => {
    if (!mapInstanceRef.current || !locationCoords) return;

    // Clear existing grid markers
    gridMarkersRef.current.forEach(marker => marker.setMap(null));
    gridMarkersRef.current = [];

    // Clear existing coverage circle
    if (coverageCircleRef.current) {
      coverageCircleRef.current.setMap(null);
    }

    // Create coverage circle
    coverageCircleRef.current = new (window as any).google.maps.Circle({
      center: locationCoords,
      radius: milesToMeters(radiusMiles),
      map: mapInstanceRef.current,
      fillColor: '#6366f1',
      fillOpacity: 0.1,
      strokeColor: '#6366f1',
      strokeOpacity: 0.3,
      strokeWeight: 2
    });

    // Generate and display grid points
    const gridPoints = generateGridPoints(
      locationCoords.lat,
      locationCoords.lng,
      radiusMiles,
      gridSize
    );

    gridPoints.forEach(point => {
      const circle = new (window as any).google.maps.Circle({
        center: { lat: point.lat, lng: point.lng },
        radius: 100,
        map: mapInstanceRef.current,
        fillColor: '#10b981',
        fillOpacity: 0.6,
        strokeWeight: 0
      });
      gridMarkersRef.current.push(circle);
    });

    // Adjust zoom
    mapInstanceRef.current.setZoom(calculateZoomLevel(radiusMiles));
    mapInstanceRef.current.setCenter(locationCoords);
  };

  const summary = getGridSummary(gridSize, radiusMiles);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl my-8 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Configure Your Grid Search</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-purple-100">
            Customize your search area and grid density
          </p>
        </div>

        {/* Map Preview */}
        <div className="relative">
          <div className="h-96 bg-gray-800">
            <div ref={mapRef} className="h-full w-full" />
            
            {/* Map Legend - positioned at bottom right */}
            <div className="absolute bottom-4 right-4 bg-gray-900/90 rounded-lg p-3 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-gray-300 text-xs">Center Point</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-gray-300 text-xs">Grid Points</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-blue-500/30 flex-shrink-0" />
                <span className="text-gray-300 text-xs">Coverage Area</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-900">
          {/* Grid Size Selector */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Grid3x3 className="w-4 h-4 flex-shrink-0" />
              <span>Grid Size</span>
            </label>
            <div className="flex gap-2">
              {[5, 7, 9, 11, 13].map(size => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    gridSize === size
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Slider */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Ruler className="w-4 h-4 flex-shrink-0" />
              <span>Coverage Radius: <span className="text-purple-400">{radiusMiles} miles</span></span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="2"
                max="10"
                step="0.5"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>2 mi</span>
                <span>5 mi</span>
                <span>10 mi</span>
              </div>
            </div>
          </div>

          {/* Info Display */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-300 space-y-2">
                <div className="flex justify-between">
                  <span>📍 Center:</span>
                  <span className="text-white font-medium">
                    {searchMode === 'targeted' ? businessName : `${city}, ${state}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>🔍 Search Term:</span>
                  <span className="text-white font-medium">{niche}</span>
                </div>
                <div className="flex justify-between">
                  <span>📊 Total Points:</span>
                  <span className="text-white font-medium">{summary.totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span>📏 Point Spacing:</span>
                  <span className="text-white font-medium">{summary.spacing} miles</span>
                </div>
                <div className="flex justify-between">
                  <span>📐 Coverage Area:</span>
                  <span className="text-white font-medium">{summary.coverageArea} sq miles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm({ gridSize, radiusMiles })}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all shadow-lg"
            >
              Start Grid Search →
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #6366f1;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #6366f1;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }
      `}</style>
    </div>
  );
}
