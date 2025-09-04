# API Documentation

## Overview

This document describes the API endpoints for the Lead Finder application, focusing on the new directory endpoints and lead collections system.

## Base Configuration

All endpoints use Next.js API routes and connect to a Neon database via the `@/lib/db` module.

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

All directory endpoints utilize the new `lead_collections` table structure:

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

- Collections endpoint uses aggregation queries for efficiency
- Directory endpoint includes result limiting and sorting
- Analysis endpoint uses indexed lookups by ID when possible
- All database queries use prepared statements via Neon's SQL template literals