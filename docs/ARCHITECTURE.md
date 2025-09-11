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
│   │   ├── directory/           # Directory endpoints
│   │   │   ├── collections/     # Collection listing
│   │   │   └── [collection]/[state]/[city]/ # Directory browsing
│   │   ├── grid-search/         # Grid search analysis endpoints
│   │   ├── grid-search-temp/    # Temporary grid search endpoint
│   │   ├── grid-search-test-data/ # Test data for grid search development
│   │   └── leads/               # Lead capture and management
│   ├── grid-test/               # Grid search interface page
│   ├── [state]/[city]/[niche]/[company]/ # Dynamic business pages
│   ├── med-spa-directory/       # Directory landing page
│   └── page.tsx                 # Homepage
├── components/                   # Reusable React components
│   ├── ActionPlan.tsx           # Action plan UI
│   ├── AIIntelligenceSection.tsx # AI insights display  
│   ├── AIIntelligenceDynamic.tsx # Enhanced AI response parsing
│   ├── AnalysisModal.tsx        # Competitive analysis modal
│   ├── BookingModal.tsx         # Lead capture modal
│   ├── CompetitorAnalysis.tsx   # Updated competitor analysis display
│   ├── GridBusinessList.tsx     # Grid search business listing component
│   ├── GridHeatMap.tsx          # Interactive grid search heat map visualization
│   ├── GridSearchModal.tsx      # Real-time grid search progress modal with 13x13 animation
│   ├── GridSearchTrigger.tsx    # Grid search initiation and configuration component
│   ├── QuickSolutionPreview.tsx # Business solution preview component  
│   ├── ResultsSectionV2.tsx     # Standard results display with progressive disclosure
│   ├── ResultsSectionV3.tsx     # Advanced grid search results with interactive heat maps
│   ├── StakeholderHero.tsx      # Business-owner focused landing component
│   └── ...                      # Additional UI components
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database connection
│   ├── competitor-db.ts         # Competitor data management
│   ├── grid-search-storage.ts   # Grid search data storage utilities
│   ├── grid-search-storage-optimized.ts # Bulk insert optimization for grid data
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

### 1. Grid Search Analysis System

```
Grid Initialization → 169-Point Search → Data Extraction → Database Storage → Heat Map Visualization
                                            ↓
                                    Place ID Resolution
                                            ↓
                                    Bulk Insert Operations
                                            ↓
                                Geographic Analysis & Statistics
```

**Process:**
1. **Grid Setup:** Create 13x13 coordinate grid covering 5-mile radius around target location
2. **Parallel Search:** Execute 169 simultaneous Google Maps queries with comprehensive data extraction
3. **Place ID Resolution:** Use place_id as unique business identifier to eliminate duplicates
4. **Data Processing:** Extract business details (name, rating, reviews, address, coordinates, phone, business_type)
5. **Bulk Storage:** Optimized database operations using batch inserts across 5 specialized tables
6. **Statistical Analysis:** Calculate coverage, ranking distributions, and geographic intelligence
7. **Heat Map Generation:** Create interactive visualization with color-coded ranking performance

**Database Tables:**
- `grid_searches`: Master search records with execution metadata
- `grid_competitors`: Unique businesses with comprehensive profile data
- `grid_point_results`: Individual ranking results for each grid coordinate
- `competitor_summaries`: Aggregated performance statistics and coverage metrics
- `grid_cells`: Grid cell metadata with competition density analysis

### 2. Lead Generation & Collection

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

grid_searches (1:many) grid_competitors
  ├── Master search to unique businesses
  ├── Stores search execution metadata
  └── Tracks performance statistics

grid_competitors (1:many) grid_point_results
  ├── Business to ranking appearances
  ├── Enables coverage analysis
  └── Supports geographic intelligence

leads_captured (standalone)
  └── Sales funnel lead storage
```

### Recent Major Changes

1. **Grid Search Analysis System (NEW)**
   - Comprehensive 169-point geographic analysis covering 5-mile radius
   - 5 new database tables with optimized bulk insert operations
   - Advanced heat map visualization with interactive Google Maps integration
   - Fixed duplicate business issue through place_id unique identification
   - Real-time progress tracking and completion visualization
   - Dual search modes: "All Businesses" and "Target Business" analysis

2. **Lead Collections System**
   - Many-to-many relationship table `lead_collections`
   - 6,511 leads successfully migrated and normalized
   - Enables businesses to appear in multiple relevant directories

3. **AI Data Enhancement**
   - Owner name extraction with improved parsing
   - Social media handle collection
   - JSONB storage for raw AI insights

4. **Directory Endpoints**
   - `/api/directory/collections` - List all available collections
   - `/api/directory/[collection]/[state]/[city]` - Browse specific directories
   - Optimized queries with aggregated statistics

## API Architecture

### RESTful Endpoint Design

```
GET  /api/analyze              # Competitive analysis
POST /api/grid-search          # Execute 169-point grid search analysis
POST /api/grid-search-temp     # Temporary grid search endpoint for development
GET  /api/grid-search-test-data # Test data for grid search development
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

#### Core Analysis & Display Components
1. **AnalysisModal:** Comprehensive competitive analysis interface
2. **DirectoryBrowser:** Business directory navigation  
3. **AIIntelligenceSection:** AI-generated insights and recommendations
4. **AIIntelligenceDynamic:** Enhanced AI response parsing with deduplication
5. **BookingModal:** Lead capture with progressive disclosure
6. **BusinessInsights:** Market intelligence dashboard
7. **CompetitorAnalysis:** Updated competitor analysis display with enhanced features

#### Grid Search System Components  
8. **GridSearchModal:** Real-time 169-point grid search progress visualization with 13x13 grid animation
9. **ResultsSectionV3:** Advanced grid search results with interactive heat maps and Google Maps integration
10. **GridHeatMap:** Color-coded geographic ranking visualization with interactive overlays
11. **GridSearchTrigger:** Grid search initiation and configuration interface with dual search modes
12. **GridBusinessList:** Comprehensive business listing component for grid search results

#### Business-Focused Landing Components
13. **StakeholderHero:** Business-owner focused personalized landing component
14. **QuickSolutionPreview:** Interactive solution preview with ROI calculations
15. **ResultsSectionV2:** Standard results display with progressive disclosure and simplified views

## Performance Optimizations

### Database Optimizations
- **Indexed Queries:** Strategic indexes on frequently queried columns
- **Connection Pooling:** Neon serverless automatic scaling
- **Query Optimization:** Efficient JOINs and aggregations
- **Batch Processing:** Migration scripts use transaction batching
- **Bulk Insert Operations:** Grid search data uses optimized bulk inserts in batches of 1000 records
- **Place ID Deduplication:** Prevents duplicate business records through unique place_id constraints
- **Geographic Indexing:** Spatial indexes on lat/lng columns for efficient geographic queries

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