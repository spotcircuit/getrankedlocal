# Database Schema Documentation

## Overview

The Lead Finder application uses a Neon PostgreSQL database with several interconnected tables to manage leads, collections, competitor searches, captured leads, and the comprehensive grid search analysis system. The database architecture supports both traditional lead generation and the new 169-point geographic grid search functionality.

## Core Tables

### `leads` Table

The primary table storing business lead information.

```sql
leads (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR(255) UNIQUE,
  business_name VARCHAR(255),
  rating DECIMAL(3,2),
  review_count INTEGER,
  city VARCHAR(100),
  state VARCHAR(50),
  website VARCHAR(255),
  phone VARCHAR(50),
  street_address TEXT,
  email VARCHAR(255),
  domain VARCHAR(255),
  owner_name VARCHAR(255),
  medical_director_name VARCHAR(255),
  search_city VARCHAR(100),
  search_state VARCHAR(50),
  search_niche VARCHAR(255),
  source_directory VARCHAR(255),
  additional_data JSONB,
  lead_score INTEGER,
  instagram_handle VARCHAR(255),
  facebook_handle VARCHAR(255),
  twitter_handle VARCHAR(255),
  tiktok_handle VARCHAR(255),
  youtube_handle VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Key Features:**
- `place_id` serves as a unique identifier from Google Places API
- AI-extracted owner information stored in `owner_name` and `medical_director_name`
- Social media handles for digital presence tracking
- `additional_data` stores raw AI extraction results as JSONB
- `source_directory` indicates the search collection this lead belongs to

### `lead_collections` Table ⭐ **NEW**

A many-to-many relationship table enabling leads to belong to multiple collections.

```sql
lead_collections (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  search_collection VARCHAR(255),
  search_destination VARCHAR(255),
  search_term VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Key Features:**
- Allows one lead to belong to multiple collections (many-to-many)
- `search_collection` follows pattern: `{niche}_{city}_{state}` (e.g., "med_spas_austin_tx")
- `search_destination` is human-readable location (e.g., "Austin, TX")
- `search_term` stores the original search query used

**Migration Notes:**
- 6,511 leads were successfully migrated to this table
- Data was normalized and deduplicated during migration
- Existing leads maintain backward compatibility through `source_directory`

### `competitor_searches` Table

Stores search metadata and AI intelligence for competitive analysis.

```sql
competitor_searches (
  id SERIAL PRIMARY KEY,
  search_term VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  collection VARCHAR(255),
  total_results INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  ai_intelligence JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Key Features:**
- Links to collections for search tracking
- `ai_intelligence` contains competitive insights and market analysis
- Supports status tracking for long-running searches

### `leads_captured` Table

Stores lead capture form submissions from the sales funnel.

```sql
leads_captured (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255),
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  page_url TEXT,
  source VARCHAR(50) DEFAULT 'sales_funnel',
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Grid Search Analysis Tables

The grid search system uses 5 specialized tables to store comprehensive geographic market analysis data from 169-point grid searches. These tables support advanced features like competitor heat map switching and real-time competitive intelligence.

### `grid_searches` Table

Master records for each grid search execution with performance metrics and metadata.

```sql
grid_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  
  -- Business context
  initiated_by_place_id VARCHAR(255),
  initiated_by_name VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Performance metrics
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
)
```

### `grid_competitors` Table

All unique businesses discovered across the grid, using place_id as the primary deduplication key.

```sql
grid_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  -- Business identification (CRITICAL: place_id prevents duplicates)
  place_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Business details
  rating DECIMAL(2, 1),
  reviews INTEGER,
  business_lat DECIMAL(10, 7),
  business_lng DECIMAL(10, 7),
  address TEXT,
  phone VARCHAR(50),
  website VARCHAR(500),
  business_type VARCHAR(255),
  
  -- Performance statistics
  appearances INTEGER,           -- Number of grid points where business appears
  coverage_percent DECIMAL(5,2), -- Percentage of total grid coverage
  avg_rank DECIMAL(5,2),         -- Average ranking across all appearances
  best_rank INTEGER,             -- Best ranking achieved
  worst_rank INTEGER,            -- Worst ranking found
  top3_count INTEGER,            -- Number of top-3 appearances
  top10_count INTEGER,           -- Number of top-10 appearances
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure uniqueness per search
  UNIQUE(search_id, place_id)
)
```

### `grid_point_results` Table

Individual business rankings at each grid coordinate for detailed geographic analysis.

```sql
grid_point_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES grid_competitors(id) ON DELETE CASCADE,
  
  -- Grid position
  grid_row INTEGER NOT NULL,     -- 0-12 for 13x13 grid
  grid_col INTEGER NOT NULL,     -- 0-12 for 13x13 grid  
  lat DECIMAL(10, 7) NOT NULL,   -- Actual grid point coordinates
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Ranking data
  rank_position INTEGER NOT NULL, -- Business rank at this location
  total_results_at_point INTEGER, -- Total businesses found at this point
  
  created_at TIMESTAMP DEFAULT NOW()
)
```

### `competitor_summaries` Table 

Aggregated performance statistics and coverage metrics for quick analysis retrieval.

```sql
competitor_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES grid_competitors(id) ON DELETE CASCADE,
  
  -- Geographic coverage analysis
  north_appearances INTEGER,     -- Appearances in northern quadrant
  south_appearances INTEGER,     -- Appearances in southern quadrant  
  east_appearances INTEGER,      -- Appearances in eastern quadrant
  west_appearances INTEGER,      -- Appearances in western quadrant
  center_appearances INTEGER,    -- Appearances in center region
  
  -- Performance distribution
  rank_1_count INTEGER,          -- Number of #1 rankings
  rank_2_3_count INTEGER,        -- Number of 2-3 rankings  
  rank_4_10_count INTEGER,       -- Number of 4-10 rankings
  rank_11_20_count INTEGER,      -- Number of 11-20 rankings
  rank_21_plus_count INTEGER,    -- Number of 21+ rankings
  
  -- Market intelligence
  dominant_regions TEXT[],       -- Geographic areas where business dominates
  weak_regions TEXT[],           -- Geographic areas with poor performance
  competition_level VARCHAR(20), -- 'low', 'medium', 'high', 'very_high'
  market_position VARCHAR(20),   -- 'leader', 'challenger', 'follower', 'niche'
  
  created_at TIMESTAMP DEFAULT NOW()
)
```

### `grid_cells` Table

Grid cell metadata and competition density analysis for market intelligence.

```sql
grid_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  -- Grid position
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL, 
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Competition analysis
  total_businesses INTEGER,
  competition_level VARCHAR(20),  -- 'low', 'medium', 'high', 'very_high'
  avg_rating DECIMAL(2,1),       -- Average rating of businesses in this cell
  total_reviews INTEGER,         -- Sum of all reviews in this cell
  
  -- Top performers at this location
  top_3_competitors JSONB,       -- [{name, rank, rating, reviews}, ...]
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(search_id, grid_row, grid_col)
)
```

## Database Migration History

### Lead Collections Migration

**Date:** Recent (Migration Script: `migrate-lead-collections.js`)

**Changes:**
1. **Created `lead_collections` table** with many-to-many relationship structure
2. **Migrated 6,511 leads** from existing data into normalized collections
3. **Normalized collection names** using consistent naming pattern
4. **Improved destination formatting** (e.g., "San Francisco Ca" → "San Francisco, CA")

**Benefits:**
- Leads can now belong to multiple search collections
- Better data organization for directory-style browsing
- Improved scalability for future search operations
- Maintains backward compatibility with existing `source_directory` field

### AI Enhancement Features

**Recent AI Extraction Improvements:**

1. **Owner Name Extraction**
   - Enhanced parser for medical directors and business owners
   - Handles multiple name formats and titles
   - Stores in dedicated `owner_name` and `medical_director_name` fields

2. **Social Media Integration**
   - Added social media handle fields for digital presence tracking
   - Automated extraction from business websites and profiles

3. **Enhanced Data Storage**
   - Raw AI extraction results stored in `additional_data` JSONB field
   - Enables future data mining and analysis capabilities

## Indexing Strategy

### Performance Indexes

```sql
-- Primary lookup indexes
CREATE INDEX idx_leads_place_id ON leads(place_id);
CREATE INDEX idx_leads_collection ON leads(source_directory);
CREATE INDEX idx_lead_collections_lead_id ON lead_collections(lead_id);
CREATE INDEX idx_lead_collections_collection ON lead_collections(search_collection);

-- Search optimization indexes  
CREATE INDEX idx_leads_search_niche ON leads(search_niche);
CREATE INDEX idx_leads_city_state ON leads(city, state);
CREATE INDEX idx_leads_rating_reviews ON leads(rating DESC, review_count DESC);

-- Collection browsing indexes
CREATE INDEX idx_lead_collections_destination ON lead_collections(search_destination);
CREATE INDEX idx_lead_collections_term ON lead_collections(search_term);

-- Grid search performance indexes
CREATE INDEX idx_grid_searches_search_term ON grid_searches(search_term);
CREATE INDEX idx_grid_searches_location ON grid_searches(city, state);
CREATE INDEX idx_grid_searches_created_at ON grid_searches(created_at DESC);

-- Grid competitors lookup indexes
CREATE INDEX idx_grid_competitors_search_id ON grid_competitors(search_id);
CREATE INDEX idx_grid_competitors_place_id ON grid_competitors(place_id);
CREATE INDEX idx_grid_competitors_coverage ON grid_competitors(coverage_percent DESC);
CREATE INDEX idx_grid_competitors_avg_rank ON grid_competitors(avg_rank ASC);

-- Grid point results spatial indexes
CREATE INDEX idx_grid_point_results_search_competitor ON grid_point_results(search_id, competitor_id);
CREATE INDEX idx_grid_point_results_grid_position ON grid_point_results(grid_row, grid_col);
CREATE INDEX idx_grid_point_results_coordinates ON grid_point_results(lat, lng);

-- Grid cells spatial indexes  
CREATE INDEX idx_grid_cells_search_id ON grid_cells(search_id);
CREATE INDEX idx_grid_cells_position ON grid_cells(grid_row, grid_col);
CREATE INDEX idx_grid_cells_competition ON grid_cells(competition_level);
```

## Data Relationships

### Core Tables
```
leads (1) ←→ (many) lead_collections
leads (1) ←→ (many) competitor_searches (via source_directory)
competitor_searches (1) ←→ (many) leads (via collection)
```

### Grid Search Tables
```
grid_searches (1) ←→ (many) grid_competitors
grid_searches (1) ←→ (many) grid_point_results
grid_searches (1) ←→ (many) competitor_summaries  
grid_searches (1) ←→ (many) grid_cells

grid_competitors (1) ←→ (many) grid_point_results
grid_competitors (1) ←→ (1) competitor_summaries

grid_searches (parent)
├── grid_competitors (unique businesses found)
│   ├── grid_point_results (rankings at each grid coordinate)
│   └── competitor_summaries (aggregated performance stats)
└── grid_cells (grid cell metadata and competition analysis)
```

### Key Relationships
- **place_id** serves as the unique business identifier across grid_competitors
- **search_id** links all grid search data to the master search record
- **competitor_id** connects businesses to their specific ranking performances
- **grid_row/grid_col** coordinates enable spatial analysis and visualization

## Database Connection

The application uses Neon's serverless PostgreSQL with connection pooling:

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```

**Configuration:**
- Connection string via `DATABASE_URL` environment variable
- Serverless architecture with automatic scaling
- SQL template literals for prepared statement security

## Data Integrity

### Constraints
- `leads.place_id` must be unique (Google Places API constraint)
- `lead_collections.lead_id` must reference valid `leads.id`
- All search-related fields use consistent naming patterns

### Data Validation
- Email validation on capture forms
- Phone number formatting standardization
- URL validation for websites and social handles
- State code standardization (2-letter uppercase)

## Backup and Maintenance

### Migration Safety
- All migrations include rollback procedures
- Batch processing prevents timeout issues
- Transaction-based operations ensure data consistency
- Dry-run capabilities for testing migrations

### Performance Monitoring
- Query performance tracked via application logs
- Index usage monitored for optimization opportunities
- Connection pooling metrics available via Neon dashboard