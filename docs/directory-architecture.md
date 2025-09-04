# Directory Architecture Documentation

## Overview

The GetLocalRanked directory system implements a sophisticated dual-URL architecture that maximizes SEO coverage while maintaining clean, user-friendly navigation. This document details the complete architecture, implementation patterns, and strategic decisions behind the service-first directory structure.

## Architecture Philosophy

### Service-First Approach (Canonical)

The directory prioritizes **service-first URLs** as the canonical structure for optimal SEO performance:

```
/directory/[service]/[state]/[city]
```

**Strategic Benefits:**
- Better keyword targeting with service names leading the URL
- Enhanced local search visibility
- Clearer user intent matching
- Improved semantic URL structure
- Higher relevance for service-specific queries

### Dual URL Strategy

The system supports both service-first and collection-based URLs with proper canonicalization:

#### Service-First URLs (Canonical)
```
/directory/medical-spas/california/los-angeles
/directory/wellness-centers/texas/houston  
/directory/aesthetic-clinics/florida/miami
/directory/health-clinics/new-york/new-york-city
```

#### Collection-Based URLs (Alternative)
```
/directory/medspas/california/los-angeles
/directory/dental-practices/texas/houston
/directory/law-firms/florida/miami
/directory/veterinary/new-york/new-york-city
```

## URL Structure Patterns

### Service URL Mapping

The service-first architecture maps descriptive service names to business categories:

```typescript
const SERVICE_MAPPINGS = {
  'medical-spas': 'Medical Spas & Cosmetic Surgery',
  'wellness-centers': 'Wellness Centers & Health Services',
  'aesthetic-clinics': 'Aesthetic Clinics & Beauty Services',
  'health-clinics': 'Health Clinics & Medical Centers',
  'dental-practices': 'Dental Practices & Orthodontics',
  'veterinary-clinics': 'Veterinary Clinics & Animal Hospitals',
  'fitness-centers': 'Fitness Centers & Gyms',
  'chiropractic-clinics': 'Chiropractors & Physical Therapy'
}
```

### Geographic URL Structure

Each service follows a consistent geographic hierarchy:

```
/directory/[service]                    # National service overview
/directory/[service]/[state]            # State-level service directory  
/directory/[service]/[state]/[city]     # City-level service listings
```

### URL Normalization Rules

1. **Lowercase Only**: All URL segments in lowercase
2. **Hyphen Separators**: Spaces replaced with hyphens
3. **No Special Characters**: Clean, readable URLs only
4. **State Codes**: Full state names, not abbreviations (`california` not `ca`)
5. **City Names**: Full city names with hyphens (`new-york-city`, `los-angeles`)

## File System Architecture

### Directory Structure

```
app/
├── directory/
│   ├── page.tsx                    # Directory index page
│   ├── [service]/                  # Service-first pages (CANONICAL)
│   │   ├── page.tsx               # Service overview page
│   │   ├── [state]/               # State-level service pages
│   │   │   ├── page.tsx          # State service directory
│   │   │   └── [city]/           # City-level service pages
│   │   │       └── page.tsx      # City service listings
│   │   └── layout.tsx             # Service layout wrapper
│   └── [collection]/              # Collection-based pages (legacy support)
│       ├── page.tsx               # Collection overview page  
│       ├── [state]/               # State-level collection pages
│       │   ├── page.tsx          # State collection directory
│       │   └── [city]/           # City-level collection pages
│       │       └── page.tsx      # City collection listings
│       └── layout.tsx             # Collection layout wrapper
```

### Page Component Hierarchy

#### Service Pages (`/directory/[service]/`)

**Purpose**: National overview of specific service category
**Data**: Aggregated statistics across all states and cities
**SEO Focus**: Broad service keywords and national targeting

#### State Service Pages (`/directory/[service]/[state]/`)

**Purpose**: State-level directory for specific service
**Data**: State statistics and city listings
**SEO Focus**: State + service keyword combinations

#### City Service Pages (`/directory/[service]/[state]/[city]/`)

**Purpose**: Local business listings for specific service in city
**Data**: Individual business listings with full details
**SEO Focus**: Local SEO, city + service keywords

## API Architecture

### Directory API Endpoints

The directory system exposes a comprehensive REST API for data access:

```
GET /api/directory/services                           # List all services
GET /api/directory/services/[service]                 # Service overview data
GET /api/directory/services/[service]/[state]         # State service data  
GET /api/directory/services/[service]/[state]/[city]  # City service listings

# Legacy collection endpoints
GET /api/directory/collections                        # List all collections
GET /api/directory/[collection]/[state]/[city]       # Collection listings
```

### Response Structures

#### Service Overview Response
```json
{
  "service": {
    "slug": "medical-spas",
    "name": "Medical Spas",
    "description": "Advanced aesthetic treatments and cosmetic procedures",
    "totalBusinesses": 1247,
    "totalStates": 45,
    "totalCities": 312,
    "averageRating": 4.3,
    "totalReviews": 15420
  },
  "states": [
    {
      "code": "california",
      "name": "California", 
      "businessCount": 89,
      "averageRating": 4.4,
      "topCities": ["los-angeles", "san-francisco", "san-diego"]
    }
  ]
}
```

#### City Listings Response
```json
{
  "meta": {
    "service": "medical-spas",
    "state": "california",
    "city": "los-angeles",
    "totalBusinesses": 45,
    "averageRating": 4.3,
    "totalReviews": 2341
  },
  "businesses": [
    {
      "id": "business-123",
      "name": "Beverly Hills Med Spa",
      "address": "123 Rodeo Drive, Los Angeles, CA 90210",
      "phone": "(310) 555-0123",
      "website": "https://beverlyhillsmedspa.com",
      "rating": 4.8,
      "reviewCount": 234,
      "services": ["Botox", "Dermal Fillers", "Laser Treatments"],
      "coordinates": {
        "latitude": 34.0678,
        "longitude": -118.4003
      }
    }
  ]
}
```

## SEO Implementation

### Canonical URL Strategy

Each page implements proper canonical URL directives:

```html
<!-- Service-first canonical -->
<link rel="canonical" href="https://getlocalranked.com/directory/medical-spas/california/los-angeles" />

<!-- Alternative URL redirects to canonical -->
<meta http-equiv="refresh" content="0; url=/directory/medical-spas/california/los-angeles" />
```

### Meta Tag Generation

Dynamic meta tags optimize for local search:

```tsx
// Dynamic meta generation for service pages
export async function generateMetadata({ params }: { params: { service: string, state: string, city: string } }) {
  const { service, state, city } = params;
  const serviceData = await getServiceData(service, state, city);
  
  const title = `${serviceData.serviceName} in ${serviceData.cityName}, ${serviceData.stateName} (${serviceData.businessCount} Results) | GetLocalRanked Directory`;
  const description = `Find the best ${serviceData.serviceName.toLowerCase()} in ${serviceData.cityName}, ${serviceData.stateName}. Browse ${serviceData.businessCount} verified businesses with an average rating of ${serviceData.averageRating} stars.`;

  return {
    title,
    description,
    keywords: [service, city, state, `${service} ${city}`, `best ${service} ${city}`].join(', '),
    openGraph: {
      title,
      description,
      url: `https://getlocalranked.com/directory/${service}/${state}/${city}`,
      type: 'website'
    }
  };
}
```

### Structured Data Implementation

Each directory page includes comprehensive structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Medical Spas in Los Angeles, CA",
  "numberOfItems": 45,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "LocalBusiness",
        "name": "Beverly Hills Med Spa",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "123 Rodeo Drive",
          "addressLocality": "Los Angeles",
          "addressRegion": "CA",
          "postalCode": "90210",
          "addressCountry": "US"
        },
        "telephone": "(310) 555-0123",
        "url": "https://beverlyhillsmedspa.com",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": 4.8,
          "reviewCount": 234
        }
      }
    }
  ]
}
```

## Navigation Architecture

### Breadcrumb System

Consistent breadcrumb navigation maintains hierarchy clarity:

```tsx
// Service breadcrumbs
const serviceBreadcrumbs = [
  { name: 'Home', href: '/' },
  { name: 'Directory', href: '/directory' },
  { name: 'Medical Spas', href: '/directory/medical-spas' },
  { name: 'California', href: '/directory/medical-spas/california' },
  { name: 'Los Angeles', href: '/directory/medical-spas/california/los-angeles', current: true }
];
```

### Internal Linking Strategy

Strategic internal linking connects related pages:

```tsx
const generateRelatedLinks = (service: string, state: string, city: string) => {
  return [
    // Related services in same city
    `/directory/wellness-centers/${state}/${city}`,
    `/directory/aesthetic-clinics/${state}/${city}`,
    
    // Same service in nearby cities  
    `/directory/${service}/${state}/beverly-hills`,
    `/directory/${service}/${state}/santa-monica`,
    
    // State-level service page
    `/directory/${service}/${state}`,
    
    // National service overview
    `/directory/${service}`
  ];
};
```

## Performance Optimization

### Static Generation Strategy

The directory system leverages Next.js static generation for optimal performance:

```tsx
// Generate static paths for all service/state/city combinations
export async function generateStaticParams() {
  const services = await getServices();
  const locations = await getLocations();
  
  const paths = [];
  
  for (const service of services) {
    for (const state of locations.states) {
      for (const city of state.cities) {
        paths.push({
          service: service.slug,
          state: state.slug,
          city: city.slug
        });
      }
    }
  }
  
  return paths;
}
```

### Incremental Static Regeneration

Dynamic content updates through ISR:

```tsx
// Revalidate directory pages every hour
export const revalidate = 3600;

export default async function CityServicePage({ params }: { params: { service: string, state: string, city: string } }) {
  // Fetch fresh data on each build/revalidation
  const businessData = await getBusinessListings(params.service, params.state, params.city);
  
  return (
    <DirectoryPage 
      businesses={businessData.businesses}
      meta={businessData.meta}
      params={params}
    />
  );
}
```

## Migration Strategy

### Legacy URL Handling

The system maintains backward compatibility with collection-based URLs:

```tsx
// Redirect collection URLs to service URLs
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle legacy collection redirects
  if (pathname.startsWith('/directory/medspas/')) {
    const newPath = pathname.replace('/medspas/', '/medical-spas/');
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }
  
  // Handle other legacy patterns
  const legacyMapping = {
    '/directory/dental-practices/': '/directory/dental-clinics/',
    '/directory/law-firms/': '/directory/legal-services/'
  };
  
  for (const [legacy, modern] of Object.entries(legacyMapping)) {
    if (pathname.startsWith(legacy)) {
      const newPath = pathname.replace(legacy, modern);
      return NextResponse.redirect(new URL(newPath, request.url), 301);
    }
  }
}
```

## Analytics and Monitoring

### Directory Performance Tracking

Comprehensive analytics track directory usage:

```tsx
// Track directory page views
const trackDirectoryView = (service: string, state: string, city: string, businessCount: number) => {
  gtag('event', 'directory_view', {
    event_category: 'Directory',
    event_label: `${service}_${state}_${city}`,
    custom_parameters: {
      service_type: service,
      location: `${city}, ${state}`,
      business_count: businessCount
    }
  });
};

// Track business interactions
const trackBusinessInteraction = (businessId: string, action: string, service: string) => {
  gtag('event', 'business_interaction', {
    event_category: 'Business Directory',
    event_label: action,
    business_id: businessId,
    service_category: service
  });
};
```

### SEO Performance Monitoring

Monitor directory SEO performance:

- **Search Console**: Track directory page impressions, clicks, and rankings
- **Google Analytics**: Monitor organic traffic to directory pages
- **Core Web Vitals**: Ensure directory pages meet performance standards
- **Local Pack Tracking**: Monitor local search result appearances

## Scalability Considerations

### Database Optimization

The directory system is designed for scale:

```sql
-- Optimized indexes for directory queries
CREATE INDEX idx_businesses_collection_location ON businesses(collection, state, city);
CREATE INDEX idx_businesses_service_state ON businesses(service_type, state);
CREATE INDEX idx_businesses_rating ON businesses(rating DESC, review_count DESC);
CREATE INDEX idx_businesses_coordinates ON businesses USING GIST(coordinates);
```

### Caching Strategy

Multi-layer caching ensures fast response times:

```typescript
// API response caching
const cacheConfig = {
  'GET /api/directory/services': '6 hours',           // Service list changes infrequently
  'GET /api/directory/services/[service]': '2 hours',  // Service data updates regularly
  'GET /api/directory/services/[service]/[state]/[city]': '1 hour', // Business data changes frequently
  'Static directory pages': '24 hours',                // Static content cached longer
  'Dynamic business data': '15 minutes'                 // Real-time data cached briefly
};
```

This directory architecture provides a robust, scalable foundation for local business discovery while maximizing SEO performance and user experience. The dual URL strategy ensures comprehensive search coverage while the service-first canonical approach optimizes for the most valuable keyword combinations.