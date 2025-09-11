'use client';

import { useState } from 'react';
import { MapPin, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
    targetBusiness: {
      name: string;
      coverage: number;
      pointsFound: number;
      totalPoints: number;
      avgRank: number;
      bestRank: number;
      worstRank: number;
    };
    competitors: Array<{
      name: string;
      rating: number;
      reviews: number;
      appearances: number;
      avgRank: string;
      coverage: string;
    }>;
    summary: {
      totalUniqueBusinesses: number;
      successRate: string;
      executionTime: number;
    };
  };
  businessName: string;
}

export default function ResultsSectionV3({ gridData, businessName }: ResultsSectionV3Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridPoint | null>(null);

  // Color coding for rank positions
  const getRankColor = (rank: number) => {
    if (rank === 999) return 'bg-gray-800'; // Not found
    if (rank <= 3) return 'bg-green-500'; // Top 3
    if (rank <= 10) return 'bg-yellow-500'; // Top 10
    if (rank <= 20) return 'bg-orange-500'; // Top 20
    return 'bg-red-500'; // Beyond top 20
  };

  const getRankColorClass = (rank: number) => {
    if (rank === 999) return 'text-gray-500';
    if (rank <= 3) return 'text-green-400';
    if (rank <= 10) return 'text-yellow-400';
    if (rank <= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  // Create 13x13 grid matrix
  const gridMatrix: (GridPoint | null)[][] = Array(13).fill(null).map(() => Array(13).fill(null));
  gridData.gridPoints.forEach(point => {
    gridMatrix[point.gridRow][point.gridCol] = point;
  });

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-6">
      {/* Header with Coverage Stats */}
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          Grid Search Results - {businessName}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Coverage</p>
            <p className={`text-xl font-bold ${
              gridData.targetBusiness.coverage > 50 ? 'text-green-400' : 
              gridData.targetBusiness.coverage > 25 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {gridData.targetBusiness.coverage.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Avg Rank</p>
            <p className={`text-xl font-bold ${getRankColorClass(gridData.targetBusiness.avgRank)}`}>
              #{gridData.targetBusiness.avgRank.toFixed(0)}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Best Position</p>
            <p className={`text-xl font-bold ${getRankColorClass(gridData.targetBusiness.bestRank)}`}>
              #{gridData.targetBusiness.bestRank}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Competitors</p>
            <p className="text-xl font-bold text-blue-400">
              {gridData.summary.totalUniqueBusinesses}
            </p>
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Ranking Heat Map</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-400">1-3</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-400">4-10</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-400">11-20</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-400">21+</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-800 rounded"></div>
              <span className="text-gray-400">Not Found</span>
            </span>
          </div>
        </div>

        {/* The Grid */}
        <div className="p-4 rounded-lg overflow-x-auto">
          <div className="grid grid-cols-13 gap-2 min-w-[650px]">
            {gridMatrix.map((row, rowIdx) => 
              row.map((cell, colIdx) => {
                const key = `${rowIdx}-${colIdx}`;
                if (!cell) {
                  return <div key={key} className="w-12 h-12 bg-gray-800 rounded-md"></div>;
                }
                
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCell(cell)}
                    className={`w-12 h-12 rounded-md transition-all hover:scale-110 hover:z-10 relative group ${getRankColor(cell.targetRank)}`}
                    title={`Rank: ${cell.targetRank === 999 ? 'Not Found' : `#${cell.targetRank}`}`}
                  >
                    {/* Always show rank */}
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                      {cell.targetRank === 999 ? '—' : cell.targetRank}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Grid Labels */}
          <div className="mt-2 text-center text-xs text-gray-500">
            5 Mile Radius Grid (13x13 = 169 search points)
          </div>
        </div>

        {/* Selected Cell Details */}
        {selectedCell && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Grid Point ({selectedCell.gridRow}, {selectedCell.gridCol})
              </h4>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Your Rank Here</p>
                <p className={`font-bold ${getRankColorClass(selectedCell.targetRank)}`}>
                  {selectedCell.targetRank === 999 ? 'Not Found' : `#${selectedCell.targetRank}`}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Results</p>
                <p className="text-white font-bold">{selectedCell.totalResults}</p>
              </div>
            </div>

            {selectedCell.topCompetitors.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Top 5 at this location:</p>
                <div className="space-y-1">
                  {selectedCell.topCompetitors.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">
                        #{comp.rank} {comp.name.substring(0, 30)}...
                      </span>
                      <span className="text-gray-500">
                        ⭐ {comp.rating} ({comp.reviews})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Competitors */}
      <div className="space-y-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-white">Top Competitors by Coverage</h3>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showDetails && (
          <div className="space-y-2">
            {gridData.competitors.slice(0, 10).map((comp, idx) => (
              <div
                key={idx}
                className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${
                    idx === 0 ? 'text-gold-400' :
                    idx === 1 ? 'text-gray-300' :
                    idx === 2 ? 'text-orange-600' :
                    'text-gray-500'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{comp.name}</p>
                    <p className="text-xs text-gray-400">
                      ⭐ {comp.rating} • {comp.reviews} reviews • Avg rank: #{comp.avgRank}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    parseFloat(comp.coverage) > 75 ? 'text-green-400' :
                    parseFloat(comp.coverage) > 50 ? 'text-yellow-400' :
                    'text-orange-400'
                  }`}>
                    {comp.coverage}%
                  </p>
                  <p className="text-xs text-gray-500">coverage</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="text-blue-300 font-semibold">Key Insights:</p>
            <ul className="text-gray-300 space-y-1">
              {gridData.targetBusiness.coverage < 25 && (
                <li>• Your business appears in only {gridData.targetBusiness.coverage.toFixed(1)}% of searches - significant visibility issues</li>
              )}
              {gridData.targetBusiness.avgRank > 10 && (
                <li>• Average rank of #{gridData.targetBusiness.avgRank.toFixed(0)} means you\'re missing 90% of potential customers</li>
              )}
              {gridData.competitors[0] && parseFloat(gridData.competitors[0].coverage) > 90 && (
                <li>• {gridData.competitors[0].name} dominates with {gridData.competitors[0].coverage}% coverage</li>
              )}
              <li>• Found {gridData.summary.totalUniqueBusinesses} total competitors in your market</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}