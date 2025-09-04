# Database Schema Documentation

## Overview

The Lead Finder application uses a Neon PostgreSQL database with several interconnected tables to manage leads, collections, competitor searches, and captured leads.

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
```

## Data Relationships

```
leads (1) ←→ (many) lead_collections
leads (1) ←→ (many) competitor_searches (via source_directory)
competitor_searches (1) ←→ (many) leads (via collection)
```

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