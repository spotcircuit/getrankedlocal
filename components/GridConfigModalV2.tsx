'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Grid3x3, Ruler, Info, Navigation } from 'lucide-react';
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

interface GridConfigModalV2Props {
  isOpen: boolean;
  searchMode: 'all' | 'targeted';
  businessName?: string;
  city: string;
  state: string;
  niche: string;
  locationCoords: { lat: number; lng: number } | null;
  onConfirm: (config: { gridSize: number; radiusMiles: number; centerLat?: number; centerLng?: number }) => void;
  onCancel: () => void;
  onNicheChange?: (n: string) => void;
}

export default function GridConfigModalV2({
  isOpen,
  searchMode,
  businessName,
  city,
  state,
  niche,
  locationCoords,
  onConfirm,
  onCancel,
  onNicheChange
}: GridConfigModalV2Props) {
  const [gridSize, setGridSize] = useState(9);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const [centerCoords, setCenterCoords] = useState(locationCoords);
  const [localNiche, setLocalNiche] = useState(niche || '');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const gridMarkersRef = useRef<any[]>([]);
  const coverageCircleRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);

  // Grid size options from 5x5 to 15x15 (odd numbers only)
  const gridSizeOptions = [5, 7, 9, 11, 13, 15];

  // Initialize center coordinates
  useEffect(() => {
    setCenterCoords(locationCoords);
  }, [locationCoords]);

  // Initialize and update map
  useEffect(() => {
    if (!isOpen || !centerCoords) return;

    const initMap = async () => {
      try {
        await ensureGoogleMapsLoaded();
      } catch (e) {
        console.error('Failed to load Google Maps in GridConfigModalV2', e);
        return;
      }

      // Initialize map if not already done
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current!, {
          center: centerCoords,
          zoom: calculateZoomLevel(radiusMiles),
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
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

        // Add draggable center marker
        centerMarkerRef.current = new (window as any).google.maps.Marker({
          position: centerCoords,
          map: mapInstanceRef.current,
          draggable: true,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          title: searchMode === 'targeted' ? businessName : `${city}, ${state}`,
          cursor: 'move'
        });

        // Handle marker drag
        centerMarkerRef.current.addListener('dragend', () => {
          const newPos = centerMarkerRef.current?.getPosition();
          if (newPos) {
            setCenterCoords({
              lat: newPos.lat(),
              lng: newPos.lng()
            });
          }
        });

        centerMarkerRef.current.addListener('dragstart', () => {
          setIsDragging(true);
        });

        centerMarkerRef.current.addListener('dragend', () => {
          setIsDragging(false);
        });
      }

      // Update map display
      updateMapDisplay();
    };

    initMap();
  }, [isOpen, centerCoords, businessName, city, state, searchMode]);

  // Update map when grid config changes
  useEffect(() => {
    if (mapInstanceRef.current && centerCoords) {
      updateMapDisplay();
    }
  }, [gridSize, radiusMiles, centerCoords]);

  const updateMapDisplay = () => {
    if (!mapInstanceRef.current || !centerCoords) return;

    // Clear existing grid markers
    gridMarkersRef.current.forEach(marker => marker.setMap(null));
    gridMarkersRef.current = [];

    // Clear existing coverage circle
    if (coverageCircleRef.current) {
      coverageCircleRef.current.setMap(null);
    }

    // Create coverage circle
    coverageCircleRef.current = new (window as any).google.maps.Circle({
      center: centerCoords,
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
      centerCoords.lat,
      centerCoords.lng,
      radiusMiles,
      gridSize
    );

    gridPoints.forEach(point => {
      const circle = new (window as any).google.maps.Circle({
        center: { lat: point.lat, lng: point.lng },
        radius: 150,
        map: mapInstanceRef.current,
        fillColor: '#10b981',
        fillOpacity: 0.6,
        strokeColor: '#ffffff',
        strokeWeight: 1
      });
      gridMarkersRef.current.push(circle);
    });

    // Update center marker position if it exists
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setPosition(centerCoords);
    }

    // Adjust zoom
    mapInstanceRef.current.setZoom(calculateZoomLevel(radiusMiles));
    mapInstanceRef.current.setCenter(centerCoords);
  };

  const handleRecenter = () => {
    if (locationCoords) {
      setCenterCoords(locationCoords);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(locationCoords);
        if (centerMarkerRef.current) {
          centerMarkerRef.current.setPosition(locationCoords);
        }
      }
    }
  };

  const summary = getGridSummary(gridSize, radiusMiles);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-900 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Configure your grid</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Business/Location Info */}
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">
              {searchMode === 'targeted' ? 'Target Business' : 'Search Location'}
            </p>
            <p className="text-white font-medium">
              {searchMode === 'targeted' ? businessName : `${city}, ${state}`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Searching for: {localNiche || '—'}
            </p>
          </div>
        </div>

        {/* Configuration */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search Term / Service */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-2">
              <Ruler className="w-4 h-4" />
              <span>Search Term / Service</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={localNiche}
              onChange={(e) => {
                setLocalNiche(e.target.value);
                onNicheChange?.(e.target.value);
              }}
              placeholder="e.g., medical spa, plumber, restaurant"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
          {/* Grid Size */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Grid3x3 className="w-4 h-4" />
              <span>Grid size</span>
            </label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              {gridSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} x {size} ({size * size} points)
                </option>
              ))}
            </select>
          </div>

          {/* Distance/Radius */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Ruler className="w-4 h-4" />
              <span>Distance between points</span>
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="2"
                max="10"
                step="0.5"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>2 mi</span>
                <span className="text-purple-400 font-medium">{radiusMiles} miles</span>
                <span>10 mi</span>
              </div>
            </div>
          </div>

          {/* Grid Info */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Points:</span>
              <span className="text-white font-medium">{summary.totalPoints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Point Spacing:</span>
              <span className="text-white font-medium">{summary.spacing} miles</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Coverage Area:</span>
              <span className="text-white font-medium">{summary.coverageArea} sq mi</span>
            </div>
          </div>

          {/* Drag Instructions */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Drag to adjust center</p>
                <p>Drag the center point on the map to move the grid. Click "Re-center" to return to the original location.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={() => onConfirm({ 
              gridSize, 
              radiusMiles,
              centerLat: centerCoords?.lat,
              centerLng: centerCoords?.lng
            })}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all shadow-lg"
          >
            Continue →
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-gray-800">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Loading indicator while map initializes */}
        {!mapInstanceRef.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading map...</p>
            </div>
          </div>
        )}
        
        {/* Re-center Button */}
        <button
          onClick={handleRecenter}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gray-900/90 hover:bg-gray-900 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all"
        >
          <Navigation className="w-4 h-4" />
          Re-center on {searchMode === 'targeted' ? 'business' : 'search'} location
        </button>

        {/* Dragging Indicator */}
        {isDragging && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg">
            Dragging grid center...
          </div>
        )}
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
