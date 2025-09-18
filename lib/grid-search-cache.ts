/**
 * Grid Search Caching Layer for Performance Optimization
 * Implements intelligent caching for repeated grid searches
 */

interface CacheKey {
  searchTerm: string;
  centerLat: number;
  centerLng: number;
  gridSize: number;
  radiusMiles: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  searchId: string;
  expirationTime: number;
}

class GridSearchCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100;

  private generateCacheKey(params: CacheKey): string {
    // Round coordinates to 4 decimal places for cache key consistency
    const lat = Math.round(params.centerLat * 10000) / 10000;
    const lng = Math.round(params.centerLng * 10000) / 10000;

    return `${params.searchTerm.toLowerCase()}_${lat}_${lng}_${params.gridSize}_${params.radiusMiles}`;
  }

  async get(params: CacheKey): Promise<any | null> {
    const key = this.generateCacheKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      console.log('🔍 Cache miss for grid search:', key);
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expirationTime) {
      console.log('⏰ Cache entry expired, removing:', key);
      this.cache.delete(key);
      return null;
    }

    console.log('⚡ Cache hit for grid search:', key);
    return entry.data;
  }

  async set(params: CacheKey, data: any, searchId: string, ttl?: number): Promise<void> {
    const key = this.generateCacheKey(params);
    const expirationTime = Date.now() + (ttl || this.DEFAULT_TTL);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log('🗑️ Evicted oldest cache entry:', oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      searchId,
      expirationTime
    });

    console.log('💾 Cached grid search result:', key);
  }

  async invalidate(params: CacheKey): Promise<void> {
    const key = this.generateCacheKey(params);
    this.cache.delete(key);
    console.log('🗑️ Invalidated cache entry:', key);
  }

  getCacheStats(): { size: number; hitRate: number; entries: string[] } {
    const entries = Array.from(this.cache.keys());
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries
    };
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expirationTime) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }
  }
}

// Singleton instance
export const gridSearchCache = new GridSearchCache();

// Auto cleanup every hour
setInterval(() => {
  gridSearchCache.cleanup();
}, 60 * 60 * 1000);