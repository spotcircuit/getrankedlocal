# Leads Table Migration Plan

## Current Analysis

### AI Data Storage
**AI information is stored in the `additional_data` JSONB field** with the key `raw_ai_response`. This contains all the AI-extracted intelligence about the business.

## Columns to Remove (Truly Orphaned)

These columns are now handled by other tables or are no longer needed:

### 1. Search/Collection Related (Now in `lead_collections` table)
- `search_city` - Replaced by `search_destination` in lead_collections
- `search_niche` - Replaced by `search_collection` in lead_collections  
- `source_directory` - Replaced by `search_collection` in lead_collections

### 2. Redundant Contact Fields (Should use `contact_to_lead` table)
- `owner_first_name` - Move to contact_to_lead.first_name
- `owner_last_name` - Move to contact_to_lead.last_name
- `owner_name` - Keep as computed field or move to contact_to_lead.full_name
- `medical_director_first_name` - Move to contact_to_lead.first_name
- `medical_director_last_name` - Move to contact_to_lead.last_name
- `medical_director_name` - Move to contact_to_lead.full_name
- `contact_type` - Already exists in contact_to_lead table

## Columns to Migrate to New Tables

### 1. Create `lead_pricing` Table
```sql
CREATE TABLE lead_pricing (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    service_type VARCHAR(100), -- 'botox', 'filler', 'membership'
    price_range VARCHAR(100),
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

Migrate:
- `pricing_botox`
- `pricing_filler` 
- `pricing_membership`

### 2. Create `lead_social_media` Table
```sql
CREATE TABLE lead_social_media (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    platform VARCHAR(50), -- 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube'
    handle VARCHAR(100),
    followers_count INTEGER,
    followers_text VARCHAR(50), -- Original text like "10.5K"
    verified BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Migrate:
- `instagram_handle` + `instagram_followers`
- `facebook_handle` + `facebook_followers`
- `twitter_handle`
- `tiktok_handle`
- `youtube_handle`

### 3. Create `lead_business_intelligence` Table
```sql
CREATE TABLE lead_business_intelligence (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    is_expanding BOOLEAN DEFAULT FALSE,
    is_hiring BOOLEAN DEFAULT FALSE,
    founded_year VARCHAR(20),
    employee_count_range VARCHAR(50),
    annual_revenue_range VARCHAR(50),
    growth_indicators JSONB,
    market_position VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

Migrate:
- `is_expanding`
- `is_hiring`
- `founded_year`

### 4. Enhance `contact_to_lead` Table Usage
Move to contact_to_lead:
- `additional_emails` - Create multiple contact_to_lead records with type='additional'
- `additional_phones` - Add phone field to existing contacts
- `email_type` - Add as contact_to_lead.email_type field

## Columns to Keep in Leads Table

These are core business fields that should remain:
- `id`
- `business_name`
- `rating`
- `review_count`
- `street_address`
- `city`
- `state`
- `latitude`
- `longitude`
- `website`
- `phone` (primary business phone)
- `email` (primary business email)
- `domain`
- `place_id` (if using Google Places)
- `additional_data` (JSONB - contains AI intelligence)
- `created_at`
- `updated_at`
- `lead_score` (computed/cached value)

## Migration SQL Script

```sql
-- Step 1: Create new tables
CREATE TABLE IF NOT EXISTS lead_pricing (...);
CREATE TABLE IF NOT EXISTS lead_social_media (...);  
CREATE TABLE IF NOT EXISTS lead_business_intelligence (...);

-- Step 2: Migrate data to new tables
-- Pricing migration
INSERT INTO lead_pricing (lead_id, service_type, price_range)
SELECT id, 'botox', pricing_botox FROM leads WHERE pricing_botox IS NOT NULL;

INSERT INTO lead_pricing (lead_id, service_type, price_range)
SELECT id, 'filler', pricing_filler FROM leads WHERE pricing_filler IS NOT NULL;

-- Social media migration
INSERT INTO lead_social_media (lead_id, platform, handle, followers_text)
SELECT id, 'instagram', instagram_handle, instagram_followers 
FROM leads WHERE instagram_handle IS NOT NULL;

-- Business intelligence migration
INSERT INTO lead_business_intelligence (lead_id, is_expanding, is_hiring, founded_year)
SELECT id, is_expanding, is_hiring, founded_year
FROM leads WHERE is_expanding IS NOT NULL OR is_hiring IS NOT NULL OR founded_year IS NOT NULL;

-- Contact migration
INSERT INTO contact_to_lead (lead_id, contact_type, full_name, first_name, last_name)
SELECT id, 'owner', owner_name, owner_first_name, owner_last_name
FROM leads WHERE owner_name IS NOT NULL OR owner_first_name IS NOT NULL;

INSERT INTO contact_to_lead (lead_id, contact_type, full_name, first_name, last_name)
SELECT id, 'medical_director', medical_director_name, medical_director_first_name, medical_director_last_name
FROM leads WHERE medical_director_name IS NOT NULL OR medical_director_first_name IS NOT NULL;

-- Step 3: Drop orphaned columns (after verification)
ALTER TABLE leads DROP COLUMN IF EXISTS search_city;
ALTER TABLE leads DROP COLUMN IF EXISTS search_niche;
ALTER TABLE leads DROP COLUMN IF EXISTS source_directory;
ALTER TABLE leads DROP COLUMN IF EXISTS owner_first_name;
ALTER TABLE leads DROP COLUMN IF EXISTS owner_last_name;
ALTER TABLE leads DROP COLUMN IF EXISTS medical_director_first_name;
ALTER TABLE leads DROP COLUMN IF EXISTS medical_director_last_name;
ALTER TABLE leads DROP COLUMN IF EXISTS pricing_botox;
ALTER TABLE leads DROP COLUMN IF EXISTS pricing_filler;
ALTER TABLE leads DROP COLUMN IF EXISTS pricing_membership;
ALTER TABLE leads DROP COLUMN IF EXISTS instagram_handle;
ALTER TABLE leads DROP COLUMN IF EXISTS facebook_handle;
ALTER TABLE leads DROP COLUMN IF EXISTS twitter_handle;
ALTER TABLE leads DROP COLUMN IF EXISTS tiktok_handle;
ALTER TABLE leads DROP COLUMN IF EXISTS youtube_handle;
ALTER TABLE leads DROP COLUMN IF EXISTS instagram_followers;
ALTER TABLE leads DROP COLUMN IF EXISTS facebook_followers;
ALTER TABLE leads DROP COLUMN IF EXISTS is_expanding;
ALTER TABLE leads DROP COLUMN IF EXISTS is_hiring;
ALTER TABLE leads DROP COLUMN IF EXISTS founded_year;
ALTER TABLE leads DROP COLUMN IF EXISTS additional_emails;
ALTER TABLE leads DROP COLUMN IF EXISTS additional_phones;
ALTER TABLE leads DROP COLUMN IF EXISTS email_type;
ALTER TABLE leads DROP COLUMN IF EXISTS contact_type;
```

## Benefits of This Migration

1. **Better Data Organization**: Related data is grouped in appropriate tables
2. **Improved Flexibility**: Can have multiple prices, social media accounts, contacts per lead
3. **Cleaner Schema**: Leads table focuses on core business information
4. **Better Querying**: Can easily query all social media data or all pricing data
5. **Maintains History**: Can track changes over time in the new tables
6. **No Data Loss**: All existing data is preserved in new structure

## Implementation Order

1. Create new tables first
2. Migrate data to new tables
3. Update application code to use new tables
4. Verify all data is correctly migrated
5. Drop orphaned columns from leads table
6. Update API endpoints to use new table structure