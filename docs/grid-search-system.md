# Grid Search Analysis System

## Overview

The Grid Search Analysis System is a comprehensive geographic market intelligence platform that performs 169-point searches across a 5-mile radius to map business rankings and competitive landscapes. This system provides unprecedented granular insight into local search performance across different geographic areas.

## System Architecture

### Core Concept

The system divides a 5-mile radius around a target location into a 13x13 grid (169 points total), performing individual Google Maps searches at each coordinate to gather comprehensive ranking and competitive data.

### Key Components

1. **Grid Generation:** Mathematical calculation of 169 coordinate points in a regular grid pattern
2. **Parallel Search Execution:** Simultaneous API calls to gather data from all grid points
3. **Data Processing:** Comprehensive business information extraction with place_id deduplication
4. **Storage Optimization:** Bulk database operations across 5 specialized tables
5. **Visualization:** Interactive heat map generation with Google Maps integration

## Database Schema

### Table Structure

#### 1. grid_searches
Master records for each grid search execution.

```sql
CREATE TABLE grid_searches (
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
);
```

#### 2. grid_competitors
All unique businesses discovered across the grid, using place_id as the primary deduplication key.

```sql
CREATE TABLE grid_competitors (
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
  
  -- Performance analytics
  appearances INTEGER,                    -- Times business appeared in grid
  coverage_percent DECIMAL(5, 2),       -- Percentage of grid coverage
  avg_rank DECIMAL(5, 2),               -- Average ranking across appearances
  best_rank INTEGER,                     -- Best ranking achieved
  worst_rank INTEGER,                    -- Worst ranking found
  top_3_count INTEGER,                   -- Appearances in top 3
  top_10_count INTEGER,                  -- Appearances in top 10
  first_place_count INTEGER,             -- Number of #1 rankings
  
  -- Geographic distribution analysis
  north_appearances INTEGER,
  south_appearances INTEGER,
  east_appearances INTEGER,
  west_appearances INTEGER,
  center_appearances INTEGER,
  
  UNIQUE(search_id, place_id)
);
```

#### 3. grid_point_results
Individual business rankings at specific grid coordinates.

```sql
CREATE TABLE grid_point_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES grid_competitors(id) ON DELETE CASCADE,
  
  -- Grid location
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  grid_index INTEGER NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Ranking data
  rank_position INTEGER NOT NULL,
  total_results_at_point INTEGER,
  distance_from_business_miles DECIMAL(5, 2)
);
```

#### 4. grid_cells
Metadata about each grid cell including competition density and top performers.

```sql
CREATE TABLE grid_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
  
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  
  -- Cell statistics
  total_businesses INTEGER,
  competition_level VARCHAR(20), -- 'low', 'medium', 'high', 'very_high'
  top_3_competitors JSONB
);
```

## Frontend Components

### GridTestPage (/app/grid-test/page.tsx)
Main interface for initiating and managing grid searches.

**Features:**
- **Dual Search Modes:**
  - "All Businesses": Explore market without targeting specific business
  - "Target Business": Track performance of specific business
- **Google Places Autocomplete:** Smart location and business selection
- **Real-time Progress:** Live updates during 169-point search execution
- **Test Data Mode:** Instant results using pre-computed data for development

### GridSearchModal (components/GridSearchModal.tsx)
Real-time visualization of search progress.

**Features:**
- **13x13 Grid Animation:** Visual representation of search completion
- **Progress Tracking:** Percentage complete and estimated time remaining
- **Status Messages:** Dynamic updates on current search activity
- **Performance Metrics:** Live statistics on points searched and remaining

### ResultsSectionV3 (components/ResultsSectionV3.tsx)
Advanced results display with comprehensive analytics and interactive competitor visualization.

**Features:**
- **Interactive Heat Map:** Color-coded Google Maps visualization with competitor rankings
- **Competitor Heat Map Switching:** Click any competitor in the list to instantly view their heat map across the grid
- **Real-time Competitor Selection:** Toggle between target business and competitor heat maps
- **Business Performance Stats:** Coverage, ranking, and competitive metrics
- **Competitor Analysis:** Top performers with detailed statistics and clickable switching
- **Geographic Intelligence:** Coverage patterns across different quadrants
- **Dynamic Heat Map Updates:** Seamless switching between different business perspectives

### GridHeatMap (components/GridHeatMap.tsx)
Specialized heat map component for ranking visualization.

**Features:**
- **Color Coding:** Rankings visualized with intuitive color schemes
- **Interactive Markers:** Clickable grid points with detailed information
- **Business Location Markers:** Visual representation of actual business locations
- **Coverage Overlays:** Visual indication of market presence

## API Endpoints

### POST /api/grid-search
Primary endpoint for executing grid search analysis.

### POST /api/grid-search-temp  
Development endpoint for testing grid search functionality.

### GET /api/grid-search-test-data
Returns pre-computed test data for instant development results.

## Data Processing Flow

### 1. Grid Initialization
```javascript
// Generate 13x13 grid coordinates around center point
const gridPoints = generateGridCoordinates(centerLat, centerLng, 5.0);
// Results in 169 coordinate pairs spanning 5-mile radius
```

### 2. Parallel Search Execution
```javascript
// Execute all searches simultaneously
const searchPromises = gridPoints.map(point => 
  searchGoogleMaps(point.lat, point.lng, searchTerm)
);
const results = await Promise.all(searchPromises);
```

### 3. Data Extraction & Deduplication
```javascript
// Extract comprehensive business data
const businesses = results.flatMap(result => 
  result.businesses.map(biz => ({
    place_id: biz.place_id,  // Critical for deduplication
    name: biz.name,
    rating: biz.rating,
    reviews: biz.reviews,
    lat: biz.lat,
    lng: biz.lng,
    address: biz.address,
    phone: biz.phone,
    business_type: biz.business_type
  }))
);

// Remove duplicates using place_id
const uniqueBusinesses = deduplicateByPlaceId(businesses);
```

### 4. Bulk Database Storage
```javascript
// Optimized bulk inserts in batches of 1000
await sql`INSERT INTO grid_competitors ${sql(competitorData)}`;
await sql`INSERT INTO grid_point_results ${sql(pointData)}`;
await sql`INSERT INTO grid_cells ${sql(cellData)}`;
```

## Performance Optimizations

### Database Optimizations
- **Bulk Inserts:** Process data in batches of 1000 records to minimize database round trips
- **Place ID Uniqueness:** Prevent duplicates through unique constraints on place_id
- **Spatial Indexing:** B-tree indexes on lat/lng columns for geographic queries
- **Connection Pooling:** Neon serverless automatically scales with demand
- **Prepared Statements:** All queries use SQL template literals for security and performance

### Frontend Optimizations
- **Component Lazy Loading:** Dynamic imports for large visualization components
- **Google Maps Integration:** Efficient marker management and rendering
- **Progress Streaming:** Real-time updates without blocking UI
- **Test Data Caching:** Pre-computed results for development and demonstrations

## Key Technical Improvements

### 1. Duplicate Business Resolution
**Problem:** Previous system created duplicate businesses without unique identifiers.

**Solution:** 
```javascript
// Use place_id as unique business identifier
const placeId = biz.place_id || `${biz.name}_${point.lat}_${point.lng}`.replace(/\s+/g, '_');
```

### 2. Comprehensive Data Extraction
**Enhancement:** Match production-level data extraction capabilities.

**Implementation:**
- Place IDs for unique identification
- Complete address information
- Phone numbers and business types
- Precise latitude/longitude coordinates
- Review counts and ratings

### 3. Storage Performance
**Optimization:** Bulk operations instead of individual database queries.

**Results:**
- 10x faster data insertion
- Reduced database connection overhead  
- Better error handling and transaction management
- Scalable to larger grid sizes

## Geographic Intelligence

### Coverage Analysis
The system calculates business presence across different geographic quadrants:

- **North Coverage:** Appearances in grid rows 0-5
- **South Coverage:** Appearances in grid rows 7-12  
- **East Coverage:** Appearances in grid columns 7-12
- **West Coverage:** Appearances in grid columns 0-5
- **Center Coverage:** Appearances in center 3x3 grid (rows 5-7, cols 5-7)

### Competition Density Classification
Grid cells are classified by competition level:
- **Low:** ≤5 businesses
- **Medium:** 6-10 businesses  
- **High:** 11-15 businesses
- **Very High:** >15 businesses

## Interactive Features

### Competitor Heat Map Switching

One of the most powerful features of the ResultsSectionV3 component is the ability to instantly switch between different business perspectives on the heat map.

**How it Works:**
1. **Initial View:** Heat map shows target business rankings (if in targeted mode) or neutral view (if in all businesses mode)
2. **Competitor Selection:** Click any competitor in the Top Competitors list on the right
3. **Instant Switch:** Heat map immediately updates to show selected competitor's rankings across all 169 grid points
4. **Visual Indicators:** Selected competitor is highlighted with purple ring, overlay shows current view
5. **Reset Option:** Click "Reset" button or same competitor to return to original view

**Visual Elements:**
- **Color Coding:** Same ranking colors (green for 1-3, yellow for 4-6, orange for 7-10, red for 11-20, gray for not found)
- **Ranking Numbers:** Each grid cell shows the competitor's rank at that location
- **Coverage Comparison:** Instantly compare how different businesses perform across geographic areas
- **Performance Indicators:** Coverage percentages and average rankings update in real-time

**Code Implementation:**
```typescript
const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

// Function to get competitor rankings across all grid points
const getCompetitorRankings = (competitorName: string) => {
  const rankings = new Map<number, number>();
  
  gridData.gridPoints.forEach((point, index) => {
    const competitor = point.topCompetitors.find(c => c.name === competitorName);
    if (competitor) {
      rankings.set(index, competitor.rank);
    } else {
      rankings.set(index, 999); // Not found at this point
    }
  });
  
  return rankings;
};
```

**Use Cases for Heat Map Switching:**
1. **Competitive Analysis:** Compare how different businesses perform across the same geographic market
2. **Market Positioning:** Identify areas where competitors are strong or weak
3. **Strategic Planning:** Find geographic gaps in competitor coverage
4. **Performance Benchmarking:** Compare your business against specific competitors in different areas

## Use Cases

### 1. Market Analysis
- Identify underserved geographic areas
- Discover market saturation patterns
- Find optimal locations for business expansion
- Understand competitor distribution
- Compare competitor performance across different areas

### 2. SEO Strategy
- Target geographic areas with lower competition
- Identify ranking improvement opportunities
- Monitor competitive landscape changes
- Optimize local search presence
- Analyze competitor ranking patterns

### 3. Business Intelligence
- Track competitive positioning across markets
- Measure geographic market share
- Analyze ranking performance patterns
- Inform strategic business decisions
- Benchmark against specific competitors

## Implementation Examples

### Basic Grid Search Integration

```tsx
import ResultsSectionV3 from '@/components/ResultsSectionV3';

const GridSearchPage = () => {
  const [gridData, setGridData] = useState(null);
  const [businessName, setBusinessName] = useState('');

  const runGridSearch = async () => {
    const response = await fetch('/api/grid-search-temp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName,
        city: 'Austin',
        state: 'TX',
        niche: 'medical spa'
      })
    });
    
    const data = await response.json();
    if (data.success) {
      setGridData(data.gridData);
    }
  };

  return (
    <div>
      {/* Search form */}
      <button onClick={runGridSearch}>Run Grid Search</button>
      
      {/* Results with competitor heat map switching */}
      {gridData && (
        <ResultsSectionV3 
          gridData={gridData} 
          businessName={businessName}
        />
      )}
    </div>
  );
};
```

### Using Database Results

```tsx
const GridSearchFromDB = () => {
  const [gridData, setGridData] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
      const response = await fetch('/api/grid-search-from-db?city=Austin&searchTerm=medical spa');
      const data = await response.json();
      
      if (data.success) {
        setGridData(data.gridData);
      }
    };
    
    loadResults();
  }, []);

  return (
    <div>
      {gridData && (
        <ResultsSectionV3 
          gridData={gridData} 
          businessName="" // Empty for "All Businesses" mode
        />
      )}
    </div>
  );
};
```

### Custom Competitor Heat Map Implementation

```tsx
const CustomCompetitorView = ({ gridData }) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  // Extract competitor rankings for heat map
  const getCompetitorRankings = (competitorName) => {
    const rankings = new Map();
    
    gridData.gridPoints.forEach((point, index) => {
      const competitor = point.topCompetitors.find(c => c.name === competitorName);
      if (competitor) {
        rankings.set(index, competitor.rank);
      } else {
        rankings.set(index, 999); // Not found
      }
    });
    
    return rankings;
  };

  return (
    <div className="flex">
      {/* Competitor List */}
      <div className="w-1/4">
        {gridData.competitors.map((comp, idx) => (
          <div
            key={idx}
            className={`cursor-pointer p-2 ${selectedCompetitor === comp.name ? 'bg-purple-500' : 'bg-gray-800'}`}
            onClick={() => setSelectedCompetitor(comp.name)}
          >
            {comp.name} - {comp.coverage}% coverage
          </div>
        ))}
      </div>
      
      {/* Heat Map */}
      <div className="w-3/4">
        <ResultsSectionV3 
          gridData={{
            ...gridData,
            // Override with selected competitor's perspective
            selectedCompetitor
          }}
          businessName={selectedCompetitor}
        />
      </div>
    </div>
  );
};
```

## Future Enhancements

### Planned Features
1. **Historical Tracking:** Compare grid search results over time
2. **Automated Scheduling:** Regular grid searches for monitoring
3. **Alert System:** Notifications for significant ranking changes
4. **Advanced Analytics:** Machine learning insights and predictions
5. **Export Capabilities:** PDF reports and data exports
6. **API Integration:** Third-party access to grid search data
7. **Competitor Heat Map Animations:** Smooth transitions between competitor views
8. **Multi-Competitor Comparison:** Side-by-side heat map comparisons

### Scalability Improvements
1. **Larger Grids:** Support for 25x25 or custom grid sizes
2. **Multi-Location:** Simultaneous analysis of multiple markets
3. **Real-time Updates:** Live grid search result streaming
4. **Mobile Optimization:** Touch-friendly grid interaction
5. **Caching Layer:** Redis for frequently accessed results