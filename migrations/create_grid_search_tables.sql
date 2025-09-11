-- Grid Search Storage Schema for Neon Database
-- Stores ALL businesses found in grid search, not just a target

-- ============================================
-- 1. MAIN GRID SEARCH TABLE
-- ============================================
-- Represents a single grid search execution
CREATE TABLE IF NOT EXISTS grid_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Search parameters
  search_term VARCHAR(255) NOT NULL,  -- What was searched (e.g., "medical spa", "dentist")
  center_lat DECIMAL(10, 7) NOT NULL,  -- Center point of search
  center_lng DECIMAL(10, 7) NOT NULL,
  search_radius_miles DECIMAL(4,2) DEFAULT 5.0,
  
  -- Grid configuration
  grid_size INTEGER DEFAULT 169,  -- Total grid points (13x13 = 169)
  grid_rows INTEGER DEFAULT 13,
  grid_cols INTEGER DEFAULT 13,
  
  -- Search context (optional - who initiated it)
  initiated_by_place_id VARCHAR(255),  -- If searching from a specific business perspective
  initiated_by_name VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Overall search statistics
  total_unique_businesses INTEGER,  -- Unique businesses found across all grid points
  avg_businesses_per_point DECIMAL(5, 2),  -- Average competition density
  max_businesses_per_point INTEGER,
  min_businesses_per_point INTEGER,
  total_search_results INTEGER,  -- Sum of all results across all points
  
  -- Performance metrics
  execution_time_seconds INTEGER,
  success_rate DECIMAL(5, 2),  -- Percentage of grid points that returned results
  api_calls_made INTEGER DEFAULT 169,
  
  -- Meta data
  session_id VARCHAR(100),
  user_id VARCHAR(255),  -- Optional user tracking
  
  -- Store raw request data as backup
  raw_config JSONB
);

CREATE INDEX idx_grid_searches_created ON grid_searches(created_at DESC);
CREATE INDEX idx_grid_searches_term ON grid_searches(search_term);
CREATE INDEX idx_grid_searches_location ON grid_searches(center_lat, center_lng);

-- ============================================
-- 2. GRID COMPETITORS TABLE
-- ============================================
-- Stores EVERY unique business found in the search
CREATE TABLE IF NOT EXISTS grid_competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  -- Business identification (CRITICAL: place_id is the unique key)
  place_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Business details (captured at time of search)
  rating DECIMAL(2, 1),
  reviews INTEGER,
  price_level INTEGER,  -- $ signs (1-4)
  business_type VARCHAR(255),  -- Primary category from Google
  
  -- Location (actual business location, not grid point)
  business_lat DECIMAL(10, 7),
  business_lng DECIMAL(10, 7),
  address VARCHAR(500),
  
  -- Performance metrics across the entire grid
  appearances INTEGER,  -- How many grid points they appear in (out of 169)
  coverage_percent DECIMAL(5, 2),  -- (appearances / total_grid_points) * 100
  
  -- Ranking statistics
  avg_rank DECIMAL(5, 2),
  best_rank INTEGER,
  worst_rank INTEGER,
  median_rank INTEGER,
  rank_std_dev DECIMAL(5, 2),  -- Consistency measure
  
  -- Positioning metrics
  top_3_count INTEGER,  -- Times ranked in top 3
  top_10_count INTEGER,  -- Times ranked in top 10
  first_place_count INTEGER,  -- Times ranked #1
  
  -- Geographic distribution
  north_appearances INTEGER,  -- Appearances in northern grid cells
  south_appearances INTEGER,
  east_appearances INTEGER,
  west_appearances INTEGER,
  center_appearances INTEGER,
  
  -- Competition analysis
  avg_competition_faced DECIMAL(5, 2),  -- Avg number of competitors where they appear
  
  -- Unique constraint: one entry per business per search
  CONSTRAINT unique_competitor_per_search UNIQUE(search_id, place_id)
);

CREATE INDEX idx_competitors_search ON grid_competitors(search_id);
CREATE INDEX idx_competitors_place_id ON grid_competitors(place_id);
CREATE INDEX idx_competitors_coverage ON grid_competitors(coverage_percent DESC);
CREATE INDEX idx_competitors_avg_rank ON grid_competitors(avg_rank);

-- ============================================
-- 3. GRID POINTS TABLE (Composite/Junction)
-- ============================================
-- One row for EACH business at EACH grid point where it appears
CREATE TABLE IF NOT EXISTS grid_point_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES grid_competitors(id) ON DELETE CASCADE,
  
  -- Grid location
  grid_row INTEGER NOT NULL,  -- 0-12 for 13x13 grid
  grid_col INTEGER NOT NULL,  -- 0-12 for 13x13 grid
  grid_index INTEGER NOT NULL,  -- 0-168 for linear indexing
  lat DECIMAL(10, 7) NOT NULL,  -- Actual coordinates of grid point
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Business performance at THIS specific point
  rank_position INTEGER NOT NULL,  -- 1-20 typically
  
  -- Competition context at this point
  total_results_at_point INTEGER,  -- How many businesses at this grid point
  
  -- Distance metrics
  distance_from_center_miles DECIMAL(5, 2),  -- From search center
  distance_from_business_miles DECIMAL(5, 2),  -- From actual business location
  
  -- Additional context
  is_sponsored BOOLEAN DEFAULT FALSE,  -- Was this a paid placement?
  
  -- Unique constraint: one ranking per business per grid point
  CONSTRAINT unique_grid_point_result UNIQUE(search_id, grid_row, grid_col, competitor_id)
);

CREATE INDEX idx_grid_points_search ON grid_point_results(search_id);
CREATE INDEX idx_grid_points_competitor ON grid_point_results(competitor_id);
CREATE INDEX idx_grid_points_location ON grid_point_results(grid_row, grid_col);
CREATE INDEX idx_grid_points_rank ON grid_point_results(rank_position);

-- ============================================
-- 4. COMPETITOR SUMMARY TABLE (Rollup)
-- ============================================
-- Aggregated stats for businesses across multiple searches
CREATE TABLE IF NOT EXISTS competitor_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  
  -- Aggregate statistics across all searches
  total_searches_appeared INTEGER DEFAULT 0,
  total_grid_points_appeared INTEGER DEFAULT 0,
  
  -- Performance averages
  overall_avg_rank DECIMAL(5, 2),
  overall_avg_coverage DECIMAL(5, 2),
  overall_best_rank INTEGER,
  overall_worst_rank INTEGER,
  
  -- Trend data
  coverage_trend VARCHAR(20),  -- 'improving', 'declining', 'stable'
  rank_trend VARCHAR(20),  -- 'improving', 'declining', 'stable'
  
  -- Category dominance
  dominant_search_terms TEXT[],  -- Array of search terms where they excel
  weak_search_terms TEXT[],  -- Array of search terms where they struggle
  
  -- Meta
  first_seen_date DATE,
  last_seen_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Link to potential prospect/lead (loose coupling as requested)
  prospect_id UUID,  -- Optional, can be NULL
  lead_id UUID,  -- Optional, can be NULL
  
  -- Business details (latest known)
  latest_rating DECIMAL(2, 1),
  latest_reviews INTEGER,
  latest_address VARCHAR(500),
  business_lat DECIMAL(10, 7),
  business_lng DECIMAL(10, 7)
);

CREATE INDEX idx_summaries_place_id ON competitor_summaries(place_id);
CREATE INDEX idx_summaries_name ON competitor_summaries(name);
CREATE INDEX idx_summaries_coverage ON competitor_summaries(overall_avg_coverage DESC);

-- ============================================
-- 5. GRID CELLS METADATA (Optional)
-- ============================================
-- Static info about each grid cell for analysis
CREATE TABLE IF NOT EXISTS grid_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Cell statistics
  total_businesses INTEGER,
  competition_level VARCHAR(20),  -- 'low', 'medium', 'high', 'very_high'
  
  -- Top performers in this cell
  top_3_competitors JSONB,  -- Array of {place_id, name, rank}
  
  -- Geographic context
  distance_from_center_miles DECIMAL(5, 2),
  quadrant VARCHAR(10),  -- 'NE', 'NW', 'SE', 'SW', 'CENTER'
  
  CONSTRAINT unique_grid_cell UNIQUE(search_id, grid_row, grid_col)
);

CREATE INDEX idx_cells_search ON grid_cells(search_id);
CREATE INDEX idx_cells_location ON grid_cells(grid_row, grid_col);

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View: Business performance by search
CREATE VIEW competitor_search_performance AS
SELECT 
  gc.place_id,
  gc.name,
  gc.search_id,
  gs.search_term,
  gc.coverage_percent,
  gc.avg_rank,
  gc.appearances,
  gs.created_at
FROM grid_competitors gc
JOIN grid_searches gs ON gc.search_id = gs.id
ORDER BY gs.created_at DESC, gc.coverage_percent DESC;

-- View: Head-to-head competitor comparison
CREATE VIEW competitor_comparisons AS
SELECT 
  gs.search_term,
  gc1.name as competitor_1,
  gc1.coverage_percent as competitor_1_coverage,
  gc1.avg_rank as competitor_1_avg_rank,
  gc2.name as competitor_2,
  gc2.coverage_percent as competitor_2_coverage,
  gc2.avg_rank as competitor_2_avg_rank
FROM grid_competitors gc1
JOIN grid_competitors gc2 ON gc1.search_id = gc2.search_id AND gc1.id < gc2.id
JOIN grid_searches gs ON gc1.search_id = gs.id
WHERE gc1.coverage_percent > 30 AND gc2.coverage_percent > 30;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Update competitor summary after each new search
CREATE OR REPLACE FUNCTION update_competitor_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO competitor_summaries (
    place_id, 
    name,
    total_searches_appeared,
    total_grid_points_appeared,
    overall_avg_rank,
    overall_avg_coverage,
    overall_best_rank,
    overall_worst_rank,
    first_seen_date,
    last_seen_date,
    latest_rating,
    latest_reviews
  )
  VALUES (
    NEW.place_id,
    NEW.name,
    1,
    NEW.appearances,
    NEW.avg_rank,
    NEW.coverage_percent,
    NEW.best_rank,
    NEW.worst_rank,
    CURRENT_DATE,
    CURRENT_DATE,
    NEW.rating,
    NEW.reviews
  )
  ON CONFLICT (place_id) DO UPDATE SET
    total_searches_appeared = competitor_summaries.total_searches_appeared + 1,
    total_grid_points_appeared = competitor_summaries.total_grid_points_appeared + NEW.appearances,
    overall_avg_rank = (competitor_summaries.overall_avg_rank * competitor_summaries.total_searches_appeared + NEW.avg_rank) / (competitor_summaries.total_searches_appeared + 1),
    overall_avg_coverage = (competitor_summaries.overall_avg_coverage * competitor_summaries.total_searches_appeared + NEW.coverage_percent) / (competitor_summaries.total_searches_appeared + 1),
    overall_best_rank = LEAST(competitor_summaries.overall_best_rank, NEW.best_rank),
    overall_worst_rank = GREATEST(competitor_summaries.overall_worst_rank, NEW.worst_rank),
    last_seen_date = CURRENT_DATE,
    latest_rating = NEW.rating,
    latest_reviews = NEW.reviews,
    last_updated = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_summary_on_competitor_insert
AFTER INSERT ON grid_competitors
FOR EACH ROW
EXECUTE FUNCTION update_competitor_summary();