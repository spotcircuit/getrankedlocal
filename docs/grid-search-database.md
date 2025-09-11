# Grid Search Database Schema

## Overview

The Grid Search Analysis System uses 5 specialized PostgreSQL tables to store and analyze 169-point geographic market intelligence data. These tables are optimized for bulk insert operations and complex geographic analytics.

## Table Relationships

```
grid_searches (1) ←→ (many) grid_competitors
grid_searches (1) ←→ (many) grid_cells  
grid_searches (1) ←→ (many) grid_point_results
grid_competitors (1) ←→ (many) grid_point_results
```

## Table Schemas

### 1. `grid_searches` Table

Master records for each 169-point grid search execution.

```sql
CREATE TABLE IF NOT EXISTS grid_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Search parameters
  search_term VARCHAR(255) NOT NULL,
  center_lat DECIMAL(10, 7) NOT NULL,
  center_lng DECIMAL(10, 7) NOT NULL,
  search_radius_miles DECIMAL(4,2) DEFAULT 5.0,
  
  -- Grid configuration
  grid_size INTEGER DEFAULT 169,
  grid_rows INTEGER DEFAULT 13,
  grid_cols INTEGER DEFAULT 13,
  
  -- Business context (optional - for targeted searches)
  initiated_by_place_id VARCHAR(255),
  initiated_by_name VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Execution statistics
  total_unique_businesses INTEGER,
  avg_businesses_per_point DECIMAL(5,2),
  max_businesses_per_point INTEGER,
  min_businesses_per_point INTEGER,
  total_search_results INTEGER,
  execution_time_seconds INTEGER,
  success_rate DECIMAL(5,2),
  
  -- Technical metadata
  session_id VARCHAR(255),
  raw_config JSONB
);
```

**Key Indexes:**
```sql
CREATE INDEX idx_grid_searches_term ON grid_searches(search_term);
CREATE INDEX idx_grid_searches_location ON grid_searches(center_lat, center_lng);
CREATE INDEX idx_grid_searches_session ON grid_searches(session_id);
CREATE INDEX idx_grid_searches_created ON grid_searches(created_at DESC);
```

### 2. `grid_competitors` Table

All unique businesses discovered across the grid, using place_id for deduplication.

```sql
CREATE TABLE IF NOT EXISTS grid_competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  -- Business identification (CRITICAL: place_id is the unique key)
  place_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Business details (captured at time of search)
  rating DECIMAL(2, 1),
  reviews INTEGER,
  business_lat DECIMAL(10, 7),
  business_lng DECIMAL(10, 7),
  address TEXT,
  
  -- Performance analytics across all grid points
  appearances INTEGER,                    -- Number of grid points where business appears
  coverage_percent DECIMAL(5, 2),       -- Percentage coverage across grid
  avg_rank DECIMAL(5, 2),               -- Average ranking across all appearances
  best_rank INTEGER,                     -- Best ranking achieved in grid
  worst_rank INTEGER,                    -- Worst ranking found in grid
  top_3_count INTEGER,                   -- Number of top-3 rankings
  top_10_count INTEGER,                  -- Number of top-10 rankings  
  first_place_count INTEGER,             -- Number of #1 rankings
  
  -- Geographic distribution analysis
  north_appearances INTEGER,             -- Appearances in northern quadrant (rows 0-5)
  south_appearances INTEGER,             -- Appearances in southern quadrant (rows 7-12)
  east_appearances INTEGER,              -- Appearances in eastern quadrant (cols 7-12)
  west_appearances INTEGER,              -- Appearances in western quadrant (cols 0-5)
  center_appearances INTEGER,            -- Appearances in center area (rows 5-7, cols 5-7)
  
  UNIQUE(search_id, place_id)
);
```

**Key Indexes:**
```sql
CREATE INDEX idx_grid_competitors_search ON grid_competitors(search_id);
CREATE INDEX idx_grid_competitors_place_id ON grid_competitors(place_id);
CREATE INDEX idx_grid_competitors_coverage ON grid_competitors(coverage_percent DESC);
CREATE INDEX idx_grid_competitors_rank ON grid_competitors(avg_rank ASC);
CREATE INDEX idx_grid_competitors_name ON grid_competitors(name);
```

### 3. `grid_point_results` Table

Individual business rankings at specific grid coordinates. This is the largest table containing detailed ranking data.

```sql
CREATE TABLE IF NOT EXISTS grid_point_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES grid_competitors(id) ON DELETE CASCADE,
  
  -- Grid location
  grid_row INTEGER NOT NULL,              -- 0-12 for 13x13 grid
  grid_col INTEGER NOT NULL,              -- 0-12 for 13x13 grid
  grid_index INTEGER NOT NULL,            -- 0-168 for linear indexing (row * 13 + col)
  lat DECIMAL(10, 7) NOT NULL,           -- Actual coordinates of grid point
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Ranking performance at this specific location
  rank_position INTEGER NOT NULL,        -- Business ranking at this grid point (1-20 typically)
  total_results_at_point INTEGER,        -- Total competitors found at this location
  distance_from_business_miles DECIMAL(5, 2)  -- Distance from actual business location
);
```

**Key Indexes:**
```sql
CREATE INDEX idx_grid_point_results_search ON grid_point_results(search_id);
CREATE INDEX idx_grid_point_results_competitor ON grid_point_results(competitor_id);
CREATE INDEX idx_grid_point_results_grid_pos ON grid_point_results(grid_row, grid_col);
CREATE INDEX idx_grid_point_results_rank ON grid_point_results(rank_position);
CREATE INDEX idx_grid_point_results_location ON grid_point_results(lat, lng);
```

### 4. `grid_cells` Table

Metadata about each grid cell including competition density and top performers.

```sql
CREATE TABLE IF NOT EXISTS grid_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Cell statistics
  total_businesses INTEGER,                           -- Total businesses found at this cell
  competition_level VARCHAR(20),                      -- 'low', 'medium', 'high', 'very_high'
  top_3_competitors JSONB                            -- Top 3 businesses with details
);
```

**Key Indexes:**
```sql
CREATE INDEX idx_grid_cells_search ON grid_cells(search_id);
CREATE INDEX idx_grid_cells_grid_pos ON grid_cells(grid_row, grid_col);
CREATE INDEX idx_grid_cells_competition ON grid_cells(competition_level);
CREATE INDEX idx_grid_cells_location ON grid_cells(lat, lng);
```

## Bulk Insert Optimization

The system is designed for high-performance bulk insert operations:

```sql
-- Example bulk insert for competitors (used in grid-search-storage-optimized.ts)
INSERT INTO grid_competitors (
  search_id, place_id, name, rating, reviews,
  business_lat, business_lng, address, appearances,
  coverage_percent, avg_rank, best_rank, worst_rank,
  top_3_count, top_10_count, first_place_count,
  north_appearances, south_appearances, 
  east_appearances, west_appearances, center_appearances
) VALUES 
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21),
  -- ... up to 1000 records per batch
```

### Batch Processing Strategy

1. **Competitors**: Single bulk insert for all unique businesses
2. **Grid Point Results**: Batched in groups of 1000 records
3. **Grid Cells**: Single bulk insert for all 169 cells
4. **Transaction Safety**: All inserts wrapped in transactions for atomicity

## Data Flow and Processing

### 1. Raw Data Processing
```javascript
// Extract all unique businesses using place_id
const allBusinesses = new Map();
data.rawResults.forEach(point => {
  point.results.forEach(biz => {
    const placeId = biz.place_id || `${biz.name}_${point.lat}_${point.lng}`;
    if (!allBusinesses.has(placeId)) {
      allBusinesses.set(placeId, {
        placeId, name: biz.name, rating: biz.rating,
        reviews: biz.reviews, appearances: 0, ranks: []
      });
    }
    allBusinesses.get(placeId).appearances++;
    allBusinesses.get(placeId).ranks.push(biz.rank);
  });
});
```

### 2. Statistical Calculations
```javascript
// Calculate performance statistics
const competitors = Array.from(allBusinesses.values()).map(biz => {
  const avgRank = biz.ranks.reduce((a, b) => a + b, 0) / biz.ranks.length;
  const coverage = (biz.appearances / 169) * 100;
  const top3Count = biz.ranks.filter(r => r <= 3).length;
  // ... additional calculations
});
```

### 3. Geographic Analysis
```javascript
// Analyze geographic distribution
const north = biz.gridPoints.filter(p => p.gridRow < 6).length;
const south = biz.gridPoints.filter(p => p.gridRow > 6).length;
const east = biz.gridPoints.filter(p => p.gridCol > 6).length;
const west = biz.gridPoints.filter(p => p.gridCol < 6).length;
const center = biz.gridPoints.filter(p => 
  p.gridRow >= 5 && p.gridRow <= 7 && p.gridCol >= 5 && p.gridCol <= 7
).length;
```

## Query Examples

### Most Dominant Competitors
```sql
SELECT 
  name, 
  coverage_percent, 
  avg_rank,
  first_place_count,
  appearances
FROM grid_competitors 
WHERE search_id = $1 
ORDER BY coverage_percent DESC, avg_rank ASC 
LIMIT 10;
```

### Geographic Performance Analysis  
```sql
SELECT 
  name,
  north_appearances,
  south_appearances, 
  east_appearances,
  west_appearances,
  center_appearances
FROM grid_competitors 
WHERE search_id = $1 AND appearances >= 50
ORDER BY coverage_percent DESC;
```

### Competition Density Heatmap
```sql
SELECT 
  grid_row,
  grid_col,
  lat,
  lng,
  total_businesses,
  competition_level,
  top_3_competitors
FROM grid_cells 
WHERE search_id = $1
ORDER BY grid_row, grid_col;
```

### Business Performance at Specific Location
```sql
SELECT 
  c.name,
  gpr.rank_position,
  gpr.total_results_at_point,
  gpr.distance_from_business_miles
FROM grid_point_results gpr
JOIN grid_competitors c ON gpr.competitor_id = c.id
WHERE gpr.search_id = $1 
  AND gpr.grid_row = $2 
  AND gpr.grid_col = $3
ORDER BY gpr.rank_position;
```

## Storage Considerations

### Typical Data Volume (per grid search)
- **1 search record** in `grid_searches`
- **50-150 unique businesses** in `grid_competitors` 
- **2000-4000 ranking records** in `grid_point_results`
- **169 cell records** in `grid_cells`

### Storage Estimates
- Small market: ~500KB per search
- Medium market: ~2MB per search  
- Large market: ~5MB per search
- 1000 searches: ~500MB to 5GB

## Performance Optimizations

### Database Level
- **UUID Primary Keys**: Distributed across nodes in clustered databases
- **Cascade Deletes**: Automatic cleanup of related records
- **Strategic Indexes**: Optimized for common query patterns
- **JSONB Fields**: Efficient storage and querying of structured data

### Application Level
- **Bulk Inserts**: 10x faster than individual inserts
- **Connection Pooling**: Neon serverless automatic scaling
- **Prepared Statements**: SQL injection prevention and performance
- **Transaction Batching**: Atomic operations for data consistency

## Maintenance and Monitoring

### Regular Maintenance
```sql
-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE tablename LIKE 'grid_%';

-- Clean up old searches (keep last 100)
DELETE FROM grid_searches 
WHERE id NOT IN (
  SELECT id FROM grid_searches 
  ORDER BY created_at DESC 
  LIMIT 100
);
```

### Index Monitoring
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename LIKE 'grid_%'
ORDER BY idx_scan DESC;
```