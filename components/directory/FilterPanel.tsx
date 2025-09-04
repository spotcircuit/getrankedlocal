'use client';

import React, { memo, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, SortAsc } from 'lucide-react';

export type SortOption = 'rating' | 'reviews' | 'alphabetical';

export interface FilterOptions {
  sortBy: SortOption;
  minRating: number;
  showTopRated: boolean;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
  businessCount?: number;
  filteredCount?: number;
}

const FilterPanel = memo(({
  filters,
  onFiltersChange,
  className = '',
  businessCount = 0,
  filteredCount = 0
}: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-expand on desktop
      if (window.innerWidth >= 768) {
        setIsExpanded(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSortChange = (sortBy: SortOption) => {
    onFiltersChange({
      ...filters,
      sortBy
    });
  };

  const handleMinRatingChange = (minRating: number) => {
    onFiltersChange({
      ...filters,
      minRating
    });
  };

  const handleTopRatedToggle = () => {
    onFiltersChange({
      ...filters,
      showTopRated: !filters.showTopRated
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      sortBy: 'rating',
      minRating: 0,
      showTopRated: false
    });
  };

  const hasActiveFilters = filters.minRating > 0 || filters.showTopRated;

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* Toggle Button (Mobile Only) */}
      {isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="filter-toggle"
          aria-expanded={isExpanded}
          aria-controls="filter-content"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filters & Sort</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-600 text-white text-xs rounded-full">
                {(filters.minRating > 0 ? 1 : 0) + (filters.showTopRated ? 1 : 0)}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Filter Content */}
      <div id="filter-content" className="filter-content">
        {/* Sort Options */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <SortAsc className="w-4 h-4" />
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="filter-select"
            aria-label="Sort businesses by"
          >
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviews</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Minimum Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) => handleMinRatingChange(Number(e.target.value))}
            className="filter-select"
            aria-label="Filter by minimum rating"
          >
            <option value={0}>Any Rating</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>

        {/* Top Rated Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filters
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={filters.showTopRated}
              onChange={handleTopRatedToggle}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Top Rated Only (4.5+ stars)
            </span>
          </label>
        </div>

        {/* Results Summary & Reset */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCount.toLocaleString()} of {businessCount.toLocaleString()} businesses
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 border border-purple-600 hover:border-purple-700 rounded-md transition-colors"
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
export type { FilterPanelProps };