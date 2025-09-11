# API Documentation

## Overview

This document describes the API endpoints for the Lead Finder application, including the new grid search analysis system, directory endpoints, and lead collections system.

## Base Configuration

All endpoints use Next.js API routes and connect to a Neon database via the `@/lib/db` module.

## Grid Search Endpoints

The grid search system provides comprehensive geographic analysis through multiple endpoints for different use cases.

### POST /api/grid-search

Executes a comprehensive 169-point grid search analysis covering a 5-mile radius around the target location using the Python/Flask backend via Railway.

**Request Body:**
```json
{
  "niche": "medical spa",          // Required - search term for business type
  "city": "Austin",                // Required if not using coordinates
  "state": "TX",                   // Required if not using coordinates
  "businessName": "Elite Med Spa", // Optional - for targeted business tracking
  "centerLat": 30.2672,           // Optional - use instead of city/state
  "centerLng": -97.7431,          // Optional - use instead of city/state  
  "radiusMiles": 5,               // Optional - defaults to 5 miles
  "gridSize": 13                  // Optional - defaults to 13 (169 total points)
}
```

**Parameters:**
- Either `city`/`state` OR `centerLat`/`centerLng` must be provided for location
- `niche` is required and determines what type of businesses to search for
- `businessName` enables targeted tracking of a specific business within the grid
- `radiusMiles` and `gridSize` can be customized for different analysis scales

**Response Structure:**
```json
{
  "success": true,
  "gridData": {
    "searchTerm": "medical spa",
    "targetBusiness": {
      "name": "Elite Med Spa",
      "lat": 30.2672,
      "lng": -97.7431,
      "coverage": 45.6,           // Percentage of grid points where business appears
      "pointsFound": 77,          // Number of grid points with business presence
      "totalPoints": 169,         // Total grid points analyzed
      "avgRank": 8.3,            // Average ranking across appearances
      "bestRank": 2,             // Best ranking achieved
      "worstRank": 18            // Worst ranking found
    },
    "gridPoints": [
      {
        "lat": 30.3015,
        "lng": -97.7853,
        "gridRow": 0,
        "gridCol": 0, 
        "targetRank": 5,          // Business rank at this location (999 = not found)
        "totalResults": 20,       // Total competitors at this location
        "topCompetitors": [       // Top 3 competitors at this grid point
          {
            "name": "Austin Dermatology",
            "rank": 1,
            "rating": 4.9,
            "reviews": 324
          }
        ]
      }
    ],
    "competitors": [              // All unique businesses found across grid
      {
        "name": "Austin Dermatology", 
        "rating": 4.9,
        "reviews": 324,
        "appearances": 142,       // Grid points where business appears
        "avgRank": "2.1",        // Average ranking
        "coverage": "84.0"       // Percentage coverage
      }
    ],
    "summary": {
      "totalUniqueBusinesses": 89,
      "successRate": "98.2",     // Percentage of successful grid searches
      "executionTime": 127       // Seconds to complete
    }
  }
}
```

**Key Features:**
- Performs 169 simultaneous searches across 13x13 grid
- Extracts comprehensive business data including place_id, coordinates, phone, address
- Calculates coverage statistics and geographic performance intelligence
- Returns interactive heat map data for visualization
- Stores results in optimized database structure for future analysis

### GET /api/grid-search-from-db

Retrieves the most recent grid search results from the database instead of performing a new search. Supports optional filtering by location and search term.

**Query Parameters:**
- `city`: Optional city filter (e.g., "Austin")
- `searchTerm`: Optional search term filter (e.g., "medical spa")
- `searchId`: Optional specific search UUID to retrieve

**Examples:**
```
GET /api/grid-search-from-db
GET /api/grid-search-from-db?city=Austin&searchTerm=medical spa
GET /api/grid-search-from-db?searchId=uuid-of-specific-search
```

**Response Structure:**
Same as `/api/grid-search` but retrieved from database storage for faster access to historical data.

### POST /api/grid-search-temp

Temporary grid search endpoint for development and testing. Provides the same functionality as the main endpoint but may include additional debugging information.

**Request Body:**
Same as `/api/grid-search`

**Response Structure:**
Same as `/api/grid-search` with potential debugging metadata added.

### GET /api/grid-search-test-data

Returns pre-computed test data for grid search development and demonstration.

**Response Structure:**
Same as `/api/grid-search` but with static test data for instant results.

## Directory Endpoints

### GET /api/directory/collections

Retrieves all available lead collections with statistics and location information.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "collection": "med_spas_austin_tx",
        "totalBusinesses": 145,
        "totalLocations": 1,
        "searchTerms": ["med spas"],
        "locationsByState": {
          "TX": ["Austin"]
        }
      }
    ],
    "stats": {
      "total_leads": 6511,
      "total_collections": 89,
      "total_destinations": 45,
      "total_relationships": 6511
    }
  }
}
```

**Key Features:**
- Groups locations by state for easier navigation
- Provides aggregated statistics across all collections
- Returns total business count per collection
- Includes all search terms used for each collection

### GET /api/directory/[collection]/[state]/[city]

Retrieves all leads for a specific collection and destination with detailed information.

**Parameters:**
- `collection`: URL-encoded collection name (e.g., "med_spas_austin_tx")
- `state`: Two-letter state code (e.g., "TX")
- `city`: City name with hyphens for spaces (e.g., "san-antonio")

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "collection": "med_spas_austin_tx",
    "location": {
      "city": "Austin",
      "state": "TX",
      "full": "Austin, TX"
    },
    "stats": {
      "total_businesses": 145,
      "total_locations": 1,
      "avg_rating": 4.2,
      "total_reviews": 12450
    },
    "leads": [
      {
        "id": 12345,
        "business_name": "Elite Med Spa",
        "rating": 4.8,
        "review_count": 234,
        "city": "Austin",
        "state": "TX",
        "website": "https://elitemedspa.com",
        "phone": "(512) 555-0123",
        "street_address": "123 Main St",
        "owner_name": "Dr. Sarah Johnson",
        "medical_director_name": "Dr. Michael Chen"
      }
    ],
    "nearbyCities": [
      {
        "destination": "San Antonio, TX",
        "count": 89
      }
    ]
  }
}
```

**Key Features:**
- Returns leads ordered by rating and review count
- Includes comprehensive business information
- Provides statistics for the specific collection
- Lists nearby cities with the same collection type

## Analysis Endpoint

### GET /api/analyze

Analyzes a specific business within its competitive landscape.

**Query Parameters:**
- `id`: Business ID (optional)
- `name`: Business name for search (optional)
- `city`: Collection/city name (used as collection identifier)
- `state`: Two-letter state code
- `niche`: Business niche/category

**Response Structure:**
```json
{
  "source": "db",
  "business": {
    "name": "Elite Med Spa",
    "rating": 4.8,
    "reviewCount": 234,
    "city": "Austin",
    "state": "TX",
    "niche": "med spas",
    "website": "https://elitemedspa.com",
    "ownerName": "Dr. Sarah Johnson"
  },
  "analysis": {
    "currentRank": 3,
    "potentialTraffic": "15%",
    "lostRevenue": 0,
    "competitors": [],
    "marketIntel": {
      "market_summary": {
        "total_businesses": 145,
        "avg_rating": 4.2,
        "avg_reviews": 86,
        "median_reviews": 45,
        "max_reviews": 1250
      }
    }
  }
}
```

## Leads Endpoint

### GET /api/leads

Retrieves leads with optional filtering and pagination.

### POST /api/leads

Creates a new lead capture record.

## Database Schema Integration

### Grid Search Tables

The grid search system uses 5 specialized tables for optimized storage and analysis:

```sql
-- Master search records
grid_searches (
  id UUID PRIMARY KEY,
  search_term VARCHAR(255),
  center_lat DECIMAL(10,7),
  center_lng DECIMAL(10,7),
  grid_size INTEGER,           -- 169 for 13x13 grid
  total_unique_businesses INTEGER,
  execution_time_seconds INTEGER,
  success_rate DECIMAL(5,2),
  session_id VARCHAR(255),
  created_at TIMESTAMP
)

-- All unique businesses found across grid
grid_competitors (
  id UUID PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id),
  place_id VARCHAR(255) NOT NULL,  -- Google Places unique identifier
  name VARCHAR(255),
  rating DECIMAL(2,1),
  reviews INTEGER,
  business_lat DECIMAL(10,7),
  business_lng DECIMAL(10,7),
  address TEXT,
  appearances INTEGER,        -- Number of grid points where business appears
  coverage_percent DECIMAL(5,2),
  avg_rank DECIMAL(5,2),
  best_rank INTEGER,
  worst_rank INTEGER
)

-- Individual business rankings at each grid point
grid_point_results (
  id UUID PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id),
  competitor_id UUID REFERENCES grid_competitors(id),
  grid_row INTEGER,           -- 0-12 for 13x13 grid
  grid_col INTEGER,           -- 0-12 for 13x13 grid
  lat DECIMAL(10,7),         -- Actual grid point coordinates
  lng DECIMAL(10,7),
  rank_position INTEGER,     -- Business rank at this location
  total_results_at_point INTEGER
)

-- Grid cell metadata and statistics
grid_cells (
  id UUID PRIMARY KEY,
  search_id UUID REFERENCES grid_searches(id),
  grid_row INTEGER,
  grid_col INTEGER,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  total_businesses INTEGER,
  competition_level VARCHAR(20),  -- 'low', 'medium', 'high', 'very_high'
  top_3_competitors JSONB
)
```

### Lead Collections Tables

All directory endpoints utilize the `lead_collections` table structure:

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

This many-to-many relationship allows leads to belong to multiple collections while maintaining data integrity.

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Failed to fetch collections",
  "message": "Specific error details"
}
```

## Performance Considerations

### Grid Search Optimizations
- **Bulk Insert Operations:** Grid data uses batch inserts of 1000 records for optimal performance
- **Place ID Deduplication:** Prevents duplicate business records through unique place_id constraints
- **Spatial Indexing:** Geographic queries optimized with lat/lng column indexes
- **Parallel Processing:** 169 search operations executed simultaneously for speed
- **Connection Pooling:** Neon serverless database automatically scales with demand

### General API Performance
- Collections endpoint uses aggregation queries for efficiency
- Directory endpoint includes result limiting and sorting
- Analysis endpoint uses indexed lookups by ID when possible
- All database queries use prepared statements via Neon's SQL template literals