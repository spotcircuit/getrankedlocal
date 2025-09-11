'use client';

import React from 'react';

interface Business {
  name: string;
  placeId?: string;
  rating?: number;
  reviews?: number;
  appearances?: number;
  coverage?: string | number;
  avgRank?: string | number;
  address?: string;
}

interface GridBusinessListProps {
  businesses: Business[];
  selectedBusiness?: string;
  onBusinessSelect: (business: Business) => void;
  title?: string;
}

export default function GridBusinessList({ 
  businesses, 
  selectedBusiness, 
  onBusinessSelect,
  title = "All Businesses Found"
}: GridBusinessListProps) {
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border border-purple-600/50">
      <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center justify-between">
        {title}
        <span className="text-sm text-gray-400">({businesses.length} total)</span>
      </h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {businesses.map((business, index) => {
          const isSelected = selectedBusiness === business.name;
          
          return (
            <div
              key={`${business.placeId || business.name}-${index}`}
              onClick={() => onBusinessSelect(business)}
              className={`
                p-3 rounded-lg cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'bg-purple-600/30 border-2 border-purple-500 shadow-lg shadow-purple-500/20' 
                  : 'bg-gray-800/80 border border-gray-700 hover:bg-gray-800 hover:border-purple-500/50'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`
                      text-sm font-bold 
                      ${isSelected ? 'text-purple-300' : 'text-gray-400'}
                    `}>
                      #{index + 1}
                    </span>
                    <h4 className={`
                      font-medium truncate flex-1
                      ${isSelected ? 'text-white' : 'text-gray-200'}
                    `}>
                      {business.name}
                    </h4>
                  </div>
                  
                  <div className="flex gap-3 mt-1 text-xs">
                    {business.rating && (
                      <span className="text-yellow-500">
                        ⭐ {business.rating}
                      </span>
                    )}
                    {business.reviews !== undefined && (
                      <span className="text-gray-400">
                        {business.reviews} reviews
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-2">
                  {business.coverage && (
                    <div className={`
                      text-sm font-medium
                      ${isSelected ? 'text-purple-300' : 'text-purple-400'}
                    `}>
                      {typeof business.coverage === 'number' 
                        ? `${business.coverage.toFixed(1)}%` 
                        : business.coverage
                      }
                    </div>
                  )}
                  {business.avgRank && (
                    <div className="text-xs text-gray-400">
                      Avg #{typeof business.avgRank === 'number' 
                        ? business.avgRank.toFixed(1) 
                        : business.avgRank
                      }
                    </div>
                  )}
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-purple-500/30">
                  <p className="text-xs text-purple-300">
                    Click to analyze this business's grid performance
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          💡 Click any business to see their heat map and detailed analysis
        </p>
      </div>
    </div>
  );
}