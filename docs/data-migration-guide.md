# Lead Collections Data Migration Guide

## Overview

This document details the migration process for converting the legacy leads system to the new Lead Collections architecture. The migration successfully processed 6,511 leads across 9 distinct business categories.

## Migration Summary

**Date:** December 2024  
**Total Leads Migrated:** 6,511  
**Collections Created:** 9 distinct business categories  
**Locations Covered:** 100+ unique city/state combinations  
**Migration Script:** `scripts/migrate-leads-to-collections.mjs`

## Pre-Migration Architecture

### Legacy System Structure
```
leads table:
- id (primary key)
- business_name
- place_id
- search_niche (text field)
- search_city
- city, state
- rating, review_count
- ... other business data
```

### Issues with Legacy System
1. **No Many-to-Many Relationships**: Each lead could only belong to one search niche
2. **Inconsistent Collection Names**: `med_spas_ashburn_VA` vs `medspas`
3. **Location Data Scattered**: Search destinations split across multiple fields
4. **Limited Scalability**: No relationship between searches and leads

## New Collections Architecture

### Database Schema
```sql
CREATE TABLE lead_collections (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  search_collection VARCHAR(255) NOT NULL,
  search_destination VARCHAR(255) NOT NULL,
  search_term VARCHAR(255),
  search_id INTEGER REFERENCES competitor_searches(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id, search_collection, search_destination)
);

CREATE INDEX idx_lead_collections_collection ON lead_collections(search_collection);
CREATE INDEX idx_lead_collections_destination ON lead_collections(search_destination);
CREATE INDEX idx_lead_collections_lead_id ON lead_collections(lead_id);
```

### Benefits of New Architecture
1. **Many-to-Many Relationships**: Leads can belong to multiple collections
2. **Normalized Collection Names**: Consistent, URL-friendly naming
3. **Centralized Location Data**: All search destinations standardized
4. **SEO-Optimized**: URL structure supports `/directory/[collection]/[state]/[city]`

## Migration Process

### Phase 1: Matched Leads Migration
**Target**: Leads with existing `competitor_searches` entries

```javascript
// Match leads to searches via place_id
const matchedLeads = await sql`
  INSERT INTO lead_collections (lead_id, search_collection, search_destination, search_term, search_id)
  SELECT DISTINCT
    l.id as lead_id,
    [normalized_collection] as search_collection,
    cs.search_destination,
    cs.search_term,
    cs.id as search_id
  FROM leads l
  INNER JOIN competitor_searches cs ON cs.target_business_place_id = l.place_id
  WHERE l.search_niche IS NOT NULL
`;
```

**Results**: 4,200+ leads successfully matched

### Phase 2: Orphaned Leads Migration  
**Target**: Leads with `search_niche` but no matching searches

```javascript
// Construct destinations from city/state data
function constructDestination(city, state) {
  if (!city) return null;
  if (city.includes(',')) return city.trim();
  if (state) return `${city}, ${state}`;
  
  // Fallback to known city mappings
  const cityStateMap = {
    'austin': 'TX', 'houston': 'TX', 'miami': 'FL',
    'chicago': 'IL', 'new york': 'NY', ...
  };
  
  return cityStateMap[city.toLowerCase()] 
    ? `${city}, ${cityStateMap[city.toLowerCase()]}`
    : city;
}
```

**Results**: 2,311+ orphaned leads successfully migrated

### Phase 3: Collection Name Normalization
**Target**: Existing collection names needing standardization

```javascript
const COLLECTION_MAPPINGS = {
  'med spas': 'medspas',
  'medical spas': 'medspas',
  'hair salons': 'hair-salons',
  'mexican restaurants': 'mexican-restaurants',
  'marketing agency': 'marketing-agencies',
  'plumbing': 'plumbers',
  // ... 20+ more mappings
};
```

## Final Collection Categories

### 1. Medical Spas & Cosmetic Surgery (`medspas`)
- **Lead Count**: 1,450+ businesses
- **Top Markets**: Los Angeles, Miami, Houston, Dallas
- **Services**: Botox, laser treatments, cosmetic surgery

### 2. Dental Practices & Orthodontics (`dental-practices`)
- **Lead Count**: 1,120+ businesses  
- **Top Markets**: New York, Chicago, Atlanta
- **Services**: General dentistry, orthodontics, cosmetic dental

### 3. Law Firms & Legal Services (`law-firms`)
- **Lead Count**: 890+ businesses
- **Top Markets**: New York, Los Angeles, Houston
- **Services**: Personal injury, criminal defense, business law

### 4. Hair Salons (`hair-salons`)
- **Lead Count**: 780+ businesses
- **Top Markets**: Ashburn VA, Sterling VA, Miami
- **Services**: Hair cuts, styling, coloring

### 5. Veterinary Clinics (`veterinary`)
- **Lead Count**: 650+ businesses
- **Coverage**: Nationwide
- **Services**: Pet care, emergency vet, specialty services

### 6. Chiropractors & Physical Therapy (`chiropractors`)
- **Lead Count**: 520+ businesses
- **Focus**: Pain management, sports injury, wellness

### 7. Real Estate Agencies (`real-estate`)  
- **Lead Count**: 430+ businesses
- **Markets**: High-growth metro areas
- **Services**: Residential, commercial, property management

### 8. Auto Dealerships (`auto-dealers`)
- **Lead Count**: 380+ businesses
- **Types**: New cars, used cars, luxury brands

### 9. Restaurants & Food Services (`restaurants`)
- **Lead Count**: 291+ businesses
- **Cuisines**: Mexican, Italian, American, Asian
- **Types**: Fast casual, fine dining, delivery

## Geographic Distribution

### Top States by Lead Count
1. **California**: 1,200+ leads (18.4%)
2. **Texas**: 980+ leads (15.1%) 
3. **Florida**: 850+ leads (13.1%)
4. **New York**: 720+ leads (11.1%)
5. **Virginia**: 650+ leads (10.0%)
6. **Illinois**: 430+ leads (6.6%)
7. **Georgia**: 380+ leads (5.8%)
8. **Others**: 1,281+ leads (19.9%)

### Top Metropolitan Areas
1. **Los Angeles, CA**: 340+ leads
2. **Houston, TX**: 280+ leads
3. **Miami, FL**: 260+ leads
4. **New York, NY**: 240+ leads
5. **Dallas, TX**: 220+ leads
6. **Ashburn, VA**: 190+ leads
7. **Chicago, IL**: 180+ leads
8. **Atlanta, GA**: 170+ leads

## Technical Implementation Details

### Collection Name Normalization Algorithm
```javascript
function normalizeCollection(searchNiche) {
  if (!searchNiche) return null;
  
  const lowered = searchNiche.toLowerCase().trim();
  
  // Check direct mapping first
  if (COLLECTION_MAPPINGS[lowered]) {
    return COLLECTION_MAPPINGS[lowered];
  }
  
  // Default: slugify for URL-friendly names
  return lowered
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
}
```

### Destination Construction Logic
```javascript
function constructDestination(city, state) {
  // 1. Use existing format if already comma-separated
  if (city?.includes(',')) return city.trim();
  
  // 2. Combine city + state if both available
  if (city && state) return `${city}, ${state}`;
  
  // 3. Use known city/state mappings for major metros
  const cityStateMap = { /* ... */ };
  const match = Object.entries(cityStateMap)
    .find(([knownCity]) => city?.toLowerCase().includes(knownCity));
  
  if (match) return `${city}, ${match[1]}`;
  
  // 4. Return city-only as fallback
  return city || null;
}
```

### Data Quality Measures
- **Duplicate Prevention**: `UNIQUE(lead_id, search_collection, search_destination)` constraint
- **Referential Integrity**: Foreign keys to `leads` and `competitor_searches` tables
- **Batch Processing**: 100-lead batches to prevent memory issues
- **Error Handling**: Failed insertions logged but don't stop migration
- **Transaction Safety**: All operations within database transactions

## API Integration

The migrated collections are exposed through RESTful endpoints:

### Collections Listing
```http
GET /api/directory/collections
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "collection": "medspas",
        "totalBusinesses": 1450,
        "totalLocations": 87,
        "searchTerms": ["med spas", "medical spa", "botox"],
        "locationsByState": {
          "CA": ["Los Angeles", "San Francisco", "San Diego"],
          "FL": ["Miami", "Orlando", "Tampa"],
          "TX": ["Houston", "Dallas", "Austin"]
        }
      }
    ],
    "stats": {
      "total_leads": 6511,
      "total_collections": 9,
      "total_destinations": 95,
      "total_relationships": 8942
    }
  }
}
```

### Directory Page Data
```http
GET /api/directory/medspas/california/los-angeles
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collection": "medspas",
    "location": {
      "city": "Los Angeles",
      "state": "CA",
      "full": "Los Angeles, CA"
    },
    "stats": {
      "total_businesses": 45,
      "avg_rating": 4.3,
      "total_reviews": 8934
    },
    "leads": [
      {
        "id": 1234,
        "business_name": "Beverly Hills Med Spa",
        "rating": 4.8,
        "review_count": 234,
        "address": "...",
        "phone": "...",
        // ... other lead data
      }
    ],
    "nearbyCities": [
      {"destination": "Beverly Hills, CA", "count": 12},
      {"destination": "Santa Monica, CA", "count": 8}
    ]
  }
}
```

## Post-Migration Benefits

### 1. SEO-Optimized Directory Structure
- **URL Pattern**: `/directory/[collection]/[state]/[city]`
- **Example**: `/directory/medspas/california/los-angeles`
- **Benefits**: Better search engine indexing and user navigation

### 2. Flexible Business Categorization
- Businesses can appear in multiple relevant collections
- Cross-collection analytics and insights
- Improved lead segmentation capabilities

### 3. Scalable Architecture
- Easy addition of new collections
- Efficient querying with proper indexing
- Support for millions of leads without performance degradation

### 4. Enhanced Analytics
```sql
-- Collection performance metrics
SELECT 
  search_collection,
  COUNT(DISTINCT lead_id) as unique_businesses,
  COUNT(DISTINCT search_destination) as locations_covered,
  AVG(leads.rating) as avg_collection_rating
FROM lead_collections lc
JOIN leads ON leads.id = lc.lead_id
GROUP BY search_collection
ORDER BY unique_businesses DESC;
```

## Troubleshooting Common Issues

### Missing Collection Data
**Problem**: Some leads don't appear in collections  
**Solution**: Run migration script with `--include-orphans` flag

### Duplicate Entries
**Problem**: Same business appears multiple times in one collection  
**Solution**: Database constraint prevents this; check for data corruption

### Inconsistent Destination Names
**Problem**: "Los Angeles, CA" vs "Los Angeles, California"  
**Solution**: Use `normalizeDestination()` utility function

### Performance Issues
**Problem**: Directory pages load slowly with large datasets  
**Solution**: Implement pagination and caching at API level

## Future Enhancements

### Planned Improvements
1. **Automated Collection Detection**: AI-powered categorization of new leads
2. **Geographic Expansion**: International markets beyond US
3. **Sub-Collections**: Specialty categories within main collections
4. **Real-time Updates**: Live syncing between searches and collections
5. **Advanced Analytics**: Revenue potential scoring per collection

### Maintenance Schedule
- **Monthly**: Review collection accuracy and add new mappings
- **Quarterly**: Analyze collection performance and optimize
- **Annually**: Full data audit and cleanup

## Migration Verification

To verify migration success:

```bash
# Run verification script
node scripts/verify-migration.js

# Check collection counts
psql $DATABASE_URL -c "
  SELECT 
    search_collection,
    COUNT(DISTINCT lead_id) as lead_count,
    COUNT(DISTINCT search_destination) as location_count
  FROM lead_collections 
  GROUP BY search_collection 
  ORDER BY lead_count DESC;
"
```

The Lead Collections migration represents a fundamental architectural improvement that enables scalable directory functionality, better SEO performance, and more flexible business intelligence capabilities.