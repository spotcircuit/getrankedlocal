'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Trophy, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface GridPoint {
  rank: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
  lat: number;
  lng: number;
}

interface BusinessStats {
  coverage: string;
  average_rank: string;
  best_rank: number;
  worst_rank: number;
  top3_percentage: string;
}

interface HeatMapData {
  business: {
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
  };
  stats: BusinessStats;
  grid: (GridPoint | null)[][];
}

interface GridHeatMapProps {
  data: HeatMapData | HeatMapData[];
  targetBusiness?: string;
  city?: string;
  niche?: string;
}

export default function GridHeatMap({ data, targetBusiness, city = '', niche = 'your industry' }: GridHeatMapProps) {
  const [selectedBusiness, setSelectedBusiness] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  // Handle single or multiple heat maps
  const heatMaps = Array.isArray(data) ? data : [data];
  const currentMap = heatMaps[selectedBusiness] || heatMaps[0];
  
  if (!currentMap) return null;
  
  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-600';
      default: return 'bg-gray-700';
    }
  };
  
  const getColorHex = (color: string) => {
    switch (color) {
      case 'green': return '#10b981';
      case 'yellow': return '#eab308';
      case 'orange': return '#f97316';
      case 'red': return '#dc2626';
      default: return '#374151';
    }
  };
  
  const isTargetBusiness = targetBusiness && 
    currentMap.business.name.toLowerCase().includes(targetBusiness.toLowerCase());
  
  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {isTargetBusiness ? (
              <>Your <span className="text-purple-500">Local Visibility Map</span></>
            ) : (
              <>Competitor <span className="text-orange-500">Domination Map</span></>
            )}
          </h2>
          <p className="text-xl text-gray-400">
            {isTargetBusiness ? (
              `See where customers find you when searching for "${niche}" across ${city}`
            ) : (
              `How ${currentMap.business.name} dominates local searches in ${city}`
            )}
          </p>
        </motion.div>
        
        {/* Business Selector (if multiple) */}
        {heatMaps.length > 1 && (
          <div className="flex justify-center gap-4 mb-8">
            {heatMaps.map((map, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBusiness(idx)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedBusiness === idx
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {idx === 0 && <Trophy className="inline-block w-4 h-4 mr-2" />}
                {map.business.name}
              </button>
            ))}
          </div>
        )}
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Heat Map Grid */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-purple-400" />
                Search Result Heat Map
              </h3>
              
              {/* Grid Display */}
              <div className="relative">
                <div className="grid gap-1" style={{
                  gridTemplateColumns: `repeat(${currentMap.grid[0].length}, 1fr)`
                }}>
                  {currentMap.grid.flat().map((point, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square flex items-center justify-center text-xs font-bold rounded-sm transition-all hover:scale-110 ${
                        point ? getColorClass(point.color) : 'bg-gray-800'
                      }`}
                      title={point ? `Rank #${point.rank} at ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : 'No data'}
                    >
                      {point && point.rank <= 20 && (
                        <span className="text-white text-[10px]">{point.rank}</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Overlay for target business indicator */}
                {isTargetBusiness && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full border-4 border-purple-500 rounded-lg animate-pulse"></div>
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-300">Top 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-300">4-10</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm text-gray-300">11-20</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm text-gray-300">21+</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-800 rounded"></div>
                  <span className="text-sm text-gray-300">Not Listed</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Statistics Panel */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Performance Metrics
              </h3>
              
              <div className="space-y-4">
                {/* Coverage */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Market Coverage</span>
                    <span className="text-2xl font-bold text-white">{currentMap.stats.coverage}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                      style={{ width: currentMap.stats.coverage }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Visible in {currentMap.stats.coverage} of searches
                  </p>
                </div>
                
                {/* Average Rank */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Position</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      #{currentMap.stats.average_rank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Across all search points
                  </p>
                </div>
                
                {/* Rank Range */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rank Range</span>
                    <span className="text-lg font-bold text-white">
                      #{currentMap.stats.best_rank} - #{currentMap.stats.worst_rank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Best to worst position
                  </p>
                </div>
                
                {/* Top 3 Percentage */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Top 3 Rate</span>
                    <span className="text-2xl font-bold text-green-400">
                      {currentMap.stats.top3_percentage}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Appearing in top 3 results
                  </p>
                </div>
                
                {/* Business Details */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-4 bg-gray-800/50 rounded-lg text-left hover:bg-gray-800/70 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Business Details</span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-gray-800/50 rounded-lg space-y-2"
                  >
                    <p className="text-sm">
                      <span className="text-gray-400">Rating:</span>{' '}
                      <span className="text-yellow-400">★ {currentMap.business.rating || 'N/A'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-400">Reviews:</span>{' '}
                      <span className="text-white">{currentMap.business.reviews || 'N/A'}</span>
                    </p>
                    {currentMap.business.address && (
                      <p className="text-sm">
                        <span className="text-gray-400">Location:</span>{' '}
                        <span className="text-white text-xs">{currentMap.business.address}</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
              
              {/* Insights */}
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-300">
                      {isTargetBusiness ? 'Your Opportunity' : 'Competitor Strength'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isTargetBusiness ? (
                        parseFloat(currentMap.stats.coverage.replace('%', '')) < 50 ? (
                          `You're invisible to ${(100 - parseFloat(currentMap.stats.coverage.replace('%', ''))).toFixed(0)}% of potential customers searching in different areas`
                        ) : (
                          `Great coverage! Focus on improving rankings in yellow/red zones`
                        )
                      ) : (
                        `This competitor appears in ${currentMap.stats.coverage} of local searches, capturing significant market share`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Call to Action */}
        {isTargetBusiness && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-lg text-gray-400 mb-6">
              {parseFloat(currentMap.stats.coverage.replace('%', '')) < 75 ? (
                "You're missing out on customers in the gray and red zones"
              ) : (
                "Optimize your presence to dominate more search areas"
              )}
            </p>
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 text-white shadow-lg">
              Get Full Market Domination Strategy
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}