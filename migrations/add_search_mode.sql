-- Add search_mode column to grid_searches table
ALTER TABLE grid_searches 
ADD COLUMN IF NOT EXISTS search_mode VARCHAR(20) DEFAULT 'targeted';

-- Update existing records based on whether they have an initiated_by_name
UPDATE grid_searches 
SET search_mode = CASE 
  WHEN initiated_by_name IS NOT NULL THEN 'targeted'
  ELSE 'all_businesses'
END;

-- Add comment for clarity
COMMENT ON COLUMN grid_searches.search_mode IS 'Search mode: targeted (specific business) or all_businesses (market exploration)';
