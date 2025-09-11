-- Create master outreach prospects table in Neon database
CREATE TABLE IF NOT EXISTS outreach_prospects (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(100),
    niche VARCHAR(100),
    
    -- Contact Information
    primary_email VARCHAR(255),
    email_type VARCHAR(50), -- 'Generic', 'Personal', 'Department', 'Unknown'
    decision_maker_name VARCHAR(255),
    decision_maker_title VARCHAR(255),
    decision_maker_email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    
    -- Google Data
    place_id VARCHAR(255) UNIQUE,
    google_rating DECIMAL(2, 1),
    review_count INTEGER,
    
    -- Performance Metrics
    grid_coverage_percent DECIMAL(5, 2),
    avg_ranking DECIMAL(4, 2),
    top3_count INTEGER,
    running_google_ads BOOLEAN DEFAULT FALSE,
    running_meta_ads BOOLEAN DEFAULT FALSE,
    monthly_search_volume INTEGER,
    competition_level VARCHAR(20), -- 'Low', 'Medium', 'High'
    
    -- Campaign Tracking
    campaign_status VARCHAR(50) DEFAULT 'Not Started', -- 'Not Started', 'In Queue', 'Email Sent', 'Opened', 'Clicked', 'Replied', 'Meeting Scheduled', 'Completed', 'Lost'
    last_contact_date TIMESTAMP,
    last_email_sent TEXT,
    total_emails_sent INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    
    -- Response Tracking
    response_status VARCHAR(50), -- 'No Response', 'Auto Reply', 'Replied', 'Interested', 'Not Interested', 'Do Not Contact'
    response_text TEXT,
    follow_up_date DATE,
    follow_up_count INTEGER DEFAULT 0,
    
    -- AI Intelligence
    ai_intelligence JSONB,
    competitor_intel JSONB,
    pain_points TEXT[],
    opportunities TEXT[],
    
    -- Metadata
    data_source VARCHAR(100), -- 'Grid Search', 'Scraper', 'Manual', 'API', 'Referral'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    tags TEXT[],
    priority_score INTEGER -- 1-100 calculated based on opportunity
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_status ON outreach_prospects(campaign_status);
CREATE INDEX IF NOT EXISTS idx_city_state ON outreach_prospects(city, state);
CREATE INDEX IF NOT EXISTS idx_industry ON outreach_prospects(industry);
CREATE INDEX IF NOT EXISTS idx_priority ON outreach_prospects(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up ON outreach_prospects(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_place_id ON outreach_prospects(place_id);

-- Create outreach campaigns table
CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100), -- 'Cold Email', 'Follow Up', 'Re-engagement', 'Special Offer'
    industry_target VARCHAR(100),
    city_target VARCHAR(100),
    state_target VARCHAR(50),
    
    -- Campaign Content
    subject_lines TEXT[], -- Array of subject lines for A/B testing
    email_templates TEXT[], -- Array of email templates
    value_proposition TEXT,
    offer_details TEXT,
    guarantee TEXT,
    
    -- Campaign Settings
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Active', 'Paused', 'Completed'
    start_date DATE,
    end_date DATE,
    daily_send_limit INTEGER DEFAULT 50,
    
    -- Performance Metrics
    total_sent INTEGER DEFAULT 0,
    total_opens INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_replies INTEGER DEFAULT 0,
    total_meetings INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    
    -- Calculated Metrics
    open_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN total_sent > 0 
        THEN (total_opens::DECIMAL / total_sent * 100) 
        ELSE 0 END
    ) STORED,
    reply_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN total_sent > 0 
        THEN (total_replies::DECIMAL / total_sent * 100) 
        ELSE 0 END
    ) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email history table
CREATE TABLE IF NOT EXISTS outreach_email_history (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES outreach_prospects(id),
    campaign_id INTEGER REFERENCES outreach_campaigns(id),
    
    -- Email Details
    email_to VARCHAR(255),
    email_from VARCHAR(255),
    subject_line TEXT,
    email_body TEXT,
    email_type VARCHAR(50), -- 'Initial', 'Follow Up 1', 'Follow Up 2', etc.
    
    -- Tracking
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    bounced_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    
    -- Response
    response_received BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    response_sentiment VARCHAR(20), -- 'Positive', 'Neutral', 'Negative'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_outreach_prospects_updated_at 
    BEFORE UPDATE ON outreach_prospects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_campaigns_updated_at 
    BEFORE UPDATE ON outreach_campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample insert for medical spa prospects
INSERT INTO outreach_prospects (
    business_name,
    website,
    industry,
    niche,
    primary_email,
    email_type,
    city,
    state,
    google_rating,
    review_count,
    grid_coverage_percent,
    competition_level,
    campaign_status,
    pain_points,
    opportunities,
    data_source,
    priority_score
) VALUES 
(
    'Example Medical Spa',
    'examplemedspa.com',
    'Healthcare',
    'Medical Spa',
    'info@examplemedspa.com',
    'Generic',
    'Ashburn',
    'VA',
    4.5,
    127,
    27.5,
    'High',
    'Not Started',
    ARRAY['Low map visibility', 'Competitor ads taking traffic', 'Poor mobile experience'],
    ARRAY['Expand to Leesburg market', 'Dominate botox searches', 'Capture competitor defectors'],
    'Grid Search',
    85
);