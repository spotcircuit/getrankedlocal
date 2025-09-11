-- Table to track sponsored results from grid searches
CREATE TABLE IF NOT EXISTS sponsored_results (
  id SERIAL PRIMARY KEY,
  grid_search_id INTEGER REFERENCES grid_searches(id) ON DELETE CASCADE,
  grid_point_id INTEGER REFERENCES grid_point_results(id) ON DELETE CASCADE,
  
  -- Business information
  business_name VARCHAR(255) NOT NULL,
  place_id VARCHAR(255),
  
  -- Location where this was found
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  
  -- Search context
  search_term VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Sponsorship details
  sponsored_rank INTEGER NOT NULL, -- Position among sponsored results (1st sponsor, 2nd, etc.)
  overall_position INTEGER NOT NULL, -- Position in overall results including organic
  
  -- Business details
  rating DECIMAL(2, 1),
  reviews INTEGER,
  phone VARCHAR(20),
  address TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rollup table for sponsored businesses across entire grid search
CREATE TABLE IF NOT EXISTS sponsored_summary (
  id SERIAL PRIMARY KEY,
  grid_search_id INTEGER REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  -- Business identification
  business_name VARCHAR(255) NOT NULL,
  place_id VARCHAR(255),
  
  -- Search context
  search_term VARCHAR(255) NOT NULL,
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Sponsorship metrics
  appearances_count INTEGER NOT NULL, -- How many grid points they appeared as sponsored (x/169)
  total_grid_points INTEGER NOT NULL, -- Total grid points searched (usually 169)
  coverage_percentage DECIMAL(5, 2), -- Percentage of grid covered
  
  -- Ranking statistics (only for points where they appeared as sponsored)
  avg_sponsored_rank DECIMAL(3, 1), -- Average position among sponsored results
  min_sponsored_rank INTEGER, -- Best sponsored position
  max_sponsored_rank INTEGER, -- Worst sponsored position
  
  avg_overall_position DECIMAL(3, 1), -- Average overall position in results
  
  -- Business metrics
  avg_rating DECIMAL(2, 1),
  avg_reviews INTEGER,
  
  -- Timing
  search_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint to prevent duplicates
  UNIQUE(grid_search_id, place_id)
);

-- Index for fast lookups
CREATE INDEX idx_sponsored_results_search_id ON sponsored_results(grid_search_id);
CREATE INDEX idx_sponsored_results_place_id ON sponsored_results(place_id);
CREATE INDEX idx_sponsored_results_search_term ON sponsored_results(search_term);
CREATE INDEX idx_sponsored_summary_search_term ON sponsored_summary(search_term);
CREATE INDEX idx_sponsored_summary_place_id ON sponsored_summary(place_id);
CREATE INDEX idx_sponsored_summary_date ON sponsored_summary(search_date);

-- View to see top sponsors by keyword and location
CREATE VIEW top_sponsors_by_keyword AS
SELECT 
  search_term,
  city,
  state,
  business_name,
  place_id,
  AVG(coverage_percentage) as avg_coverage,
  AVG(avg_sponsored_rank) as avg_rank,
  COUNT(DISTINCT grid_search_id) as search_count,
  MAX(search_date) as last_seen
FROM sponsored_summary
GROUP BY search_term, city, state, business_name, place_id
ORDER BY search_term, avg_coverage DESC;

-- View to see sponsor competition by location
CREATE VIEW sponsor_competition AS
SELECT 
  search_term,
  city,
  state,
  COUNT(DISTINCT place_id) as unique_sponsors,
  AVG(appearances_count) as avg_appearances,
  MAX(coverage_percentage) as max_coverage,
  MAX(search_date) as last_updated
FROM sponsored_summary
GROUP BY search_term, city, state
ORDER BY unique_sponsors DESC;