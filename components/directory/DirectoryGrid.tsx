'use client';

import React, { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import BusinessCard, { Business } from './BusinessCard';

interface DirectoryGridProps {
  businesses: Business[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  showRanks?: boolean;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
}

const DirectoryGrid = memo(({
  businesses,
  loading = false,
  onLoadMore,
  hasMore = false,
  itemHeight = 200, // Approximate height of each business card
  overscan = 5,
  className = '',
  showRanks = true
}: DirectoryGridProps) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  // Intersection Observer for lazy loading
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate virtual items based on scroll position
  const virtualItems = useMemo(() => {
    if (!containerHeight) return [];

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      businesses.length
    );

    const items: VirtualItem[] = [];
    for (let i = Math.max(0, startIndex - overscan); i < endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight
      });
    }

    return items;
  }, [scrollTop, containerHeight, itemHeight, overscan, businesses.length]);

  // Handle scroll events with throttling
  const handleScroll = useCallback(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop);
    }
  }, []);

  // Throttled scroll handler
  const throttledScrollHandler = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16); // ~60fps
    };
  }, [handleScroll]);

  // Set up scroll listener
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    element.addEventListener('scroll', throttledScrollHandler, { passive: true });
    return () => element.removeEventListener('scroll', throttledScrollHandler);
  }, [throttledScrollHandler]);

  // Measure container height
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  // Set up intersection observer for load more
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loading) {
          setIsIntersecting(true);
          onLoadMore();
        } else {
          setIsIntersecting(false);
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, loading]);

  const totalHeight = businesses.length * itemHeight;

  return (
    <div className={`directory-grid-container ${className}`}>
      <div
        ref={scrollElementRef}
        className="virtual-scroll-container"
        style={{
          height: '100%',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative'
          }}
        >
          {/* Render virtual items */}
          <div className="directory-grid">
            {virtualItems.map((virtualItem) => {
              const business = businesses[virtualItem.index];
              if (!business) return null;

              return (
                <div
                  key={`${business.id}-${virtualItem.index}`}
                  className="virtual-scroll-item"
                  style={{
                    position: 'absolute',
                    top: virtualItem.start,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    contain: 'layout',
                    willChange: 'transform'
                  }}
                >
                  <BusinessCard
                    business={business}
                    rank={showRanks ? virtualItem.index + 1 : undefined}
                    showRank={showRanks}
                    className="h-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Load more trigger */}
          {(hasMore || loading) && (
            <div
              ref={loadMoreRef}
              className="lazy-load-trigger"
              style={{
                position: 'absolute',
                top: totalHeight - 200,
                left: 0,
                right: 0,
                height: 200
              }}
            >
              {loading && (
                <div className="loading-spinner" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          <div>Rendered: {virtualItems.length} / {businesses.length}</div>
          <div>Scroll: {Math.round(scrollTop)}px</div>
          <div>Loading: {isIntersecting ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
});

DirectoryGrid.displayName = 'DirectoryGrid';

export default DirectoryGrid;
export type { DirectoryGridProps };