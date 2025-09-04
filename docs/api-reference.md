# API Reference - GetLocalRanked Directory System

## Base URL
```
Production: https://getlocalranked.com
Development: http://localhost:3000
```

## Authentication
Most directory endpoints are public. Analysis endpoints may require authentication.

## Directory API Endpoints

### Service-First Directory Endpoints (Canonical)

The platform now supports service-first directory endpoints as the canonical API structure for better SEO and keyword alignment.

### GET /api/directory/services
Lists all available services with comprehensive statistics and geographic coverage.

#### Response Format
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "slug": "medical-spas",
        "name": "Medical Spas",
        "description": "Advanced aesthetic treatments, Botox, fillers, and cosmetic procedures",
        "totalBusinesses": 1450,
        "totalStates": 25,
        "totalCities": 87,
        "averageRating": 4.3,
        "totalReviews": 15420,
        "keywords": ["medical spa", "botox", "aesthetic treatments"],
        "topStates": [
          {
            "code": "california",
            "name": "California",
            "businessCount": 340,
            "topCities": ["los-angeles", "san-francisco", "san-diego"]
          }
        ]
      }
    ],
    "stats": {
      "totalServices": 8,
      "totalBusinesses": 6511,
      "totalLocations": 95,
      "averageRating": 4.2
    }
  }
}
```

---

### GET /api/directory/services/[service]
Retrieves comprehensive data for a specific service category.

#### URL Parameters
- `service` - Service slug (e.g., "medical-spas", "wellness-centers", "aesthetic-clinics")

#### Response Format
```json
{
  "success": true,
  "data": {
    "service": {
      "slug": "medical-spas",
      "name": "Medical Spas",
      "description": "Advanced aesthetic treatments and cosmetic procedures",
      "totalBusinesses": 1450,
      "totalStates": 25,
      "totalCities": 87,
      "averageRating": 4.3,
      "totalReviews": 15420
    },
    "states": [
      {
        "code": "california", 
        "name": "California",
        "businessCount": 340,
        "averageRating": 4.4,
        "topCities": ["los-angeles", "san-francisco", "san-diego"],
        "growth": "+12%"
      }
    ]
  }
}
```

---

### GET /api/directory/services/[service]/[state]
Lists all cities for a specific service within a state.

#### URL Parameters
- `service` - Service slug
- `state` - State slug (e.g., "california", "texas", "florida")

#### Response Format
```json
{
  "success": true,
  "data": {
    "service": "medical-spas",
    "state": {
      "code": "california",
      "name": "California"
    },
    "cities": [
      {
        "slug": "los-angeles",
        "name": "Los Angeles", 
        "businessCount": 45,
        "averageRating": 4.3,
        "totalReviews": 8934,
        "featured": true
      }
    ],
    "stats": {
      "totalBusinesses": 340,
      "totalCities": 12,
      "averageRating": 4.4
    }
  }
}
```

---

### GET /api/directory/services/[service]/[state]/[city]
Retrieves businesses for a specific service in a city (canonical endpoint).

#### URL Parameters  
- `service` - Service slug
- `state` - State slug
- `city` - City slug

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Maximum businesses to return |
| `offset` | number | 0 | Skip businesses for pagination |
| `sort` | string | "rating" | Sort by: "rating", "review_count", "name" |
| `order` | string | "desc" | Sort direction: "asc", "desc" |

#### Example Request
```http
GET /api/directory/services/medical-spas/california/los-angeles?limit=25&sort=rating&order=desc
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "service": {
      "slug": "medical-spas",
      "name": "Medical Spas"
    },
    "location": {
      "city": "Los Angeles",
      "state": "California",
      "full": "Los Angeles, California"
    },
    "meta": {
      "totalBusinesses": 45,
      "averageRating": 4.3,
      "totalReviews": 8934,
      "pageTitle": "Medical Spas in Los Angeles, CA (45 Results) | GetLocalRanked",
      "pageDescription": "Find the best medical spas in Los Angeles, CA...",
      "canonicalUrl": "/directory/medical-spas/california/los-angeles"
    },
    "businesses": [
      {
        "id": 1234,
        "name": "Beverly Hills Med Spa",
        "address": {
          "street": "123 Rodeo Drive",
          "city": "Los Angeles", 
          "state": "CA",
          "zipCode": "90210",
          "full": "123 Rodeo Drive, Los Angeles, CA 90210"
        },
        "contact": {
          "phone": "(310) 555-0123",
          "website": "https://beverlyhillsmedspa.com",
          "email": "info@beverlyhillsmedspa.com"
        },
        "rating": 4.8,
        "reviewCount": 234,
        "priceLevel": "$$$",
        "coordinates": {
          "latitude": 34.0678,
          "longitude": -118.4003
        },
        "hours": {
          "monday": "9:00 AM - 6:00 PM",
          "tuesday": "9:00 AM - 6:00 PM",
          "status": "Open"
        },
        "services": ["Botox", "Dermal Fillers", "Laser Treatments"],
        "categories": ["Medical Spa", "Cosmetic Surgery"],
        "description": "Premier medical spa offering advanced aesthetic treatments...",
        "images": [
          "https://getlocalranked.com/images/businesses/1234/main.jpg"
        ]
      }
    ],
    "relatedLocations": {
      "nearbyServices": [
        {
          "service": "wellness-centers",
          "name": "Wellness Centers",
          "businessCount": 32,
          "url": "/directory/wellness-centers/california/los-angeles"
        }
      ],
      "nearbyCities": [
        {
          "city": "beverly-hills",
          "name": "Beverly Hills",
          "businessCount": 12,
          "url": "/directory/medical-spas/california/beverly-hills"
        }
      ]
    }
  }
}
```

---

## Collection-Based Directory Endpoints (Legacy)

### GET /api/directory/collections
Lists all available lead collections with statistics and location breakdowns.

#### Response Format
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

#### Collection Objects
| Field | Type | Description |
|-------|------|-------------|
| `collection` | string | URL-friendly collection identifier |
| `totalBusinesses` | number | Total businesses in this collection |
| `totalLocations` | number | Number of unique city/state combinations |
| `searchTerms` | array | Original search terms that populate this collection |
| `locationsByState` | object | Cities grouped by state abbreviation |

#### Overall Statistics
| Field | Type | Description |
|-------|------|-------------|
| `total_leads` | number | Total unique businesses across all collections |
| `total_collections` | number | Number of distinct business categories |
| `total_destinations` | number | Unique city/state combinations |
| `total_relationships` | number | Total collection-business relationships |

---

### GET /api/directory/[collection]/[state]/[city]
Retrieves businesses for a specific collection, state, and city combination.

#### URL Parameters
- `collection` - Collection identifier (e.g., "medspas", "dental-practices")
- `state` - State abbreviation (e.g., "california", "texas") 
- `city` - City name, URL-encoded (e.g., "los-angeles", "new-york-city")

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Maximum businesses to return |
| `offset` | number | 0 | Skip this many businesses (pagination) |
| `sort` | string | "rating" | Sort field: "rating", "review_count", "name" |
| `order` | string | "desc" | Sort direction: "asc", "desc" |

#### Example Request
```http
GET /api/directory/medspas/california/los-angeles?limit=25&sort=rating&order=desc
```

#### Response Format
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
      "total_locations": 12,
      "avg_rating": 4.3,
      "total_reviews": 8934
    },
    "leads": [
      {
        "id": 1234,
        "business_name": "Beverly Hills Med Spa",
        "address": "123 Rodeo Drive, Beverly Hills, CA 90210",
        "phone": "(310) 555-0123",
        "website": "https://beverlyhillsmedspa.com",
        "rating": 4.8,
        "review_count": 234,
        "price_level": "$$$",
        "place_id": "ChIJ...",
        "latitude": 34.0678,
        "longitude": -118.4003,
        "business_hours": {
          "monday": "9:00 AM - 6:00 PM",
          "tuesday": "9:00 AM - 6:00 PM"
        },
        "categories": ["Medical Spa", "Cosmetic Surgery"],
        "description": "Premier medical spa offering Botox, fillers, and laser treatments"
      }
    ],
    "nearbyCities": [
      {
        "destination": "Beverly Hills, CA",
        "count": 12
      },
      {
        "destination": "Santa Monica, CA", 
        "count": 8
      }
    ]
  }
}
```

#### Business Object Schema
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique business identifier |
| `business_name` | string | Business name |
| `address` | string | Full street address |
| `phone` | string | Phone number |
| `website` | string | Business website URL |
| `rating` | number | Google rating (1-5) |
| `review_count` | number | Number of Google reviews |
| `price_level` | string | Price range indicator |
| `place_id` | string | Google Places ID |
| `latitude` | number | GPS latitude |
| `longitude` | number | GPS longitude |
| `business_hours` | object | Operating hours by day |
| `categories` | array | Business category tags |
| `description` | string | AI-generated business description |

---

### GET /api/directory/[collection]
Lists all states available for a specific collection.

#### Example Request
```http
GET /api/directory/medspas
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "collection": "medspas",
    "states": [
      {
        "state": "CA",
        "stateName": "California",
        "businessCount": 340,
        "cities": ["Los Angeles", "San Francisco", "San Diego"]
      },
      {
        "state": "FL", 
        "stateName": "Florida",
        "businessCount": 280,
        "cities": ["Miami", "Orlando", "Tampa"]
      }
    ],
    "totalBusinesses": 1450,
    "totalStates": 25
  }
}
```

---

### GET /api/directory/[collection]/[state]
Lists all cities available for a specific collection and state.

#### Example Request
```http
GET /api/directory/medspas/california
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "collection": "medspas",
    "state": "CA",
    "stateName": "California", 
    "cities": [
      {
        "city": "Los Angeles",
        "businessCount": 45,
        "urlSlug": "los-angeles"
      },
      {
        "city": "San Francisco",
        "businessCount": 32, 
        "urlSlug": "san-francisco"
      }
    ],
    "totalBusinesses": 340,
    "totalCities": 12
  }
}
```

## Analysis API Endpoints

### POST /api/analyze
Analyzes a business's Google Maps ranking and competitive positioning.

#### Request Body
```json
{
  "businessName": "Beverly Hills Med Spa",
  "searchTerm": "med spa los angeles",
  "location": "Los Angeles, CA",
  "placeId": "ChIJ..." // optional
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "business": {
      "name": "Beverly Hills Med Spa",
      "currentRank": 7,
      "rating": 4.8,
      "reviewCount": 234,
      "estimatedMonthlySearches": 5400
    },
    "competitors": [
      {
        "name": "LA Laser Center",
        "rank": 1,
        "rating": 4.9,
        "reviewCount": 456
      }
    ],
    "insights": {
      "marketOpportunity": "$15,000/month",
      "competitiveGap": "2.1 points",
      "recommendedActions": ["Increase reviews", "Optimize GMB"]
    }
  }
}
```

---

### GET /api/competitors
Retrieves competitor data for analysis.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `searchTerm` | string | Yes | The search query |
| `location` | string | Yes | Search location |
| `limit` | number | No | Max competitors (default: 20) |

#### Example Request
```http
GET /api/competitors?searchTerm=med%20spa&location=Los%20Angeles%2C%20CA&limit=10
```

---

### GET /api/analysis-status/[jobId]
Checks the status of a running analysis job.

#### Response Format
```json
{
  "success": true,
  "data": {
    "jobId": "abc123",
    "status": "completed", // "pending", "running", "completed", "failed"
    "progress": 100,
    "result": {
      // Analysis results when completed
    }
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Resource not found",
  "message": "The requested collection 'invalid-collection' does not exist",
  "code": "COLLECTION_NOT_FOUND"
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `COLLECTION_NOT_FOUND` | 404 | Invalid collection identifier |
| `LOCATION_NOT_FOUND` | 404 | No businesses in specified location |
| `INVALID_PARAMETERS` | 400 | Missing or invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Internal database error |

## Available Services & Collections

### Current Services (Service-First Architecture)
1. **medical-spas** - Medical Spas & Aesthetic Treatments
2. **wellness-centers** - Wellness Centers & Health Services  
3. **aesthetic-clinics** - Aesthetic Clinics & Beauty Treatments
4. **health-clinics** - Health Clinics & Medical Centers
5. **dental-practices** - Dental Practices & Orthodontics
6. **veterinary-clinics** - Veterinary Clinics & Animal Hospitals
7. **fitness-centers** - Fitness Centers & Gyms
8. **chiropractic-clinics** - Chiropractors & Physical Therapy

### Legacy Collections (Collection-Based Architecture)
1. **medspas** - Medical Spas & Cosmetic Surgery
2. **dental-practices** - Dental Practices & Orthodontics  
3. **law-firms** - Law Firms & Legal Services
4. **hair-salons** - Hair Salons & Beauty Services
5. **veterinary** - Veterinary Clinics & Animal Hospitals
6. **chiropractors** - Chiropractors & Physical Therapy
7. **real-estate** - Real Estate Agencies & Agents
8. **auto-dealers** - Auto Dealerships & Car Sales
9. **restaurants** - Restaurants & Food Services

### Collection Statistics
| Collection | Businesses | States | Top Markets |
|------------|------------|--------|-------------|
| medspas | 1,450+ | 25 | CA, FL, TX, NY |
| dental-practices | 1,120+ | 28 | NY, CA, IL, FL |
| law-firms | 890+ | 22 | NY, CA, TX, FL |
| hair-salons | 780+ | 18 | VA, CA, FL, TX |
| veterinary | 650+ | 30 | Nationwide |
| chiropractors | 520+ | 24 | CA, TX, FL, NY |
| real-estate | 430+ | 20 | CA, TX, FL, AZ |
| auto-dealers | 380+ | 19 | TX, CA, FL, NY |
| restaurants | 291+ | 15 | CA, TX, FL, NY |

## Rate Limits

- **Directory endpoints**: 100 requests/minute per IP
- **Analysis endpoints**: 10 requests/minute per IP  
- **Collections endpoint**: 50 requests/minute per IP

## Caching

- Directory data: Cached for 1 hour
- Collections list: Cached for 6 hours
- Analysis results: Cached for 24 hours

## SDK Examples

### JavaScript/Node.js
```javascript
const client = new GetLocalRankedAPI('https://getlocalranked.com');

// Get all collections
const collections = await client.getCollections();

// Get businesses in specific location
const medspas = await client.getBusinesses('medspas', 'california', 'los-angeles', {
  limit: 25,
  sort: 'rating'
});

// Analyze business
const analysis = await client.analyzeBusiness({
  businessName: 'My Med Spa',
  searchTerm: 'med spa los angeles', 
  location: 'Los Angeles, CA'
});
```

### Python
```python
from getlocalranked import APIClient

client = APIClient('https://getlocalranked.com')

# Get collections
collections = client.get_collections()

# Get businesses
medspas = client.get_businesses(
    collection='medspas',
    state='california', 
    city='los-angeles',
    limit=25
)
```

### cURL Examples
```bash
# Get collections
curl -X GET "https://getlocalranked.com/api/directory/collections"

# Get businesses
curl -X GET "https://getlocalranked.com/api/directory/medspas/california/los-angeles?limit=25"

# Analyze business
curl -X POST "https://getlocalranked.com/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Med Spa",
    "searchTerm": "med spa los angeles",
    "location": "Los Angeles, CA"
  }'
```

## Support & Contact

For API support, documentation updates, or feature requests:
- **Email**: api-support@getlocalranked.com
- **Documentation**: https://getlocalranked.com/docs
- **Status Page**: https://status.getlocalranked.com