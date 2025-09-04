'use client';

import React, { memo } from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

// Individual Business Card Skeleton
const BusinessCardSkeleton = memo(({ className = '' }: SkeletonLoaderProps) => (
  <div className={`skeleton-card ${className}`}>
    {/* Header with name and rating */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="skeleton-item skeleton-title w-3/4" />
        <div className="flex items-center gap-2 mt-2">
          <div className="skeleton-item w-20 h-4 rounded" />
          <div className="skeleton-item w-16 h-4 rounded" />
        </div>
      </div>
      <div className="skeleton-item w-10 h-10 rounded-full" />
    </div>

    {/* Badge */}
    <div className="skeleton-item w-20 h-6 rounded-full mb-3" />

    {/* Address */}
    <div className="flex items-center gap-2 mb-2">
      <div className="skeleton-item w-4 h-4 rounded" />
      <div className="skeleton-item skeleton-text w-2/3" />
    </div>

    {/* Phone */}
    <div className="flex items-center gap-2 mb-2">
      <div className="skeleton-item w-4 h-4 rounded" />
      <div className="skeleton-item skeleton-text w-1/2" />
    </div>

    {/* Website */}
    <div className="flex items-center gap-2 mb-4">
      <div className="skeleton-item w-4 h-4 rounded" />
      <div className="skeleton-item skeleton-text w-1/3" />
    </div>

    {/* Action buttons */}
    <div className="flex gap-2">
      <div className="skeleton-item h-10 w-20 rounded-lg" />
      <div className="skeleton-item h-10 w-24 rounded-lg" />
    </div>
  </div>
));

BusinessCardSkeleton.displayName = 'BusinessCardSkeleton';

// Grid of skeleton cards
interface GridSkeletonProps extends SkeletonLoaderProps {
  count?: number;
  showRanks?: boolean;
}

const GridSkeleton = memo(({ count = 6, className = '', showRanks = true }: GridSkeletonProps) => (
  <div className={`directory-grid ${className}`}>
    {Array.from({ length: count }, (_, index) => (
      <BusinessCardSkeleton key={index} />
    ))}
  </div>
));

GridSkeleton.displayName = 'GridSkeleton';

// Search results skeleton
const SearchResultsSkeleton = memo(({ count = 5, className = '' }: GridSkeletonProps) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Business Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                {/* Business name */}
                <div className="skeleton-item h-6 w-3/4 mb-2 rounded" />
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton-item w-20 h-4 rounded" />
                  <div className="skeleton-item w-16 h-4 rounded" />
                  <div className="skeleton-item w-20 h-6 rounded-full" />
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton-item w-4 h-4 rounded" />
                  <div className="skeleton-item h-4 w-2/3 rounded" />
                </div>

                {/* Contact info */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="skeleton-item w-4 h-4 rounded" />
                    <div className="skeleton-item h-4 w-24 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="skeleton-item w-4 h-4 rounded" />
                    <div className="skeleton-item h-4 w-20 rounded" />
                  </div>
                </div>
              </div>

              {/* Rank badge */}
              <div className="skeleton-item w-12 h-12 rounded-full" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <div className="skeleton-item h-10 w-16 rounded-lg" />
            <div className="skeleton-item h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

SearchResultsSkeleton.displayName = 'SearchResultsSkeleton';

// Filter panel skeleton
const FilterPanelSkeleton = memo(({ className = '' }: SkeletonLoaderProps) => (
  <div className={`bg-white border-b border-gray-200 p-4 ${className}`}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sort skeleton */}
      <div>
        <div className="skeleton-item h-4 w-16 mb-2 rounded" />
        <div className="skeleton-item h-10 w-full rounded-lg" />
      </div>
      
      {/* Rating filter skeleton */}
      <div>
        <div className="skeleton-item h-4 w-24 mb-2 rounded" />
        <div className="skeleton-item h-10 w-full rounded-lg" />
      </div>
      
      {/* Checkbox skeleton */}
      <div>
        <div className="skeleton-item h-4 w-16 mb-2 rounded" />
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <div className="skeleton-item w-4 h-4 rounded" />
          <div className="skeleton-item h-4 w-32 rounded" />
        </div>
      </div>
    </div>
  </div>
));

FilterPanelSkeleton.displayName = 'FilterPanelSkeleton';

// Loading spinner component
const LoadingSpinner = memo(({ className = '' }: SkeletonLoaderProps) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="loading-spinner" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Page skeleton that combines multiple elements
interface PageSkeletonProps extends SkeletonLoaderProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showGrid?: boolean;
  showSearchResults?: boolean;
  cardCount?: number;
}

const PageSkeleton = memo(({
  className = '',
  showHeader = true,
  showFilters = true,
  showGrid = true,
  showSearchResults = false,
  cardCount = 6
}: PageSkeletonProps) => (
  <div className={`min-h-screen bg-black ${className}`}>
    {/* Header skeleton */}
    {showHeader && (
      <div className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-8">
            <div className="skeleton-item h-4 w-16 rounded" />
            <div className="skeleton-item h-4 w-4 rounded" />
            <div className="skeleton-item h-4 w-20 rounded" />
            <div className="skeleton-item h-4 w-4 rounded" />
            <div className="skeleton-item h-4 w-24 rounded" />
          </div>
          
          {/* Title skeleton */}
          <div className="skeleton-item h-12 w-2/3 mb-6 rounded" />
          <div className="skeleton-item h-6 w-3/4 mb-8 rounded" />
          
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="skeleton-item w-5 h-5 rounded" />
                  <div className="skeleton-item h-8 w-12 rounded" />
                </div>
                <div className="skeleton-item h-4 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Filter skeleton */}
    {showFilters && <FilterPanelSkeleton />}

    {/* Content skeleton */}
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {showSearchResults ? (
          <SearchResultsSkeleton count={cardCount} />
        ) : showGrid ? (
          <GridSkeleton count={cardCount} />
        ) : null}
      </div>
    </div>
  </div>
));

PageSkeleton.displayName = 'PageSkeleton';

// Export all skeleton components
export {
  BusinessCardSkeleton,
  GridSkeleton,
  SearchResultsSkeleton,
  FilterPanelSkeleton,
  LoadingSpinner,
  PageSkeleton
};

export default {
  BusinessCard: BusinessCardSkeleton,
  Grid: GridSkeleton,
  SearchResults: SearchResultsSkeleton,
  FilterPanel: FilterPanelSkeleton,
  Spinner: LoadingSpinner,
  Page: PageSkeleton
};

export type { 
  SkeletonLoaderProps, 
  GridSkeletonProps,
  PageSkeletonProps
};