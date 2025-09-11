'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { ensureGoogleMapsLoaded } from '@/lib/maps-loader';
import GridBusinessList from './GridBusinessList';

interface GridPoint {
  lat: number;
  lng: number;
  gridRow: number;
  gridCol: number;
  targetRank: number;
  totalResults: number;
  topCompetitors: Array<{
    name: string;
    rank: number;
    rating: number;
    reviews: number;
  }>;
}

interface ResultsSectionV3Props {
  gridData: {
    gridPoints: GridPoint[];
    searchTerm?: string;
    targetBusiness?: {
      name: string;
      lat?: number;
      lng?: number;
      rating?: number;
      reviews?: number;
      coverage: number;
      pointsFound: number;
      totalPoints: number;
      avgRank: number;
      bestRank: number;
      worstRank: number;
    } | null;
    competitors: Array<{
      name: string;
      rating: number;
      reviews: number;
      appearances: number;
      avgRank: string;
      coverage: string;
      lat?: number;
      lng?: number;
      address?: string;
      phone?: string;
    }>;
    competitorRankMatrix?: Record<string, number[]>; // New: complete ranking data
    summary: {
      totalUniqueBusinesses: number;
      successRate: string;
      executionTime: number;
    };
    location?: {
      city: string;
      state: string;
      centerLat: number;
      centerLng: number;
    };
  };
  businessName: string;
  externalSelectedCompetitor?: string | null;
  onSelectCompetitor?: (name: string | null) => void;
  externalShowAllPins?: boolean;
  renderCompetitorPanel?: boolean;
}

export default function ResultsSectionV3({ gridData, businessName, externalSelectedCompetitor, onSelectCompetitor, externalShowAllPins, renderCompetitorPanel = true }: ResultsSectionV3Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridPoint | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(externalSelectedCompetitor ?? null);
  const [showAllCompetitorPins, setShowAllCompetitorPins] = useState(!!externalShowAllPins);
  useEffect(() => { setSelectedCompetitor(externalSelectedCompetitor ?? null); }, [externalSelectedCompetitor]);
  useEffect(() => { if (typeof externalShowAllPins === 'boolean') setShowAllCompetitorPins(!!externalShowAllPins); }, [externalShowAllPins]);
  const [showAllCompetitors, setShowAllCompetitors] = useState(true);
  const [expandedCompetitorCount, setExpandedCompetitorCount] = useState(5);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const allCompetitorMarkersRef = useRef<any[]>([]);
  const targetMarkerRef = useRef<any>(null);
  
  // Reset selected competitor when new search data arrives
  // Use a combination of factors to detect a new search
  useEffect(() => {
    setSelectedCompetitor(null);
    setExpandedCompetitorCount(5);
    // preserve user's Show Pins preference
    setSelectedCell(null);
    console.log('Resetting state for new search');
  }, [gridData.summary?.executionTime, businessName]);

  // Debug logging
  useEffect(() => {
    if (gridData) {
      console.log('ResultsSectionV3 received gridData:', gridData);
      console.log('Target business:', gridData.targetBusiness);
      console.log('Sample grid points:', gridData.gridPoints?.slice(0, 5).map((p: any) => ({
        row: p.gridRow,
        col: p.gridCol,
        targetRank: p.targetRank
      })));
    }
  }, [gridData]);

  // Function to get competitor rankings across all grid points
  const getCompetitorRankings = (competitorName: string) => {
    // Use the complete ranking matrix if available
    if (gridData.competitorRankMatrix && gridData.competitorRankMatrix[competitorName]) {
      const rankArray = gridData.competitorRankMatrix[competitorName];
      const rankings = new Map<number, number>();
      rankArray.forEach((rank, index) => {
        rankings.set(index, rank);
      });
      console.log(`Using complete ranking data for ${competitorName}: ${rankArray.filter(r => r < 999).length} appearances`);
      return rankings;
    }
    
    // Fallback: fuzzy match against topCompetitors names at each grid point
    const rankings = new Map<number, number>();
    let foundCount = 0;
    const target = (competitorName || '').toLowerCase();
    const tokens = target.split(/\s+/).filter(w => w.length > 2);
    gridData.gridPoints.forEach((point, index) => {
      // choose best (lowest rank) among matches, if multiple variants exist
      let bestRank = 999;
      for (const c of point.topCompetitors || []) {
        const name = (c.name || '').toLowerCase();
        const match = tokens.length ? tokens.every(t => name.includes(t)) : name === target;
        if (match) {
          if (typeof c.rank === 'number' && c.rank < bestRank) bestRank = c.rank;
        }
      }
      rankings.set(index, bestRank);
      if (bestRank < 999) foundCount++;
    });
    if (foundCount === 0) {
      console.warn(`No rankings found for competitor (fuzzy): ${competitorName}`);
    }
    return rankings;
  };

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !gridData.gridPoints.length) return;

    const initMap = async () => {
      // Ensure Maps script is present
      try {
        await ensureGoogleMapsLoaded();
      } catch (e) {
        console.error(e);
        return;
      }

      // Create the map once; reuse thereafter without changing center/zoom
      let map = mapInstanceRef.current as any;
      if (!map) {
        // Calculate initial center: target business if available, else centroid
        let centerLat = gridData.location?.centerLat || gridData.gridPoints.reduce((sum, p) => sum + p.lat, 0) / gridData.gridPoints.length;
        let centerLng = gridData.location?.centerLng || gridData.gridPoints.reduce((sum, p) => sum + p.lng, 0) / gridData.gridPoints.length;
        if (businessName && gridData.targetBusiness?.lat && gridData.targetBusiness?.lng) {
          centerLat = gridData.targetBusiness.lat;
          centerLng = gridData.targetBusiness.lng;
          console.log(`Centering map on target business: ${businessName} at ${centerLat}, ${centerLng}`);
        }
        map = new (window as any).google.maps.Map(mapRef.current!, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });
        mapInstanceRef.current = map;
      }
      
      // Create info window
      if (!infoWindowRef.current) infoWindowRef.current = new (window as any).google.maps.InfoWindow();

      // Clear existing markers and rectangles
      markersRef.current.forEach(marker => {
        if (marker instanceof (window as any).google.maps.Rectangle) {
          marker.setMap(null);
        } else {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // Calculate grid cell size dynamically (degrees) from actual points
      const points = gridData.gridPoints || [];
      const rows = points.reduce((m, p) => Math.max(m, p.gridRow), 0) + 1;
      const cols = points.reduce((m, p) => Math.max(m, p.gridCol), 0) + 1;
      const verticalSteps: number[] = [];
      const horizontalSteps: number[] = [];
      try {
        // Build maps for quick neighbor lookup
        const byRowCol = new Map<string, GridPoint>();
        points.forEach(p => byRowCol.set(`${p.gridRow}:${p.gridCol}`, p));
        // Collect vertical neighbor spacings (same col, row+1)
        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols; c++) {
            const a = byRowCol.get(`${r}:${c}`);
            const b = byRowCol.get(`${r + 1}:${c}`);
            if (a && b) verticalSteps.push(Math.abs(a.lat - b.lat));
          }
        }
        // Collect horizontal neighbor spacings (same row, col+1)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const a = byRowCol.get(`${r}:${c}`);
            const b = byRowCol.get(`${r}:${c + 1}`);
            if (a && b) horizontalSteps.push(Math.abs(a.lng - b.lng));
          }
        }
      } catch {}
      const median = (arr: number[]) => {
        if (!arr.length) return 0;
        const s = arr.slice().sort((x, y) => x - y);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
      };
      let latSpacing = median(verticalSteps) || 0;
      let lngSpacing = median(horizontalSteps) || 0;
      // Fallback to extents if neighbors missing or zero spacing
      if (!latSpacing || !lngSpacing) {
        const minLat = Math.min(...points.map(p => p.lat));
        const maxLat = Math.max(...points.map(p => p.lat));
        const minLng = Math.min(...points.map(p => p.lng));
        const maxLng = Math.max(...points.map(p => p.lng));
        latSpacing = latSpacing || ((maxLat - minLat) / Math.max(rows - 1, 1));
        lngSpacing = lngSpacing || ((maxLng - minLng) / Math.max(cols - 1, 1));
      }
      
      // Create grid rectangles when we have meaningful target rankings (targeted mode)
      // In "All Businesses" mode we don't draw the heat map by default
      const hasTargetRankings = !!(businessName && gridData.gridPoints.some(p => typeof p.targetRank === 'number' && p.targetRank < 999));
      
      // Get rankings for selected competitor if one is selected
      const competitorRankings = selectedCompetitor ? getCompetitorRankings(selectedCompetitor) : null;
      
      // Show heat map only when targeted (or when a competitor is selected to view their heat map)
      if (businessName || selectedCompetitor) {
        gridData.gridPoints.forEach((point, index) => {
        // Use competitor rankings if a competitor is selected, otherwise use target rankings
        const rankToDisplay = competitorRankings ? competitorRankings.get(index) || 999 : point.targetRank;
        const color = getMarkerColor(rankToDisplay);
        
        // Create a rectangle that tiles with adjacent squares
        const rectangle = new (window as any).google.maps.Rectangle({
          bounds: {
            north: point.lat + (latSpacing / 2),
            south: point.lat - (latSpacing / 2),
            east: point.lng + (lngSpacing / 2),
            west: point.lng - (lngSpacing / 2)
          },
          fillColor: color,
          fillOpacity: 0.4,
          strokeColor: color,
          strokeWeight: 0.5,
          strokeOpacity: 0.6,
          map: map,
          clickable: true
        });

        // Add label marker for the ranking number (no background circle)
        const marker = new (window as any).google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 0  // Invisible marker, just for positioning the label
          },
          label: rankToDisplay === 999 
            ? {
                text: '•',  // Dot to indicate businesses exist here
                color: '#FFFFFF',  // White dot on blue background
                fontSize: '20px',
                fontWeight: 'bold'
              }
            : rankToDisplay === 1
            ? {
                text: '👑',  // Crown emoji for #1
                fontSize: '20px'
              }
            : {
                text: rankToDisplay.toString(),
                color: '#4C1D95',  // Dark purple text (or use #000000 for black)
                fontSize: '16px',  // Larger font
                fontWeight: '900'  // Extra bold
              },
          title: rankToDisplay === 999 
            ? `${selectedCompetitor || businessName || 'Target'} not found` 
            : rankToDisplay === 1
            ? `👑 ${selectedCompetitor || businessName || 'Target'} RANKS #1! 👑`
            : `${selectedCompetitor || businessName || 'Target'} Rank #${rankToDisplay}`,
          zIndex: rankToDisplay === 1 ? 2000 : 1000  // Higher z-index for #1
        });

        // Create click handler for both rectangle and marker
        const handleClick = () => {
          const rankColor = point.targetRank === 999 ? '#6B7280' :
                           point.targetRank <= 3 ? '#00FF00' :
                           point.targetRank <= 10 ? '#FFFF00' :
                           point.targetRank <= 20 ? '#FFA500' : '#FF0000';
          
          // Different content for targeted vs non-targeted mode
          const targetedContent = `
            <div style="background: linear-gradient(135deg, #1F2937 0%, #111827 100%); 
                        padding: 14px; width: 300px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="border-bottom: 2px solid #7C3AED; padding-bottom: 8px; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #A78BFA;">
                  GRID POSITION (${point.gridRow}, ${point.gridCol})
                </h3>
                <p style="margin: 3px 0 0 0; font-size: 16px; color: #FFFFFF; font-weight: 700;">
                  ${selectedCompetitor || businessName}: ${rankToDisplay === 999 ? 'Not Found' : `Rank #${rankToDisplay}`}
                </p>
              </div>
              
              <div style="background: #1E293B; border-radius: 6px; padding: 10px;">
                <p style="font-size: 11px; font-weight: 700; color: #A78BFA; margin: 0 0 10px 0;">
                  TOP 3 BUSINESSES AT THIS LOCATION
                </p>
                ${point.topCompetitors.slice(0, 3).map((c, idx) => `
                  <div id="grid-comp-${c.name.replace(/[^a-zA-Z0-9]/g, '-')}" 
                       style="padding: 8px 0; ${idx < 2 ? 'border-bottom: 1px solid #334155;' : ''} cursor: pointer;"
                       onmouseover="this.style.backgroundColor='#334155'" 
                       onmouseout="this.style.backgroundColor='transparent'">
                    <div style="display: flex; align-items: start;">
                      <span style="min-width: 26px; height: 26px; border-radius: 50%; 
                                   background: ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'}; 
                                   color: #000000; 
                                   display: flex; align-items: center; justify-content: center; 
                                   font-size: 12px; font-weight: 900; margin-right: 10px; flex-shrink: 0;">
                        ${c.rank}
                      </span>
                      <div style="flex: 1; min-width: 0;">
                        <p style="margin: 0; font-size: 12px; color: #FFFFFF; font-weight: 700;">
                          ${c.name}
                        </p>
                        <p style="margin: 3px 0 0 0; font-size: 10px; color: #60A5FA;">
                          ${c.rating ? `⭐ ${c.rating} (${c.reviews || 0} reviews)` : 'No ratings'}
                        </p>
                      </div>
                    </div>
                  </div>
                `).join('')}${ point.topCompetitors.length === 0 ? `
                  <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center; padding: 15px 0;">
                    No businesses found at this grid point
                  </p>
                ` : ''}
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #334155;">
                  <p style="margin: 0; font-size: 10px; color: #9CA3AF;">
                    Total businesses found: <span style="color: #FFFFFF; font-weight: 600;">${point.totalResults || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          `;
          
          const allBusinessesContent = `
            <div style="background: linear-gradient(135deg, #1F2937 0%, #111827 100%); 
                        padding: 14px; width: 300px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        border-radius: 4px;">
              <div style="border-bottom: 2px solid #7C3AED; padding-bottom: 8px; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #A78BFA;">
                  GRID POSITION (${point.gridRow}, ${point.gridCol})
                </h3>
              </div>
              
              <div style="background: #1E293B; border-radius: 6px; padding: 10px;">
                <p style="font-size: 11px; font-weight: 700; color: #A78BFA; margin: 0 0 10px 0;">
                  TOP 3 BUSINESSES AT THIS LOCATION
                </p>
                ${point.topCompetitors.slice(0, 3).map((c, idx) => `
                  <div id="grid-comp-${c.name.replace(/[^a-zA-Z0-9]/g, '-')}" 
                       style="padding: 8px 0; ${idx < 2 ? 'border-bottom: 1px solid #334155;' : ''} cursor: pointer;"
                       onmouseover="this.style.backgroundColor='#334155'" 
                       onmouseout="this.style.backgroundColor='transparent'">
                    <div style="display: flex; align-items: start;">
                      <span style="min-width: 26px; height: 26px; border-radius: 50%; 
                                   background: ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'}; 
                                   color: #000000; 
                                   display: flex; align-items: center; justify-content: center; 
                                   font-size: 12px; font-weight: 900; margin-right: 10px; flex-shrink: 0;">
                        ${c.rank}
                      </span>
                      <div style="flex: 1; min-width: 0;">
                        <p style="margin: 0; font-size: 12px; color: #FFFFFF; font-weight: 700;">
                          ${c.name}
                        </p>
                        ${(c as any).address ? `
                          <p style="margin: 3px 0 0 0; font-size: 10px; color: #94A3B8; line-height: 1.3;">
                            📍 ${(c as any).address}
                          </p>
                        ` : ''}
                        ${(c as any).phone ? `
                          <p style="margin: 2px 0 0 0; font-size: 10px; color: #94A3B8;">
                            📞 ${(c as any).phone}
                          </p>
                        ` : ''}
                        <p style="margin: 3px 0 0 0; font-size: 10px; color: #60A5FA;">
                          ${c.rating ? `⭐ ${c.rating} (${c.reviews || 0} reviews)` : 'No ratings'}
                        </p>
                      </div>
                    </div>
                  </div>
                `).join('')}
                ${point.topCompetitors.length === 0 ? `
                  <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center; padding: 15px 0;">
                    No businesses found at this grid point
                  </p>
                ` : ''}
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #334155;">
                  <p style="margin: 0; font-size: 10px; color: #9CA3AF;">
                    Total businesses found: <span style="color: #FFFFFF; font-weight: 600;">${point.totalResults || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          `;
          
          // Use targeted content if in targeted mode, otherwise show all businesses content
          const content = (businessName || selectedCompetitor) ? targetedContent : allBusinessesContent;
          
          infoWindowRef.current!.setContent(content);
          infoWindowRef.current!.open(map, marker);
          setSelectedCell(point);

          // If targeted content rendered, wire click on top competitors to switch focus
          setTimeout(() => {
            try {
              (point.topCompetitors || []).slice(0, 3).forEach((c: any) => {
                const id = 'grid-comp-' + c.name.replace(/[^a-zA-Z0-9]/g, '-');
                const el = document.getElementById(id);
                if (el) {
                  el.addEventListener('click', () => {
                    try { setSelectedCompetitor(c.name); } catch {}
                    try { onSelectCompetitor && onSelectCompetitor(c.name); } catch {}
                    try { infoWindowRef.current && infoWindowRef.current.close(); } catch {}
                  });
                }
              });
            } catch {}
          }, 100);
        };

        // Add click listeners to both rectangle and marker
        rectangle.addListener('click', handleClick);
        marker.addListener('click', handleClick);

          // Store both as we need to clean them up later
          markersRef.current.push(rectangle as any);
          markersRef.current.push(marker);
        });
      }

      // Add markers for businesses on the map
      // Only show competitors if:
      // 1. We're in "All Businesses" mode (no target business), OR
      // 2. A competitor is selected AND the toggle is on
      if ((!businessName && !hasTargetRankings && !selectedCompetitor) || (selectedCompetitor && showAllCompetitors)) {
        if (gridData.competitors) {
        // Deduplicate competitors by name before plotting
        const uniqueCompetitors = new Map();
        gridData.competitors.forEach(competitor => {
          if (!uniqueCompetitors.has(competitor.name)) {
            uniqueCompetitors.set(competitor.name, competitor);
          }
        });
        
        // In "All Businesses" mode, plot top 20 unique businesses
        Array.from(uniqueCompetitors.values()).slice(0, 20).forEach((competitor: any, idx: number) => {
          // Use business coordinates if available, otherwise find a point where it appears
          let position = null as { lat: number; lng: number } | null;
          
          // Prefer business coordinates from DB if available (no distance filter)
          if (typeof competitor.lat === 'number' && typeof competitor.lng === 'number') {
            position = { lat: competitor.lat, lng: competitor.lng };
          }
          
          if (!position) {
            // Find any point where this business appears
            const anyPoint = gridData.gridPoints.find(point => 
              point.topCompetitors.some(c => c.name === competitor.name)
            );
            if (anyPoint) {
              position = { lat: anyPoint.lat, lng: anyPoint.lng };
            }
          }
          
          if (position) {
            // Use same color scheme as heat map based on average rank
            const avgRank = parseFloat(competitor.avgRank);
            const cov = Math.min(100, Math.max(0, parseFloat(String(competitor.coverage))));
            console.log(`Competitor ${idx + 1}: ${competitor.name}, avgRank: ${avgRank}, raw: ${competitor.avgRank}, coverage: ${cov}%`);
            
            // Color based on list position (1-20) for now since that's what makes sense visually
            let markerColor = '#6B7280'; // Gray default
            const listPosition = idx + 1;
            if (listPosition <= 3) markerColor = '#10b981'; // Green for top 3
            else if (listPosition <= 6) markerColor = '#eab308'; // Yellow for 4-6
            else if (listPosition <= 10) markerColor = '#f97316'; // Orange for 7-10
            else if (listPosition <= 20) markerColor = '#ef4444'; // Red for 11-20
            
            const marker = new (window as any).google.maps.Marker({
              position: position,
              map,
              icon: {
                path: (window as any).google.maps.SymbolPath.CIRCLE,
                scale: 14,  // Larger, more visible
                fillColor: markerColor,
                fillOpacity: 0.95,
                strokeColor: '#FFFFFF',  // White border for contrast
                strokeWeight: 2
              },
              label: listPosition === 1 
                ? { text: '👑', fontSize: '16px' }
                : {
                    text: listPosition.toString(),
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '900'
                  },
              title: `#${idx + 1} ${competitor.name} (Avg Rank: #${avgRank.toFixed(1)}, Coverage: ${cov.toFixed(1)}%)`,
              zIndex: 5000 - idx  // Higher z-index to ensure they're on top
            });
            
            marker.addListener('click', () => {
              // Create a unique ID for this competitor to handle clicks
              const competitorId = 'comp-' + competitor.name.replace(/[^a-zA-Z0-9]/g, '-');
              
              // Get competitor's ranking data for high/low calculation
              const competitorRankings = gridData.competitorRankMatrix?.[competitor.name];
              let bestRank = 999, worstRank = 999;
              if (competitorRankings) {
                const validRanks = competitorRankings.filter(r => r < 999);
                if (validRanks.length > 0) {
                  bestRank = Math.min(...validRanks);
                  worstRank = Math.max(...validRanks);
                }
              }
              
              infoWindowRef.current!.setContent(`
                <div style="width: 280px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;">
                  <!-- Rank by Coverage Badge -->
                  <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
                              padding: 8px; 
                              margin: -16px -16px 10px -16px; 
                              border-radius: 8px 8px 0 0;
                              text-align: center;
                              box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);">
                    <p style="margin: 0; font-size: 10px; color: #000000; font-weight: 600; opacity: 0.8;">
                      RANK BY COVERAGE
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 24px; font-weight: 900; color: #000000; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                      #${idx + 1}
                    </p>
                  </div>
                  
                  <!-- Business Name -->
                  <h3 id="${competitorId}" 
                      style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #1a1a1a; line-height: 1.2;
                             cursor: pointer; text-decoration: underline; text-decoration-color: #7C3AED;"
                      onmouseover="this.style.color='#7C3AED'" 
                      onmouseout="this.style.color='#1a1a1a'">
                    ${competitor.name}
                  </h3>
                  <p style="margin: 0 0 10px 0; font-size: 10px; color: #7C3AED; font-weight: 600;">
                    📊 Click name to view heat map
                  </p>
                  
                  <!-- Performance Metrics -->
                  <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      Performance
                    </p>
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                      <div style="flex: 1; text-align: center;">
                        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #10b981;">
                          #${bestRank === 999 ? 'N/A' : bestRank}
                        </p>
                        <p style="margin: 1px 0 0 0; font-size: 8px; color: #666;">BEST</p>
                      </div>
                      <div style="flex: 1; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #6366f1;">
                          #${competitor.avgRank}
                        </p>
                        <p style="margin: 1px 0 0 0; font-size: 8px; color: #666;">AVERAGE</p>
                      </div>
                      <div style="flex: 1; text-align: center;">
                        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #ef4444;">
                          #${worstRank === 999 ? 'N/A' : worstRank}
                        </p>
                        <p style="margin: 1px 0 0 0; font-size: 8px; color: #666;">WORST</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Stats Grid - 2x2 layout -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                    <div style="background: #f1f3f4; padding: 6px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 9px; color: #666;">Coverage</p>
                      <p style="margin: 1px 0 0 0; font-size: 14px; font-weight: 700; color: #1a1a1a;">
                        ${cov.toFixed(1)}%
                      </p>
                    </div>
                    
                    <div style="background: #f1f3f4; padding: 6px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 9px; color: #666;">Rating</p>
                      <p style="margin: 1px 0 0 0; font-size: 14px; font-weight: 700; color: #1a1a1a;">
                        ${competitor.rating ? `⭐ ${competitor.rating} (${competitor.reviews || 0})` : 'N/A'}
                      </p>
                    </div>
                    
                    <div style="background: #f1f3f4; padding: 6px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 9px; color: #666;">Appearances</p>
                      <p style="margin: 1px 0 0 0; font-size: 14px; font-weight: 700; color: #1a1a1a;">
                        ${competitor.appearances}/${gridData.gridPoints?.length || 169}
                      </p>
                    </div>
                    
                    <div style="background: #f1f3f4; padding: 6px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 9px; color: #666;">Avg Rank</p>
                      <p style="margin: 1px 0 0 0; font-size: 14px; font-weight: 700; color: #1a1a1a;">
                        #${competitor.avgRank}
                      </p>
                    </div>
                  </div>
                  
                  ${competitor.address ? `
                    <p style="margin: 0; font-size: 10px; color: #666; line-height: 1.3;">
                      📍 ${competitor.address}
                    </p>
                  ` : ''}
                </div>
              `);
              infoWindowRef.current!.open(map, marker);
              
          // Add click handler for the competitor name after info window opens
          setTimeout(() => {
            const nameElement = document.getElementById(competitorId);
            if (nameElement) {
              nameElement.addEventListener('click', () => {
                setSelectedCompetitor(competitor.name);
                try { onSelectCompetitor && onSelectCompetitor(competitor.name); } catch {}
                // preserve user's Show Pins preference
                infoWindowRef.current!.close();
              });
            }
          }, 100);
            });
            
            markersRef.current.push(marker);
          }
        });
        }
      } if (gridData.targetBusiness && gridData.targetBusiness.lat && gridData.targetBusiness.lng) {
        // In targeted mode, add marker for the business
        const businessMarker = new (window as any).google.maps.Marker({
          position: { 
            lat: gridData.targetBusiness.lat, 
            lng: gridData.targetBusiness.lng 
          },
          map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new (window as any).google.maps.Size(44, 44)
          },
          title: businessName || gridData.targetBusiness.name || 'Target business',
          zIndex: 10000
        });

        // Track as the persistent target marker so we can hide/show it on competitor selection
        try { targetMarkerRef.current = businessMarker; } catch {}
        
        // Add click listener for business marker
        businessMarker.addListener('click', () => {
          const tbCov = Math.min(100, Math.max(0, gridData.targetBusiness!.coverage));
          const coverageColor = tbCov > 75 ? '#00FF00' :
                                 tbCov > 50 ? '#FFFF00' :
                                 tbCov > 25 ? '#FFA500' : '#FF0000';
          
          const content = `
            <div style="width: 320px; background: linear-gradient(180deg, #0b0f1a 0%, #111827 100%); color:#FFFFFF; border:1px solid #374151; border-radius:12px; box-shadow:0 12px 30px rgba(0,0,0,0.45); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;">
              <div style="padding:12px 14px 10px 14px; border-bottom:1px solid #2a2f3a;">
                <div style="font-size:16px; font-weight:800; line-height:1.2; color:#FFFFFF;">${businessName || gridData.targetBusiness!.name || 'Target Business'}</div>
                ${typeof gridData.targetBusiness!.rating === 'number' ? `<div style=\"margin-top:6px; font-size:12px; color:#fbbf24;\">⭐ ${gridData.targetBusiness!.rating} <span style=\"color:#9CA3AF\">(${gridData.targetBusiness!.reviews || 0})</span></div>` : ''}
              </div>
              <div style="display:flex; gap:10px; padding:10px 14px;">
                <div style="flex:1; background:#111827; border:1px solid #374151; border-radius:8px; padding:8px; text-align:center;">
                  <div style="font-size:10px; color:#9CA3AF;">Coverage</div>
                  <div style="margin-top:2px; font-size:18px; font-weight:900; color:${coverageColor};">${tbCov.toFixed(1)}%</div>
                </div>
                <div style="flex:1; background:#111827; border:1px solid #374151; border-radius:8px; padding:8px; text-align:center;">
                  <div style="font-size:10px; color:#9CA3AF;">Avg Rank</div>
                  <div style="margin-top:2px; font-size:18px; font-weight:900; color:#60A5FA;">#${gridData.targetBusiness!.avgRank.toFixed(0)}</div>
                </div>
              </div>
              <div style="display:flex; gap:10px; padding:0 14px 12px 14px;">
                <div style="flex:1; background:#0f172a; border:1px solid #374151; border-radius:8px; padding:8px; text-align:center;">
                  <div style="font-size:10px; color:#9CA3AF;">Best</div>
                  <div style="margin-top:2px; font-size:16px; font-weight:800; color:#10b981;">#${gridData.targetBusiness!.bestRank}</div>
                </div>
                <div style="flex:1; background:#0f172a; border:1px solid #374151; border-radius:8px; padding:8px; text-align:center;">
                  <div style="font-size:10px; color:#9CA3AF;">Worst</div>
                  <div style="margin-top:2px; font-size:16px; font-weight:800; color:#ef4444;">#${gridData.targetBusiness!.worstRank}</div>
                </div>
              </div>
            </div>
          `;
          
          infoWindowRef.current!.setContent(content);
          infoWindowRef.current!.open(map, targetMarkerRef.current || businessMarker);
        });
        
        // Keep target marker persistent; do not include in markersRef cleanup
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, [gridData.gridPoints, businessName, selectedCompetitor, showAllCompetitors, expandedCompetitorCount]);

  // Draw competitor markers when toggled or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const g = (window as any).google as any;

    // Clear existing markers
    try {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
        selectedMarkerRef.current = null;
      }
      allCompetitorMarkersRef.current.forEach(m => m.setMap && m.setMap(null));
      allCompetitorMarkersRef.current = [];
    } catch {}

    // Hide target (original) marker when a competitor is selected; show it when cleared
    try {
      if (selectedCompetitor) {
        targetMarkerRef.current && targetMarkerRef.current.setMap && targetMarkerRef.current.setMap(null);
      } else {
        if (targetMarkerRef.current && mapInstanceRef.current) {
          targetMarkerRef.current.setMap(mapInstanceRef.current);
        }
      }
    } catch {}

    // Selected competitor marker (derive a reasonable position if coordinates are missing)
    if (selectedCompetitor) {
      const comp = gridData.competitors.find(c => c.name === selectedCompetitor);
      let pos: { lat: number; lng: number } | null = null;
      if (comp && typeof comp.lat === 'number' && typeof comp.lng === 'number') {
        pos = { lat: comp.lat, lng: comp.lng };
      } else {
        // Fallback: centroid of grid points where this competitor appears
        const pts = gridData.gridPoints.filter(pt => pt.topCompetitors?.some(tc => tc.name === selectedCompetitor));
        if (pts.length) {
          const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
          const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
          pos = { lat, lng };
        }
      }
      if (pos) {
        selectedMarkerRef.current = new g.maps.Marker({
          map: mapInstanceRef.current,
          position: pos,
          title: selectedCompetitor,
          zIndex: 2000,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new g.maps.Size(40, 40)
          }
        });

        // Do not move the map when selecting competitors; only show the pin

        const cov = Math.min(100, Math.max(0, parseFloat(String(comp?.coverage ?? 0))));
        const avgRank = parseFloat(String(comp?.avgRank ?? '999'));
        const ranks = (gridData.competitorRankMatrix && comp?.name && gridData.competitorRankMatrix[comp.name])
          ? gridData.competitorRankMatrix[comp.name].filter((r: number) => r < 999)
          : Array.from(getCompetitorRankings(selectedCompetitor).values()).filter((r) => r < 999);
        const best = ranks.length ? Math.min(...ranks) : 999;
        const worst = ranks.length ? Math.max(...ranks) : 999;

        const html = `
          <div style="width: 280px; background: linear-gradient(180deg, #0b0f1a 0%, #111827 100%); color:#FFFFFF; border:1px solid #374151; border-radius:10px; padding:10px; font-family:'Segoe UI', system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 900; color: #FFFFFF;">${selectedCompetitor}</h3>
            <div style="display:flex; justify-content:space-between; gap:8px;">
              <div style="flex:1; background:#111827; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                <div style="font-size:10px; color:#9CA3AF;">Coverage</div>
                <div style="font-size:16px; font-weight:900; color:#C4B5FD;">${cov.toFixed(1)}%</div>
              </div>
              <div style="flex:1; background:#111827; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                <div style="font-size:10px; color:#9CA3AF;">Avg Rank</div>
                <div style="font-size:16px; font-weight:900; color:#60A5FA;">#${isNaN(avgRank) ? 'N/A' : avgRank.toFixed(1)}</div>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; gap:8px; margin-top:6px;">
              <div style="flex:1; background:#0f172a; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                <div style="font-size:10px; color:#9CA3AF;">Best</div>
                <div style="font-size:14px; font-weight:800; color:#10b981;">#${best === 999 ? '—' : best}</div>
              </div>
              <div style="flex:1; background:#0f172a; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                <div style="font-size:10px; color:#9CA3AF;">Worst</div>
                <div style="font-size:14px; font-weight:800; color:#ef4444;">#${worst === 999 ? '—' : worst}</div>
              </div>
            </div>
            <p style="margin:8px 0 0 0; font-size:11px; color:#9CA3AF;">Viewing this competitor's heat map.</p>
          </div>`;
        try { infoWindowRef.current!.setContent(html); infoWindowRef.current!.open(mapInstanceRef.current, selectedMarkerRef.current); } catch {}
      }
    } else {
      // No selected competitor: close any open competitor info
      try { infoWindowRef.current && infoWindowRef.current.close(); } catch {}
    }

    // All competitor pins
    if (showAllCompetitorPins || !businessName) {
      gridData.competitors.forEach((c, idx) => {
        if (typeof c.lat === 'number' && typeof c.lng === 'number') {
          const m = new g.maps.Marker({
            map: mapInstanceRef.current,
            position: { lat: c.lat, lng: c.lng },
            title: c.name,
            zIndex: 1500,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: (() => { const cov = Math.min(100, Math.max(0, parseFloat(String(c.coverage ?? 0)))); return cov > 75 ? '#10b981' : cov > 50 ? '#eab308' : cov > 25 ? '#f97316' : '#ef4444'; })(),
              fillOpacity: 0.95,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
          // Add a numeric label for quick context
          try { m.setLabel && m.setLabel({ text: String(idx + 1), color: '#FFFFFF', fontSize: '12px', fontWeight: '900' } as any); } catch {}

          // Clickable info with summary + action to view as focus
          m.addListener('click', () => {
            const cov = Math.min(100, Math.max(0, parseFloat(String(c.coverage ?? 0))));
            const avgRank = parseFloat(String(c.avgRank ?? '999'));
            // Compute best/worst from complete matrix if available
            const ranks = (gridData.competitorRankMatrix && gridData.competitorRankMatrix[c.name])
              ? gridData.competitorRankMatrix[c.name].filter((r: number) => r < 999)
              : Array.from(getCompetitorRankings(c.name).values()).filter((r) => r < 999);
            const best = ranks.length ? Math.min(...ranks) : 999;
            const worst = ranks.length ? Math.max(...ranks) : 999;

            const compId = 'pin-comp-' + c.name.replace(/[^a-zA-Z0-9]/g, '-');
            infoWindowRef.current!.setContent(`
              <div style="width: 280px; background: linear-gradient(135deg, #1F2937 0%, #111827 100%); color: #FFFFFF; border: 1px solid #374151; border-radius: 10px; padding: 10px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;">
                <h3 id="${compId}" 
                    style="margin: 0 0 6px 0; font-size: 14px; font-weight: 900; color: #FFFFFF; cursor: pointer; text-decoration: underline; text-decoration-color: #A78BFA;">
                  ${c.name}
                </h3>
                <div style="display:flex; justify-content:space-between; gap:8px;">
                  <div style="flex:1; background:#111827; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                    <div style="font-size:10px; color:#9CA3AF;">Coverage</div>
                    <div style="font-size:16px; font-weight:900; color:#C4B5FD;">${cov.toFixed(1)}%</div>
                  </div>
                  <div style="flex:1; background:#111827; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                    <div style="font-size:10px; color:#9CA3AF;">Avg Rank</div>
                    <div style="font-size:16px; font-weight:900; color:#60A5FA;">#${isNaN(avgRank) ? 'N/A' : avgRank.toFixed(1)}</div>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; margin-top:6px;">
                  <div style="flex:1; background:#1F2937; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                    <div style="font-size:10px; color:#9CA3AF;">Best</div>
                    <div style="font-size:14px; font-weight:800; color:#10b981;">#${best === 999 ? '—' : best}</div>
                  </div>
                  <div style="flex:1; background:#1F2937; padding:6px; border-radius:6px; text-align:center; border:1px solid #374151;">
                    <div style="font-size:10px; color:#9CA3AF;">Worst</div>
                    <div style="font-size:14px; font-weight:800; color:#ef4444;">#${worst === 999 ? '—' : worst}</div>
                  </div>
                </div>
                <p style="margin:8px 0 0 0; font-size:11px; color:#9CA3AF;">
                  Click the name to view this competitor's heat map in the current grid.
                </p>
              </div>
            `);
            infoWindowRef.current!.open(mapInstanceRef.current, m);
            // Wire up the click to switch focus
            setTimeout(() => {
              const el = document.getElementById(compId);
              if (el) {
                el.addEventListener('click', () => {
                  try { setSelectedCompetitor(c.name); } catch {}
                  try { onSelectCompetitor && onSelectCompetitor(c.name); } catch {}
                  try { infoWindowRef.current!.close(); } catch {}
                });
              }
            }, 100);
          });
          allCompetitorMarkersRef.current.push(m);
        }
      });
    }
  }, [selectedCompetitor, showAllCompetitorPins, gridData.competitors]);

  const getMarkerColor = (rank: number) => {
    if (rank === 999 || rank > 20) return '#6B7280'; // Gray - not found or 21+
    if (rank <= 3) return '#10b981'; // Green - ranks 1-3
    if (rank <= 6) return '#eab308'; // Yellow - ranks 4-6
    if (rank <= 10) return '#f97316'; // Orange - ranks 7-10
    return '#ef4444'; // Red - ranks 11-20
  };

  const getRankColorClass = (rank: number) => {
    if (rank === 999 || rank > 20) return 'text-gray-500';
    if (rank <= 3) return 'text-green-400'; // Green - ranks 1-3
    if (rank <= 6) return 'text-yellow-400'; // Yellow - ranks 4-6
    if (rank <= 10) return 'text-orange-400'; // Orange - ranks 7-10
    return 'text-red-400'; // Red - ranks 11-20
  };

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-4 space-y-4">
        {/* Competitor selection and toggles */}
        {renderCompetitorPanel && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            {selectedCompetitor ? (
              <>
                Viewing: <span className="font-semibold text-white">{selectedCompetitor}</span>
              </>
            ) : (
              <>
                Viewing: <span className="font-semibold text-white">{businessName || 'Target'}</span>
              </>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showAllCompetitorPins}
              onChange={e => setShowAllCompetitorPins(e.target.checked)}
              className="w-4 h-4 bg-gray-800 border-gray-600 rounded"
            />
            Show competitor pins
          </label>
        </div>
        )}

        {/* Competitor list */}
        {renderCompetitorPanel && (
        <div className="bg-gray-800/60 rounded-lg p-3 max-h-56 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {gridData.competitors.map((c, idx) => {
              const cov = Math.min(100, Math.max(0, parseFloat(String(c.coverage))));
              return (
              <button
                key={c.name + idx}
                onClick={() => setSelectedCompetitor(c.name)}
                className={`text-left px-3 py-2 rounded-md border transition-colors ${selectedCompetitor === c.name ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-semibold truncate">{c.name}</span>
                  <span className="text-xs text-purple-400 font-semibold">cov {cov.toFixed(1)}%</span>
                </div>
                <div className="mt-1 text-xs text-gray-400 flex items-center gap-3">
                  <span>avg #{c.avgRank}</span>
                  {typeof c.rating === 'number' && <span>⭐ {c.rating} ({c.reviews || 0})</span>}
                </div>
              </button>
            )})}
          </div>
        </div>
        )}
        {/* Header with Coverage Stats */}
        <div className="border-b border-gray-700 pb-3">
          <h2 className="text-xl font-bold text-white mb-2">
            Grid Search Results
          </h2>
          <div className="flex gap-4 text-sm mb-3">
            <span>
              <span className="text-gray-400">Keyword:</span>{' '}
              <span className="text-purple-400 font-semibold">"{gridData.searchTerm || 'business'}"</span>
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-400">Mode</p>
              <p className="text-sm font-bold text-white truncate">
                {selectedCompetitor
                  ? selectedCompetitor
                  : (businessName ? businessName.slice(0, 20) + (businessName.length > 20 ? '...' : '') : 'All Businesses')}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-400">Time</p>
              <p className="text-lg font-bold text-blue-400">
                {Math.round(gridData.summary.executionTime)}s
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-400">Reviews</p>
              <p className="text-sm font-bold text-yellow-400">
                {(() => {
                  if (selectedCompetitor) {
                    const comp = gridData.competitors.find(c => c.name === selectedCompetitor);
                    if (comp && typeof comp.rating === 'number') return `⭐ ${comp.rating} (${comp.reviews || 0})`;
                    return 'N/A';
                  }
                  if (gridData.targetBusiness && typeof gridData.targetBusiness.rating === 'number') {
                    return `⭐ ${gridData.targetBusiness.rating} (${gridData.targetBusiness.reviews || 0})`;
                  }
                  return 'N/A';
                })()}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-400">Coverage</p>
              {(() => {
                let cov = 0;
                if (selectedCompetitor) {
                  const ranks = gridData.competitorRankMatrix && gridData.competitorRankMatrix[selectedCompetitor]
                    ? gridData.competitorRankMatrix[selectedCompetitor]
                    : Array.from(getCompetitorRankings(selectedCompetitor).values());
                  const valid = ranks.filter((r: number) => r < 999).length;
                  const total = gridData.gridPoints.length || 1;
                  cov = Math.min(100, Math.max(0, (valid / total) * 100));
                } else if (gridData.targetBusiness) {
                  cov = Math.min(100, Math.max(0, gridData.targetBusiness.coverage));
                }
                const covClass = cov > 50 ? 'text-green-400' : cov > 25 ? 'text-yellow-400' : 'text-red-400';
                return <p className={`text-lg font-bold ${covClass}`}>{cov.toFixed(1)}%</p>;
              })()}
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-400">Avg Rank</p>
              {(() => {
                let avg = 999;
                if (selectedCompetitor) {
                  const ranks = gridData.competitorRankMatrix && gridData.competitorRankMatrix[selectedCompetitor]
                    ? gridData.competitorRankMatrix[selectedCompetitor]
                    : Array.from(getCompetitorRankings(selectedCompetitor).values());
                  const valid = ranks.filter((r: number) => r < 999);
                  avg = valid.length ? valid.reduce((a: number, b: number) => a + b, 0) / valid.length : 999;
                } else if (gridData.targetBusiness) {
                  avg = gridData.targetBusiness.avgRank;
                }
                return (
                  <p className={`text-lg font-bold ${getRankColorClass(avg)}`}>
                    #{isNaN(avg as any) || avg === 999 ? 'N/A' : (avg as number).toFixed(0)}
                  </p>
                );
              })()}
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-400">Best Position</p>
              {(() => {
                let best = 999;
                if (selectedCompetitor) {
                  const ranks = gridData.competitorRankMatrix && gridData.competitorRankMatrix[selectedCompetitor]
                    ? gridData.competitorRankMatrix[selectedCompetitor]
                    : Array.from(getCompetitorRankings(selectedCompetitor).values());
                  const valid = ranks.filter((r: number) => r < 999);
                  best = valid.length ? Math.min(...valid) : 999;
                } else if (gridData.targetBusiness) {
                  best = gridData.targetBusiness.bestRank;
                }
                return (
                  <p className={`text-lg font-bold ${getRankColorClass(best)}`}>
                    #{best === 999 ? 'N/A' : best}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Google Maps Heat Map with Competitors */}
        <div className="space-y-3 mb-12">
          <h3 className="text-lg font-semibold text-white">Ranking Heat Map</h3>

          {/* Map Container with Right Side Competitors */}
          <div className="relative">
            {/* The Google Map - Full Width */}
            <div 
              ref={mapRef}
              className="w-full rounded-lg shadow-xl"
              style={{ height: 'calc(100vh - 160px)', minHeight: 'calc(100vh - 160px)', backgroundColor: '#0b0f1a' }}
            />
            
            {/* Overlay Info Box - Bottom Left - More Prominent */}
            <div className="absolute bottom-6 left-3 bg-gradient-to-br from-purple-900/95 to-gray-900/95 backdrop-blur-sm rounded-xl p-4 max-w-sm border-2 border-purple-500/70 shadow-2xl shadow-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                {selectedCompetitor ? (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                ) : businessName ? (
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                ) : (
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                )}
                <p className="text-base text-white font-bold">
                  {selectedCompetitor || businessName || `${gridData.searchTerm || 'Business'} Search`}
                </p>
              </div>
              
              {selectedCompetitor && (
                <div className="bg-black/30 rounded-lg p-2 mb-2">
                  <p className="text-sm text-yellow-400 font-semibold mb-1">
                    📊 Viewing Heat Map
                  </p>
                  <p className="text-xs text-white">
                    {(() => {
                      const comp = gridData.competitors.find(c => c.name === selectedCompetitor);
                      const idx = gridData.competitors.findIndex(c => c.name === selectedCompetitor);
                      return comp ? (
                        <>
                          <span className="text-purple-300">Rank #{idx + 1}</span> by coverage •{' '}
                          <span className="text-green-300">{comp.coverage}%</span> coverage •{' '}
                          <span className="text-yellow-300">Avg #{comp.avgRank}</span>
                        </>
                      ) : 'Loading...';
                    })()}
                  </p>
                </div>
              )}
              
              <div className="bg-purple-800/30 rounded-lg px-2 py-1 mb-3">
                <p className="text-xs text-purple-200 font-semibold">
                  📍 5 Mile Radius • 🔍 169 search points • ⚡ 13x13 grid
                </p>
              </div>
              
              {selectedCompetitor && (
                <label className="flex items-center gap-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg p-2 cursor-pointer transition-colors border border-purple-500/50">
                  <input
                    type="checkbox"
                    checked={showAllCompetitors}
                    onChange={(e) => setShowAllCompetitors(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white font-medium">Show all competitors on map</span>
                </label>
              )}
            </div>

            {/* Top Competitors - Overlay on Right Side */}
            <div className="absolute top-3 right-3 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 w-80 border border-purple-600/50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Top Competitors by Coverage</h3>
                {selectedCompetitor && (
                  <button
                    onClick={() => setSelectedCompetitor(null)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {gridData.competitors.slice(0, expandedCompetitorCount).map((comp, idx) => {
                  const cov = Math.min(100, Math.max(0, parseFloat(String(comp.coverage))));
                  const isSelected = selectedCompetitor === comp.name;
                  const covColor = cov > 75 ? '#10b981' : cov > 50 ? '#eab308' : cov > 25 ? '#f97316' : '#ef4444';
                  return (
                    <div
                      key={idx}
                      className={`bg-gray-800/80 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:bg-gray-700/80 transition-colors border ${
                        isSelected ? 'ring-2 ring-purple-500 border-purple-500' : 'border-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedCompetitor(comp.name === selectedCompetitor ? null : comp.name);
                        if (comp.name !== selectedCompetitor) {
                          setShowAllCompetitors(false); // Hide other competitors when selecting one
                        }
                      }}
                      aria-current={isSelected ? 'true' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span className="shrink-0" style={{ width: 8, height: 8, borderRadius: '9999px', backgroundColor: covColor }} />
                        <span className={`text-xs font-bold ${
                          idx === 0 ? 'text-yellow-400' :
                          idx === 1 ? 'text-gray-300' :
                          idx === 2 ? 'text-orange-400' :
                          'text-gray-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        {isSelected && <Eye className="w-3 h-3 text-purple-400" />}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{comp.name}</p>
                          <p className="text-xs text-gray-400">
                            ⭐ {comp.rating} • {comp.reviews} reviews
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <span className="inline-block text-xs text-purple-200 font-semibold" style={{ backgroundColor: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.5)', padding: '2px 6px', borderRadius: '9999px' }}>{cov.toFixed(1)}%</span>
                        {isSelected && (
                          <p className="text-[10px] text-purple-300 font-semibold mt-0.5">Viewing</p>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
                {gridData.competitors.length > 5 && (
                  <button
                    onClick={() => setExpandedCompetitorCount(expandedCompetitorCount === 5 ? 20 : 5)}
                    className="w-full mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {expandedCompetitorCount === 5 ? `Show All (${Math.min(20, gridData.competitors.length)})` : 'Show Less'}
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Insights - Moved below map with proper spacing */}
        <div style={{ marginTop: '180px', paddingTop: '60px' }}>
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-purple-400 mt-0.5" />
            <div className="space-y-3 flex-1">
              <h3 className="text-xl font-bold text-white">Key Insights</h3>
              <div className="space-y-3 mb-12">
                {gridData.targetBusiness && gridData.targetBusiness.coverage < 25 && (
                  <div className="bg-red-900/20 border-l-4 border-red-500 pl-4 py-2 rounded">
                    <p className="text-white font-semibold">
                      ⚠️ Critical Visibility Issue
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      Your business appears in only <span className="text-red-400 font-bold">{gridData.targetBusiness.coverage.toFixed(1)}%</span> of searches
                    </p>
                  </div>
                )}
                {gridData.targetBusiness && gridData.targetBusiness.avgRank > 10 && (
                  <div className="bg-orange-900/20 border-l-4 border-orange-500 pl-4 py-2 rounded">
                    <p className="text-white font-semibold">
                      📉 Poor Average Ranking
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      Average rank of <span className="text-orange-400 font-bold">#{gridData.targetBusiness.avgRank.toFixed(0)}</span> means you're missing 90% of potential customers
                    </p>
                  </div>
                )}
                {gridData.competitors[0] && Math.min(100, Math.max(0, parseFloat(String(gridData.competitors[0].coverage)))) > 90 && (
                  <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-900/10 border-l-4 border-yellow-500 pl-4 py-2 rounded">
                    <p className="text-white font-semibold">
                      👑 Market Leader 👑
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      <span className="text-yellow-400 font-bold">✨ {gridData.competitors[0].name} ✨</span> dominates with {Math.min(100, Math.max(0, parseFloat(String(gridData.competitors[0].coverage)))).toFixed(1)}% coverage
                    </p>
                  </div>
                )}
                <div className="bg-blue-900/20 border-l-4 border-blue-500 pl-4 py-2 rounded">
                  <p className="text-white font-semibold">
                    🏢 Competitive Landscape
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    Found <span className="text-blue-400 font-bold">{gridData.summary.totalUniqueBusinesses}</span> total competitors in your market
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
