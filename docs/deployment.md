# Deployment Guide

## Overview

This guide covers the complete deployment process for the GetLocalRanked platform, including CSS build optimization, environment configuration, and production deployment strategies for both the Next.js frontend and supporting infrastructure.

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher  
- **PostgreSQL**: 14.x or higher (for database features)
- **Git**: For version control and deployment
- **Memory**: Minimum 2GB RAM for build process

### Development Tools

```bash
# Install required global packages
npm install -g vercel
npm install -g @next/codemod
npm install -g lighthouse
```

## Environment Configuration

### Environment Variables

Create `.env.local` for local development and configure production environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# API Configuration  
NEXT_PUBLIC_API_URL=https://getlocalranked.com/api
API_BASE_URL=https://your-backend-api.com

# External APIs
GOOGLE_PLACES_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_key

# Authentication (if using)
NEXTAUTH_URL=https://getlocalranked.com
NEXTAUTH_SECRET=your_secret_key

# Analytics
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX

# Performance Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id

# Feature Flags
NEXT_PUBLIC_ENABLE_DIRECTORY=true
NEXT_PUBLIC_ENABLE_ANALYSIS=true
NEXT_PUBLIC_ENABLE_LEAD_CAPTURE=true
```

### Environment-Specific Configuration

#### Development
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DEBUG=true
```

#### Staging
```bash
# Staging environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://staging.getlocalranked.com/api
DEBUG=false
```

#### Production
```bash
# Production environment  
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://getlocalranked.com/api
DEBUG=false
```

## CSS Build Process

### Development Build

```bash
# Install dependencies
npm install

# Build CSS for development
npm run css:build

# Watch for changes during development
npm run css:watch

# Start development server
npm run dev
```

### Production CSS Optimization

The CSS build process includes multiple optimization steps:

```bash
# Complete production CSS build
npm run build:css

# Individual steps:
npm run css:build      # Build from source
npm run css:purge      # Remove unused CSS
npm run css:minify     # Minify and compress
npm run css:analyze    # Analyze bundle size
```

#### CSS Build Configuration

**PostCSS Configuration** (`postcss.config.cjs`):
```javascript
module.exports = {
  plugins: {
    'postcss-import': {},                    // Import CSS files
    'postcss-custom-properties': {           // Process CSS variables
      preserve: false                        // Remove custom properties in production
    },
    'postcss-nested': {},                    // Enable nested CSS
    'autoprefixer': {},                      // Add vendor prefixes
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {                          // Minify CSS in production
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: true
        }]
      }
    } : {})
  }
};
```

**PurgeCSS Configuration** (`purgecss.config.cjs`):
```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}', 
    './pages/**/*.{js,ts,jsx,tsx}'
  ],
  css: ['./public/styles/bundle.css'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  safelist: [
    // Preserve dynamic classes
    /^grid-cols-/,
    /^md:/,
    /^lg:/,
    /^hover:/,
    /^focus:/,
    /^data-/,
    // Component-specific classes
    'business-card',
    'directory-grid',
    'stats-bar'
  ],
  blocklist: [
    // Remove unused utility classes
    /^debug-/,
    /^test-/
  ]
};
```

### Bundle Size Targets

| Environment | Target Size | Actual Size | Notes |
|------------|-------------|-------------|-------|
| Development | ~120KB | Variable | Unoptimized, includes source maps |
| Production | <45KB gzipped | ~38KB | Purged and minified |
| Critical CSS | <14KB | ~12KB | Above-the-fold styles only |

## Next.js Build Optimization

### Build Configuration

**Next.js Configuration** (`next.config.js`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  },
  
  // Image optimization
  images: {
    domains: ['getlocalranked.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400
  },
  
  // Compression
  compress: true,
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/styles/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      // Redirect legacy collection URLs to service URLs
      {
        source: '/directory/medspas/:state/:city',
        destination: '/directory/medical-spas/:state/:city',
        permanent: true,
      },
      {
        source: '/directory/dental-practices/:state/:city',
        destination: '/directory/dental-clinics/:state/:city', 
        permanent: true,
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
```

### Static Generation Strategy

```javascript
// Generate static paths for directory pages
export async function generateStaticParams() {
  const services = await getServices();
  const locations = await getLocations();
  
  const paths = [];
  
  // Generate all service/state/city combinations
  for (const service of services) {
    // Service overview pages
    paths.push({ service: service.slug });
    
    for (const state of locations.states) {
      // State service pages
      paths.push({ 
        service: service.slug, 
        state: state.slug 
      });
      
      for (const city of state.cities.slice(0, 50)) { // Limit to top 50 cities per state
        // City service pages
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

// ISR configuration
export const revalidate = 3600; // Revalidate every hour
```

### Build Commands

```bash
# Development build
npm run build

# Production build with all optimizations
npm run build:production

# Analyze bundle size
npm run analyze

# Custom build scripts
npm run build:css && npm run build
```

## Database Deployment

### Migration Strategy

```sql
-- Production migration script
-- migrations/001_initial_setup.sql

-- Create indexes for directory queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_service_location 
ON businesses(service_type, state, city);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_rating 
ON businesses(rating DESC, review_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_coordinates 
ON businesses USING GIST(coordinates);

-- Create collections table if not exists
CREATE TABLE IF NOT EXISTS lead_collections (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    collection VARCHAR(100) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    search_location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_collections_business 
ON lead_collections(business_id);

CREATE INDEX IF NOT EXISTS idx_lead_collections_collection 
ON lead_collections(collection);
```

### Database Configuration

```javascript
// lib/database.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { pool };
```

## Vercel Deployment

### Vercel Configuration

**`vercel.json`**:
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build:production",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/styles/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/api/sitemap"
    }
  ]
}
```

### Deployment Steps

#### Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add GOOGLE_PLACES_API_KEY production
vercel env add OPENAI_API_KEY production
```

#### Continuous Deployment
```bash
# Deploy to production
vercel --prod

# Deploy to preview (staging)  
vercel

# Deploy specific branch
vercel --target production --confirm
```

### Environment Variables in Vercel

Configure in Vercel Dashboard or via CLI:

```bash
# Production environment variables
vercel env add NEXT_PUBLIC_API_URL production
vercel env add DATABASE_URL production
vercel env add GOOGLE_PLACES_API_KEY production
vercel env add NEXT_PUBLIC_GA_ID production

# Preview environment variables  
vercel env add NEXT_PUBLIC_API_URL preview
vercel env add DATABASE_URL preview
```

## Performance Optimization

### Lighthouse Targets

Target scores for production:
- **Performance**: 95+
- **Accessibility**: 95+
- **Best Practices**: 100
- **SEO**: 100

### Core Web Vitals

```javascript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Send to your analytics service
  gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    event_label: id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Optimization Checklist

#### CSS Optimization
- [ ] CSS bundle under 45KB gzipped
- [ ] Critical CSS inlined (<14KB)
- [ ] Unused CSS purged
- [ ] CSS minified and compressed

#### JavaScript Optimization
- [ ] Bundle analyzed for optimal splitting
- [ ] Unused dependencies removed
- [ ] Dynamic imports for code splitting
- [ ] Service worker implemented

#### Image Optimization  
- [ ] Images converted to WebP/AVIF
- [ ] Responsive images implemented
- [ ] Lazy loading configured
- [ ] Proper sizing and compression

#### Performance Monitoring
- [ ] Core Web Vitals tracking
- [ ] Real User Monitoring (RUM)
- [ ] Lighthouse CI integration
- [ ] Performance budgets set

## Monitoring & Analytics

### Analytics Setup

```typescript
// Google Analytics 4 configuration
import { gtag } from 'ga-gtag';

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url: string) => {
  gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Track directory interactions
export const trackDirectoryEvent = (action: string, service: string, location: string) => {
  gtag('event', action, {
    event_category: 'Directory',
    event_label: `${service}_${location}`,
    service_type: service,
    location: location
  });
};
```

### Error Monitoring

```typescript
// Error tracking with Sentry or similar
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null;
      }
    }
    return event;
  },
});
```

## Production Maintenance

### Health Checks

```typescript
// API health check endpoint
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check external API availability
    const response = await fetch(process.env.API_BASE_URL + '/health');
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      database: 'connected',
      api: response.ok ? 'available' : 'unavailable'
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

### Backup Strategy

```bash
# Automated database backup
#!/bin/bash
# backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database-backups/

# Keep last 30 days of backups
find ./backups -name "backup_*.sql" -mtime +30 -delete
```

### Update Procedure

```bash
# Production update procedure
#!/bin/bash

# 1. Run tests
npm test

# 2. Build and optimize
npm run build:production

# 3. Run database migrations (if any)
npm run migrate:prod

# 4. Deploy to staging
vercel --target preview

# 5. Run smoke tests
npm run test:smoke

# 6. Deploy to production
vercel --prod

# 7. Verify deployment
curl https://getlocalranked.com/api/health
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for type errors
npm run type-check
```

#### CSS Issues

```bash
# Rebuild CSS
npm run css:build

# Check for CSS syntax errors
npm run css:lint

# Analyze bundle size
npm run css:analyze
```

#### Database Issues

```sql
-- Check database connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats WHERE tablename = 'businesses';

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM businesses 
WHERE service_type = 'medical-spas' 
AND state = 'california' 
AND city = 'los-angeles';
```

#### Performance Issues

```bash
# Analyze bundle
npm run analyze

# Check Core Web Vitals
lighthouse https://getlocalranked.com --only-categories=performance

# Profile CSS
npm run css:analyze
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Rollback to previous deployment
vercel rollback

# Or deploy specific commit
vercel --prod --archive <commit-hash>
```

#### Database Recovery
```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_20231201_120000.sql

# Check data integrity
npm run verify:database
```

This deployment guide provides a comprehensive framework for deploying and maintaining the GetLocalRanked platform with optimal performance, monitoring, and reliability.