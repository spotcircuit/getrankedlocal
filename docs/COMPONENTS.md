# Component Documentation

## Overview

This document provides comprehensive documentation for the React components in the Lead Finder application, with special focus on the new grid search system components, enhanced AI intelligence components, and business-focused landing components.

## Component Architecture

The application follows atomic design principles with a clear component hierarchy:

### Grid Search System Components

#### GridSearchModal

**Purpose:** Real-time progress visualization for 169-point grid search execution with animated 13x13 grid display.

**Props:**
```typescript
interface GridSearchModalProps {
  isOpen: boolean;
  city: string;
  state: string; 
  niche: string;
  businessName?: string;
  searchMode: 'all' | 'targeted';
  onClose?: () => void;
}
```

**Key Features:**
- Real-time progress tracking with percentage completion
- 13x13 grid animation showing search progression
- Dual search mode support (All Businesses / Targeted Business)
- Status messages with execution updates
- Portal-based modal rendering
- Auto-close on completion

**Usage:**
```tsx
<GridSearchModal
  isOpen={searchInProgress}
  city="Austin"
  state="TX"
  niche="medical spa"
  businessName="Elite Med Spa"
  searchMode="targeted"
  onClose={handleSearchComplete}
/>
```

#### ResultsSectionV3

**Purpose:** Advanced grid search results display with interactive heat maps, Google Maps integration, and comprehensive business analytics.

**Props:**
```typescript
interface ResultsSectionV3Props {
  gridData: {
    success: boolean;
    location: { city: string; state: string };
    center: { lat: number; lng: number };
    gridSize: number;
    totalBusinesses: number;
    targetBusiness?: BusinessHeatMap;
    topCompetitors: BusinessHeatMap[];
    gridPoints: GridPoint[];
    searchDetails: {
      niche: string;
      totalPoints: number;
      timestamp: string;
    };
  };
  businessName?: string;
}
```

**Key Features:**
- Interactive Google Maps with grid overlay
- Color-coded heat map visualization (green/yellow/orange/red ranking zones)
- **Competitor Heat Map Switching:** Click any competitor to instantly view their heat map
- **Real-time Heat Map Updates:** Seamless switching between business perspectives
- Business details popup on grid cell click
- Toggle between heat map and standard list view
- Real-time grid cell interaction
- Comprehensive competitor analysis with clickable selection
- Geographic ranking intelligence
- **Overlay Competitor List:** Right-side competitor panel with coverage statistics

**Heat Map Color Coding:**
- **Green:** Rankings 1-3 (Dominant)
- **Yellow:** Rankings 4-10 (Competitive) 
- **Orange:** Rankings 11-20 (Moderate)
- **Red:** Rankings 21+ (Needs Improvement)

#### GridHeatMap

**Purpose:** Standalone interactive heat map component with grid-based ranking visualization.

**Props:**
```typescript
interface GridHeatMapProps {
  heatMapData: BusinessHeatMap;
  onCellClick?: (cell: GridCell) => void;
  showLegend?: boolean;
  interactive?: boolean;
}
```

**Key Features:**
- 13x13 grid rendering with SVG graphics
- Interactive cell selection and hover effects  
- Configurable color schemes for different ranking ranges
- Click handlers for detailed analysis
- Responsive design for mobile and desktop

#### GridSearchTrigger

**Purpose:** Grid search initiation component with configuration options and dual search mode support.

**Props:**
```typescript
interface GridSearchTriggerProps {
  onSearchInitiated: (config: GridSearchConfig) => void;
  defaultLocation?: { city: string; state: string };
  availableNiches: string[];
  loading?: boolean;
}
```

**Key Features:**
- Google Places autocomplete integration
- Dual search modes: "All Businesses" and "Target Business"
- Dynamic form validation
- Search configuration persistence
- Business name autocomplete for targeted searches

#### GridBusinessList

**Purpose:** Comprehensive business listing component for grid search results with filtering and sorting.

**Props:**
```typescript
interface GridBusinessListProps {
  businesses: GridBusinessResult[];
  sortBy: 'coverage' | 'avgRank' | 'reviews' | 'rating';
  filterBy?: string;
  onBusinessSelect?: (business: GridBusinessResult) => void;
  showCoverage?: boolean;
}
```

**Key Features:**
- Sortable columns (coverage, ranking, reviews, rating)
- Search/filter functionality
- Business details expansion
- Coverage percentage visualization
- Performance statistics display

### AI Intelligence Components

#### AIIntelligenceDynamic

**Purpose:** Enhanced AI response parsing with deduplication and smart formatting for competitive intelligence.

**Props:**
```typescript
interface AIIntelligenceDynamicProps {
  intelligence: string | object;
  businessName?: string;
  competitors?: CompetitorData[];
  loading?: boolean;
}
```

**Key Features:**
- Intelligent parsing of AI responses (JSON and text)
- Deduplication of repeated insights
- Dynamic content formatting based on response type
- Loading states with skeleton components
- Error handling for malformed AI responses
- Context-aware recommendations

**Enhancement over AIIntelligenceSection:**
- Better handling of complex AI response formats
- Improved parsing of JSON-embedded text responses
- Reduced redundancy in displayed insights
- Enhanced error recovery

#### CompetitorAnalysis

**Purpose:** Updated competitor analysis display with enhanced features and better data visualization.

**Props:**
```typescript
interface CompetitorAnalysisProps {
  competitors: EnhancedCompetitor[];
  targetBusiness?: BusinessData;
  marketIntelligence?: MarketIntelData;
  showAdvancedMetrics?: boolean;
}
```

**Key Features:**
- Enhanced competitor comparison tables
- Market position visualization
- Coverage area analysis
- Performance trend indicators
- Actionable insights based on competitive gaps

### Business-Focused Landing Components

#### StakeholderHero

**Purpose:** Business-owner focused personalized landing component with revenue impact calculations.

**Props:**
```typescript
interface StakeholderHeroProps {
  businessData: {
    name: string;
    ranking?: number;
    currentTraffic?: number;
    potentialRevenue?: number;
  };
  marketData?: MarketInsights;
  showPersonalization?: boolean;
}
```

**Key Features:**
- Personalized revenue loss calculations
- Dynamic business-specific messaging
- Competitor impact visualization  
- Urgency-driven call-to-action
- ROI projection display

#### QuickSolutionPreview

**Purpose:** Interactive solution preview with ROI calculations and 3-step improvement roadmap.

**Props:**
```typescript
interface QuickSolutionPreviewProps {
  businessType: string;
  currentPosition: number;
  marketSize: number;
  onViewFullSolution?: () => void;
}
```

**Key Features:**
- 90-day improvement roadmap
- ROI calculator integration
- Industry-specific solution paths
- Interactive timeline visualization
- Progress milestone tracking

#### ResultsSectionV2

**Purpose:** Standard results display with progressive disclosure and simplified views for business owners.

**Props:**
```typescript
interface ResultsSectionV2Props {
  analysisData: AnalysisResult;
  showSimplified?: boolean;
  onToggleDetails?: () => void;
  businessOwnerMode?: boolean;
}
```

**Key Features:**
- Progressive disclosure (Simple/Detailed views)
- Business-owner friendly language
- Actionable insights prioritization
- Visual impact indicators
- Conversion-focused CTAs

## Advanced Component Features

### Competitor Heat Map Switching in ResultsSectionV3

The ResultsSectionV3 component includes a sophisticated competitor heat map switching system that allows users to instantly compare different businesses across the same geographic grid.

**Implementation Details:**

```typescript
// State management for competitor selection
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

// Heat map rendering with competitor switching
const competitorRankings = selectedCompetitor ? getCompetitorRankings(selectedCompetitor) : null;

// Show heat map if it's a targeted search OR a competitor is selected
if (businessName || hasTargetRankings || selectedCompetitor) {
  gridData.gridPoints.forEach((point, index) => {
    // Use competitor rankings if a competitor is selected, otherwise use target rankings
    const rankToDisplay = competitorRankings ? competitorRankings.get(index) || 999 : point.targetRank;
    const color = getMarkerColor(rankToDisplay);
    
    // Create rectangles and markers with appropriate colors and labels
    // ...rendering logic
  });
}
```

**User Interaction Flow:**

1. **Initial State:** Heat map shows target business rankings (if in targeted mode)
2. **Competitor Selection:** User clicks any competitor in the right-side competitor panel
3. **State Update:** `selectedCompetitor` state updates with competitor name
4. **Heat Map Recalculation:** `getCompetitorRankings` function extracts competitor's rankings across all grid points
5. **Visual Update:** Heat map rectangles and labels update to show competitor's performance
6. **Reset Option:** User can click "Reset" button or same competitor to return to original view

**Visual Indicators:**

```typescript
// Competitor list item with selection state
<div
  className={`bg-gray-800/80 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:bg-gray-700/80 transition-colors ${
    selectedCompetitor === comp.name ? 'ring-2 ring-purple-500' : ''
  }`}
  onClick={() => setSelectedCompetitor(comp.name === selectedCompetitor ? null : comp.name)}
>
  {/* Competitor details */}
</div>

// Heat map overlay info showing current view
{selectedCompetitor && (
  <p className="text-xs text-yellow-400 mt-1">
    Viewing Competitor Heat Map
  </p>
)}
```

**Performance Considerations:**

- Rankings are pre-calculated and cached in the `gridData` structure
- No additional API calls required for competitor switching
- Efficient Map-based lookup for grid point rankings
- Smooth transitions with CSS animations

**Use Cases:**

1. **Direct Comparison:** Compare your business against specific top competitors
2. **Market Gap Analysis:** Identify areas where competitors are weak
3. **Geographic Strategy:** Plan expansion into areas with lower competitor presence
4. **Competitive Intelligence:** Understand competitor strengths across different locations

## Component Integration Patterns

### Grid Search Workflow

```tsx
// Complete grid search integration
const GridSearchWorkflow = () => {
  const [searchConfig, setSearchConfig] = useState<GridSearchConfig>();
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [gridResults, setGridResults] = useState<GridSearchResult>();

  return (
    <>
      <GridSearchTrigger
        onSearchInitiated={(config) => {
          setSearchConfig(config);
          setSearchInProgress(true);
        }}
      />
      
      <GridSearchModal
        isOpen={searchInProgress}
        {...searchConfig}
        onClose={() => setSearchInProgress(false)}
      />
      
      {gridResults && (
        <ResultsSectionV3
          gridData={gridResults}
          businessName={searchConfig?.businessName}
        />
      )}
    </>
  );
};
```

### AI Intelligence Integration

```tsx
// Enhanced AI intelligence display
const EnhancedAnalysis = ({ businessData, competitors }) => {
  const [aiInsights, setAiInsights] = useState(null);

  return (
    <div>
      <CompetitorAnalysis
        competitors={competitors}
        targetBusiness={businessData}
        showAdvancedMetrics={true}
      />
      
      <AIIntelligenceDynamic
        intelligence={aiInsights}
        businessName={businessData.name}
        competitors={competitors}
      />
    </div>
  );
};
```

## Performance Considerations

### Grid Search Components
- **GridSearchModal:** Uses lightweight SVG animations for 13x13 grid visualization
- **ResultsSectionV3:** Implements Google Maps lazy loading and marker clustering
- **GridHeatMap:** Optimized SVG rendering with viewport-based rendering

### AI Components  
- **AIIntelligenceDynamic:** Implements response caching and parsing optimization
- **CompetitorAnalysis:** Uses virtualized lists for large competitor datasets

### Business Components
- **StakeholderHero:** Lazy loads revenue calculations and market data
- **QuickSolutionPreview:** Progressive loading of solution content

## Accessibility Features

All components implement:
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences
- Touch-friendly mobile interfaces

## Testing Strategy

### Component Testing
- Unit tests for all prop variations
- Integration tests for component workflows
- Visual regression tests for UI consistency
- Accessibility testing with axe-core

### Grid Search Testing
- Mock API responses for development
- Performance testing with large datasets
- Cross-browser compatibility testing
- Mobile responsiveness verification

## Future Enhancements

### Planned Component Updates
1. **GridSearchModal:** Add pause/resume functionality for long searches
2. **ResultsSectionV3:** Implement real-time collaboration features
3. **AIIntelligenceDynamic:** Add natural language query processing
4. **StakeholderHero:** Include predictive revenue modeling

### Performance Optimizations
1. Component lazy loading for faster initial page loads
2. Virtual scrolling for large business lists
3. WebGL-based heat map rendering for complex grids
4. Service worker caching for offline functionality