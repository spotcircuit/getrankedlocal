-- Fix data issues from failed lead insertions
-- This script fixes orphaned competitor_searches records that don't have corresponding leads

-- 1. First, check for orphaned searches (searches without leads)
SELECT 
  cs.id as search_id,
  cs.target_business_name,
  cs.target_business_place_id,
  cs.search_term,
  cs.city,
  cs.state,
  cs.created_at,
  l.id as lead_id
FROM competitor_searches cs
LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
WHERE l.id IS NULL
  AND cs.created_at > NOW() - INTERVAL '24 hours'
ORDER BY cs.created_at DESC;

-- 2. Get details about the most recent orphaned search
WITH recent_orphaned AS (
  SELECT 
    cs.id as search_id,
    cs.target_business_name,
    cs.target_business_place_id,
    cs.search_term,
    cs.city,
    cs.state,
    cs.ai_intelligence,
    cs.created_at
  FROM competitor_searches cs
  LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
  WHERE l.id IS NULL
    AND cs.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY cs.created_at DESC
  LIMIT 1
)
SELECT * FROM recent_orphaned;

-- 3. Fix: Create leads for orphaned competitor_searches
-- This will insert missing leads based on the search data
INSERT INTO leads (
  place_id,
  business_name,
  email,
  domain,
  rating,
  review_count,
  city,
  state,
  source_directory,
  email_enrichment_status,
  outreach_status,
  lead_score,
  created_at
)
SELECT DISTINCT
  cs.target_business_place_id as place_id,
  cs.target_business_name as business_name,
  cs.target_business_email as email,
  cs.target_business_domain as domain,
  cs.target_business_rating as rating,
  cs.target_business_reviews as review_count,
  cs.city,
  cs.state,
  'google_maps' as source_directory,
  CASE 
    WHEN cs.target_business_email IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END as email_enrichment_status,
  'not_started' as outreach_status,
  100 as lead_score,
  cs.created_at
FROM competitor_searches cs
LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
WHERE l.id IS NULL
  AND cs.target_business_place_id IS NOT NULL
  AND cs.created_at > NOW() - INTERVAL '24 hours'
ON CONFLICT (place_id) DO NOTHING;

-- 4. Verify the fix
SELECT 
  cs.id as search_id,
  cs.target_business_name,
  cs.target_business_place_id,
  l.id as lead_id,
  l.business_name as lead_business_name,
  COUNT(sp.prospect_place_id) as prospect_count
FROM competitor_searches cs
LEFT JOIN leads l ON l.place_id = cs.target_business_place_id
LEFT JOIN search_prospects sp ON sp.search_id = cs.id
WHERE cs.created_at > NOW() - INTERVAL '24 hours'
GROUP BY cs.id, cs.target_business_name, cs.target_business_place_id, l.id, l.business_name
ORDER BY cs.created_at DESC;

-- 5. Optional: Clean up duplicate or test data
-- Uncomment and modify as needed
/*
-- Delete specific test searches
DELETE FROM search_prospects WHERE search_id IN (
  SELECT id FROM competitor_searches 
  WHERE target_business_name LIKE '%test%' 
  OR target_business_name LIKE '%Test%'
);

DELETE FROM competitor_searches 
WHERE target_business_name LIKE '%test%' 
OR target_business_name LIKE '%Test%';
*/