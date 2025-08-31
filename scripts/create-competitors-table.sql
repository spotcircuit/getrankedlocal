-- Create competitors table with same structure as leads table
-- but with place_id as PRIMARY KEY for deduplication
CREATE TABLE IF NOT EXISTS competitors (
    -- Primary key is place_id for deduplication
    place_id VARCHAR(255) PRIMARY KEY,
    
    -- Basic business information (same as leads)
    business_name VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1),
    review_count INTEGER,
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    website VARCHAR(255),
    phone VARCHAR(50),
    
    -- Decision maker information (will be NULL until enriched)
    owner_name VARCHAR(255),
    owner_first_name VARCHAR(100),
    owner_last_name VARCHAR(100),
    medical_director_name VARCHAR(255),
    medical_director_first_name VARCHAR(100),
    medical_director_last_name VARCHAR(100),
    
    -- Contact information (will be NULL until enriched)
    email VARCHAR(255),
    email_type VARCHAR(50),
    additional_emails TEXT[],
    additional_phones TEXT[],
    
    -- AI Intelligence fields (will be NULL until enriched)
    domain VARCHAR(255),
    ai_extraction_timestamp TIMESTAMP,
    
    -- Pricing information (will be NULL until enriched)
    pricing_botox VARCHAR(100),
    pricing_filler VARCHAR(100),
    pricing_membership VARCHAR(100),
    
    -- Social media (will be NULL until enriched)
    instagram_handle VARCHAR(100),
    facebook_handle VARCHAR(100),
    twitter_handle VARCHAR(100),
    tiktok_handle VARCHAR(100),
    youtube_handle VARCHAR(100),
    instagram_followers VARCHAR(50),
    facebook_followers VARCHAR(50),
    
    -- Business intelligence (will be NULL until enriched)
    is_expanding BOOLEAN DEFAULT FALSE,
    is_hiring BOOLEAN DEFAULT FALSE,
    founded_year VARCHAR(20),
    
    -- Search metadata
    search_city VARCHAR(100),
    search_niche VARCHAR(100) DEFAULT 'med spas',
    source_directory VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status fields
    enrichment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'enriched', 'failed'
    enriched_at TIMESTAMP,
    lead_score INTEGER,
    
    -- Additional JSON field for flexibility
    additional_data JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_competitors_business_name ON competitors(business_name);
CREATE INDEX IF NOT EXISTS idx_competitors_city ON competitors(city);
CREATE INDEX IF NOT EXISTS idx_competitors_state ON competitors(state);
CREATE INDEX IF NOT EXISTS idx_competitors_rating ON competitors(rating);
CREATE INDEX IF NOT EXISTS idx_competitors_review_count ON competitors(review_count);
CREATE INDEX IF NOT EXISTS idx_competitors_enrichment_status ON competitors(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_competitors_source_directory ON competitors(source_directory);

-- Update the competitor_searches table to track which competitors were found
ALTER TABLE competitor_searches 
ADD COLUMN IF NOT EXISTS competitor_place_ids TEXT[],
ADD COLUMN IF NOT EXISTS ai_intelligence JSONB;

-- Create a junction table to track which competitors appeared in which searches
CREATE TABLE IF NOT EXISTS search_competitors (
    search_id INTEGER REFERENCES competitor_searches(id) ON DELETE CASCADE,
    competitor_place_id VARCHAR(255) REFERENCES competitors(place_id) ON DELETE CASCADE,
    rank INTEGER,
    is_target_business BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (search_id, competitor_place_id)
);

-- Create indexes for the junction table
CREATE INDEX IF NOT EXISTS idx_search_competitors_search ON search_competitors(search_id);
CREATE INDEX IF NOT EXISTS idx_search_competitors_place ON search_competitors(competitor_place_id);
CREATE INDEX IF NOT EXISTS idx_search_competitors_rank ON search_competitors(rank);