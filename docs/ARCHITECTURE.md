# System Architecture Documentation

## Overview

Lead Finder is a Next.js-based competitive analysis and lead generation platform that helps businesses understand their market position and capture potential clients. The system combines AI-powered data extraction, real-time competitive analysis, and a modern sales funnel.

## Technology Stack

### Frontend
- **Framework:** Next.js 15.5.2 with App Router
- **UI Library:** React 19.1.1 with TypeScript
- **Styling:** Tailwind CSS 3.4.0
- **Animations:** Framer Motion 11.0.0
- **Icons:** Lucide React 0.468.0
- **Charts:** Recharts 2.12.0

### Backend
- **API Routes:** Next.js Server Components and API Routes
- **Database:** Neon PostgreSQL (Serverless)
- **ORM/Query Builder:** @neondatabase/serverless with SQL template literals
- **Image Processing:** Sharp 0.34.3

### Development & Deployment
- **Language:** TypeScript 5.4.0
- **Package Manager:** npm
- **Linting:** ESLint with Next.js configuration
- **Build Tool:** Next.js built-in bundler

## Project Structure

```
getlocalranked/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API endpoints
│   │   ├── analyze/             # Business analysis endpoint
│   │   ├── directory/           # New directory endpoints
│   │   │   ├── collections/     # Collection listing
│   │   │   └── [collection]/[state]/[city]/ # Directory browsing
│   │   └── leads/               # Lead capture and management
│   ├── [state]/[city]/[niche]/[company]/ # Dynamic business pages
│   ├── med-spa-directory/       # Directory landing page
│   └── page.tsx                 # Homepage
├── components/                   # Reusable React components
│   ├── ActionPlan.tsx           # Action plan UI
│   ├── AIIntelligenceSection.tsx # AI insights display
│   ├── AnalysisModal.tsx        # Competitive analysis modal
│   ├── BookingModal.tsx         # Lead capture modal
│   └── ...                      # Additional UI components
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database connection
│   ├── competitor-db.ts         # Competitor data management
│   └── revenueCalculations.ts   # Business metrics calculations
├── scripts/                     # Database and maintenance scripts
│   ├── migrate-lead-collections.js # Lead collections migration
│   ├── analyze-data-migration.js   # Migration analysis
│   └── ...                      # Additional utility scripts
├── docs/                        # Documentation (NEW)
│   ├── API.md                   # API documentation
│   ├── DATABASE.md              # Database schema
│   └── ARCHITECTURE.md          # This file
└── types/                       # TypeScript type definitions
```

## Data Flow Architecture

### 1. Lead Generation & Collection

```
Google Places API → AI Extraction → Database Storage → Lead Collections
                                         ↓
                              Many-to-Many Relationships
                                         ↓
                              Directory Organization
```

**Process:**
1. **Data Collection:** Scripts scrape Google Places API for business data
2. **AI Enhancement:** Extract owner names, contact info, and business insights
3. **Database Storage:** Store in `leads` table with comprehensive business data
4. **Collection Organization:** Populate `lead_collections` for many-to-many relationships
5. **Directory Generation:** Create browseable business directories by location/niche

### 2. Competitive Analysis Pipeline

```
Business Search → Data Retrieval → AI Analysis → Report Generation → UI Display
```

**Components:**
- **Search Input:** Business name, location, or direct ID lookup
- **Data Retrieval:** Query `leads` and `lead_collections` for comprehensive data
- **Competitive Ranking:** Calculate position within local market
- **AI Insights:** Generate strategic recommendations and market intelligence
- **Report Output:** Interactive dashboard with actionable insights

### 3. Lead Capture System

```
Landing Page → Analysis Demo → Lead Capture Modal → Database Storage → Follow-up
```

**Features:**
- **Dynamic Landing Pages:** SEO-optimized pages for each business/location
- **Interactive Analysis:** Real competitive insights to demonstrate value
- **Multi-step Capture:** Progressive information collection for higher conversion
- **CRM Integration:** Store leads in `leads_captured` for follow-up

## Database Architecture

### Core Relationships

```
leads (1:many) lead_collections
  ├── Enables multi-collection membership
  ├── Supports directory browsing
  └── Maintains search metadata

competitor_searches (1:many) leads
  ├── Links search campaigns to results
  ├── Stores AI intelligence
  └── Tracks performance metrics

leads_captured (standalone)
  └── Sales funnel lead storage
```

### Recent Major Changes

1. **Lead Collections System (NEW)**
   - Many-to-many relationship table `lead_collections`
   - 6,511 leads successfully migrated and normalized
   - Enables businesses to appear in multiple relevant directories

2. **AI Data Enhancement**
   - Owner name extraction with improved parsing
   - Social media handle collection
   - JSONB storage for raw AI insights

3. **Directory Endpoints (NEW)**
   - `/api/directory/collections` - List all available collections
   - `/api/directory/[collection]/[state]/[city]` - Browse specific directories
   - Optimized queries with aggregated statistics

## API Architecture

### RESTful Endpoint Design

```
GET  /api/analyze              # Competitive analysis
GET  /api/directory/collections # Collection listing
GET  /api/directory/{collection}/{state}/{city} # Directory browsing
POST /api/leads                # Lead capture
GET  /api/leads                # Lead retrieval
```

### Response Patterns

All API endpoints follow consistent response structure:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

## Component Architecture

### Design System

**Atomic Design Principles:**
- **Atoms:** Basic UI elements (buttons, inputs, icons)
- **Molecules:** Component combinations (forms, cards, modals)
- **Organisms:** Complex UI sections (analysis dashboard, directory listings)
- **Templates:** Page layouts and structure
- **Pages:** Complete user interfaces with data integration

### Key Components

1. **AnalysisModal:** Comprehensive competitive analysis interface
2. **DirectoryBrowser:** Business directory navigation
3. **AIIntelligenceSection:** AI-generated insights and recommendations
4. **BookingModal:** Lead capture with progressive disclosure
5. **BusinessInsights:** Market intelligence dashboard

## Performance Optimizations

### Database Optimizations
- **Indexed Queries:** Strategic indexes on frequently queried columns
- **Connection Pooling:** Neon serverless automatic scaling
- **Query Optimization:** Efficient JOINs and aggregations
- **Batch Processing:** Migration scripts use transaction batching

### Frontend Optimizations
- **Next.js App Router:** Server-side rendering and static generation
- **Component Lazy Loading:** Dynamic imports for large components
- **Image Optimization:** Sharp for automatic image processing
- **Caching Strategy:** Built-in Next.js caching for API routes

### Scalability Features
- **Serverless Database:** Auto-scaling Neon PostgreSQL
- **CDN Delivery:** Next.js automatic asset optimization
- **API Rate Limiting:** Built-in protection against abuse
- **Error Boundaries:** Graceful error handling throughout UI

## Security Architecture

### Data Protection
- **SQL Injection Prevention:** Parameterized queries via SQL template literals
- **Input Validation:** TypeScript interfaces and runtime validation
- **Environment Variables:** Secure credential storage
- **CORS Configuration:** Appropriate cross-origin request handling

### Privacy Compliance
- **Data Minimization:** Only collect necessary business information
- **Consent Mechanisms:** Clear opt-in for lead capture
- **Data Retention:** Automated cleanup of old search data
- **Access Controls:** Role-based access to sensitive endpoints

## Deployment Architecture

### Development Environment
```bash
npm run dev    # Development server on port 3001
npm run build  # Production build
npm run start  # Production server
```

### Production Considerations
- **Environment Variables:** `DATABASE_URL` and other configurations
- **Build Process:** Static asset generation and optimization
- **Database Migrations:** Safe, reversible schema changes
- **Monitoring:** Application logs and performance metrics

## Future Architecture Considerations

### Planned Enhancements
1. **Microservices Migration:** Break out AI processing into separate services
2. **Caching Layer:** Redis for frequently accessed data
3. **Queue System:** Background processing for large data operations
4. **Analytics Integration:** Comprehensive user behavior tracking
5. **API Gateway:** Rate limiting, authentication, and request routing

### Scalability Roadmap
1. **Horizontal Scaling:** Multi-region deployment capability
2. **Data Partitioning:** Shard large datasets by geography
3. **CDN Integration:** Global asset distribution
4. **Real-time Updates:** WebSocket integration for live data
5. **Machine Learning:** Enhanced AI insights and predictions