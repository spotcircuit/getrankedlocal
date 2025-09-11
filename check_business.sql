-- Check if this business exists in competitor_searches
SELECT 
  id,
  target_business_name,
  target_business_place_id,
  search_term,
  created_at,
  ai_intelligence IS NOT NULL as has_ai,
  job_id
FROM competitor_searches
WHERE target_business_place_id = 'ChIJV3VcbVWd3IARUSQDXXqv36c'
   OR LOWER(target_business_name) = LOWER('Greenfield Fence Inc')
LIMIT 5;

-- Check if it exists in leads
SELECT 
  id,
  business_name,
  place_id,
  rating,
  review_count,
  created_at
FROM leads
WHERE place_id = 'ChIJV3VcbVWd3IARUSQDXXqv36c'
   OR LOWER(business_name) = LOWER('Greenfield Fence Inc')
LIMIT 5;

-- Check if it exists in prospects
SELECT 
  place_id,
  business_name,
  rating,
  review_count,
  enrichment_status,
  created_at
FROM prospects
WHERE place_id = 'ChIJV3VcbVWd3IARUSQDXXqv36c'
   OR LOWER(business_name) = LOWER('Greenfield Fence Inc')
LIMIT 5;

-- Check search_prospects for this business
SELECT 
  sp.search_id,
  sp.prospect_place_id,
  sp.is_target_business,
  sp.rank,
  cs.target_business_name,
  cs.target_business_place_id
FROM search_prospects sp
JOIN competitor_searches cs ON cs.id = sp.search_id
WHERE cs.target_business_place_id = 'ChIJV3VcbVWd3IARUSQDXXqv36c'
   OR sp.prospect_place_id = 'ChIJV3VcbVWd3IARUSQDXXqv36c'
LIMIT 5;
