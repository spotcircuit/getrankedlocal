import { neon } from '@neondatabase/serverless';

export interface CollectionInfo {
  collection: string;
  destination: string;
  city: string;
  state: string;
  count: number;
}

export interface CollectionsByNiche {
  [niche: string]: {
    [state: string]: {
      [city: string]: CollectionInfo;
    };
  };
}

class CollectionRegistry {
  private collections: CollectionsByNiche = {};
  private lastRefresh: Date | null = null;
  private refreshInterval = 5 * 60 * 1000; // 5 minutes
  private isRefreshing = false;

  async initialize() {
    if (!process.env.DATABASE_URL) {
      console.warn('CollectionRegistry: No DATABASE_URL, using empty registry');
      return;
    }

    await this.refresh();
  }

  async refresh() {
    if (this.isRefreshing) return;
    
    try {
      this.isRefreshing = true;
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get all collections with their destinations and counts
      const results = await sql`
        WITH collection_stats AS (
          SELECT 
            search_collection as collection,
            search_destination as destination,
            COUNT(DISTINCT lead_id) as lead_count
          FROM lead_collections
          GROUP BY search_collection, search_destination
        ),
        prospect_stats AS (
          SELECT 
            search_niche as collection,
            CONCAT(
              UPPER(SUBSTRING(search_city, 1, 1)),
              LOWER(SUBSTRING(search_city, 2)),
              ', ',
              search_state
            ) as destination,
            COUNT(*) as prospect_count
          FROM prospects
          WHERE enrichment_status != 'promoted' OR enrichment_status IS NULL
          GROUP BY search_niche, search_city, search_state
        ),
        combined AS (
          SELECT 
            collection,
            destination,
            lead_count as count,
            'leads' as source
          FROM collection_stats
          
          UNION ALL
          
          SELECT 
            collection,
            destination,
            prospect_count as count,
            'prospects' as source
          FROM prospect_stats
        )
        SELECT 
          collection,
          destination,
          SUM(count)::int as total_count,
          SPLIT_PART(destination, ', ', 1) as city,
          SPLIT_PART(destination, ', ', 2) as state
        FROM combined
        GROUP BY collection, destination
        ORDER BY collection, state, city
      `;

      // Build the nested structure
      const newCollections: CollectionsByNiche = {};
      
      for (const row of results) {
        const collection = String(row.collection).toLowerCase();
        const city = String(row.city);
        const state = String(row.state);
        
        if (!newCollections[collection]) {
          newCollections[collection] = {};
        }
        if (!newCollections[collection][state]) {
          newCollections[collection][state] = {};
        }
        
        newCollections[collection][state][city] = {
          collection,
          destination: String(row.destination),
          city,
          state,
          count: row.total_count
        };
      }

      this.collections = newCollections;
      this.lastRefresh = new Date();
      
      console.log(`CollectionRegistry: Loaded ${Object.keys(newCollections).length} niches with ${results.length} total collections`);
      
      // Log summary
      for (const [niche, states] of Object.entries(newCollections)) {
        const totalCities = Object.values(states).reduce((sum, cities) => sum + Object.keys(cities).length, 0);
        console.log(`  - ${niche}: ${Object.keys(states).length} states, ${totalCities} cities`);
      }
      
    } catch (error) {
      console.error('CollectionRegistry: Failed to refresh', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  // Get all niches
  getNiches(): string[] {
    this.checkRefresh();
    return Object.keys(this.collections).sort();
  }

  // Get all states for a niche
  getStates(niche: string): string[] {
    this.checkRefresh();
    const normalizedNiche = this.normalizeNiche(niche);
    return Object.keys(this.collections[normalizedNiche] || {}).sort();
  }

  // Get all cities for a niche and state
  getCities(niche: string, state: string): CollectionInfo[] {
    this.checkRefresh();
    const normalizedNiche = this.normalizeNiche(niche);
    const stateUpper = state.toUpperCase();
    
    const cities = this.collections[normalizedNiche]?.[stateUpper] || {};
    return Object.values(cities).sort((a, b) => b.count - a.count);
  }

  // Get a specific collection
  getCollection(niche: string, state: string, city: string): CollectionInfo | null {
    this.checkRefresh();
    const normalizedNiche = this.normalizeNiche(niche);
    const stateUpper = state.toUpperCase();
    const cityTitle = this.titleCase(city);
    
    return this.collections[normalizedNiche]?.[stateUpper]?.[cityTitle] || null;
  }

  // Check if a collection exists
  hasCollection(niche: string, state: string, city: string): boolean {
    return this.getCollection(niche, state, city) !== null;
  }

  // Normalize niche names for consistency
  private normalizeNiche(niche: string): string {
    const n = niche.toLowerCase().replace(/[^a-z0-9]+/g, '');
    
    // Map variations to canonical forms
    if (n === 'medspas' || n === 'medspas') return 'med spas';
    if (n === 'hairsalons') return 'hair salons';
    if (n === 'lawfirms') return 'law firms';
    if (n === 'homeservices') return 'home services';
    if (n === 'marketingagencies') return 'marketing';
    
    return niche.toLowerCase();
  }

  private titleCase(str: string): string {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private checkRefresh() {
    if (!this.lastRefresh || 
        Date.now() - this.lastRefresh.getTime() > this.refreshInterval) {
      // Don't await, let it refresh in the background
      this.refresh().catch(console.error);
    }
  }

  // Get summary statistics
  getStats() {
    const niches = this.getNiches();
    let totalStates = 0;
    let totalCities = 0;
    let totalBusinesses = 0;

    for (const niche of niches) {
      const states = this.getStates(niche);
      totalStates += states.length;
      
      for (const state of states) {
        const cities = this.getCities(niche, state);
        totalCities += cities.length;
        totalBusinesses += cities.reduce((sum, city) => sum + city.count, 0);
      }
    }

    return {
      niches: niches.length,
      states: totalStates,
      cities: totalCities,
      businesses: totalBusinesses,
      lastRefresh: this.lastRefresh
    };
  }
}

// Singleton instance
let registryInstance: CollectionRegistry | null = null;

export async function getCollectionRegistry(): Promise<CollectionRegistry> {
  if (!registryInstance) {
    registryInstance = new CollectionRegistry();
    await registryInstance.initialize();
  }
  return registryInstance;
}

// For server startup
export async function initializeCollectionRegistry() {
  console.log('Initializing Collection Registry...');
  await getCollectionRegistry();
}