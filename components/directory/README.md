# Directory Components

A collection of reusable, mobile-optimized React components for building directory pages. All components are designed to work with the mobile CSS architecture in `/app/directory-mobile.css`.

## Components Overview

### 1. BusinessCard
A mobile-optimized business card component that displays business information with touch-friendly controls.

**Features:**
- Touch-friendly design with 44px minimum touch targets
- Star ratings with visual indicators
- Top-rated badges for high-performing businesses
- Call and website buttons with proper accessibility
- Responsive layout that works on all screen sizes

```tsx
import { BusinessCard } from '@/components/directory';

<BusinessCard 
  business={business}
  rank={1}
  showRank={true}
  className="custom-class"
/>
```

### 2. DirectoryGrid
A responsive grid component with virtual scrolling for handling large datasets efficiently.

**Features:**
- Virtual scrolling for performance with 6,511+ items
- Intersection Observer for lazy loading
- Responsive breakpoints (1 col mobile, 2 tablet, 3-4 desktop)
- Smooth scroll performance with throttling
- Development performance indicators

```tsx
import { DirectoryGrid } from '@/components/directory';

<DirectoryGrid
  businesses={businesses}
  loading={loading}
  onLoadMore={handleLoadMore}
  hasMore={hasMore}
  showRanks={true}
/>
```

### 3. FilterPanel
A collapsible filter panel optimized for mobile with desktop always-open behavior.

**Features:**
- Collapsible on mobile, always open on desktop
- Sort options (rating, reviews, alphabetical)
- Rating filter ranges
- Top-rated only toggle
- Active filter indicators
- Reset functionality

```tsx
import { FilterPanel } from '@/components/directory';

<FilterPanel
  filters={filters}
  onFiltersChange={setFilters}
  businessCount={totalCount}
  filteredCount={filteredCount}
/>
```

### 4. SearchBar
A debounced search component with suggestions and mobile optimization.

**Features:**
- Debounced input (300ms default)
- Search suggestions dropdown
- Recent searches tracking
- 16px font size to prevent iOS zoom
- Clear button
- Keyboard navigation support

```tsx
import { SearchBar } from '@/components/directory';

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  suggestions={searchSuggestions}
  recentSearches={recentSearches}
  onSuggestionClick={handleSuggestionClick}
  placeholder="Search businesses..."
/>
```

### 5. SkeletonLoader
A collection of skeleton loading components with smooth animations.

**Available Skeletons:**
- `BusinessCardSkeleton` - Individual card placeholder
- `GridSkeleton` - Grid of card placeholders
- `SearchResultsSkeleton` - List view placeholders
- `FilterPanelSkeleton` - Filter panel placeholder
- `LoadingSpinner` - Simple spinner
- `PageSkeleton` - Full page skeleton

```tsx
import { GridSkeleton, LoadingSpinner } from '@/components/directory';

// While loading
{loading ? <GridSkeleton count={6} /> : <DirectoryGrid businesses={businesses} />}

// Loading more
{loadingMore && <LoadingSpinner />}
```

## Usage Examples

### Complete Directory Page Implementation

```tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  BusinessCard, 
  DirectoryGrid, 
  FilterPanel, 
  SearchBar,
  GridSkeleton,
  type FilterOptions,
  type Business 
} from '@/components/directory';

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'rating',
    minRating: 0,
    showTopRated: false
  });

  // Filter and sort businesses
  const filteredBusinesses = businesses
    .filter(business => 
      searchQuery === '' || 
      business.business_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(business => !filters.minRating || (business.rating || 0) >= filters.minRating)
    .filter(business => !filters.showTopRated || (business.rating || 0) >= 4.5)
    .sort((a, b) => {
      if (filters.sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (filters.sortBy === 'reviews') {
        return (b.review_count || 0) - (a.review_count || 0);
      }
      return a.business_name.localeCompare(b.business_name);
    });

  return (
    <div className="directory-container">
      {/* Header with Search */}
      <div className="directory-header">
        <h1>Business Directory</h1>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search businesses..."
        />
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        businessCount={businesses.length}
        filteredCount={filteredBusinesses.length}
      />

      {/* Business Grid */}
      {loading ? (
        <GridSkeleton count={9} />
      ) : (
        <DirectoryGrid
          businesses={filteredBusinesses}
          showRanks={true}
        />
      )}
    </div>
  );
}
```

### Mobile-First Approach

All components are designed mobile-first and use the CSS classes from `/app/directory-mobile.css`:

- Touch targets are minimum 44px for accessibility
- Text is 16px or larger to prevent zoom on iOS
- Responsive breakpoints follow the design system
- Smooth animations with reduced motion support
- High contrast mode support

### Performance Considerations

1. **Virtual Scrolling**: DirectoryGrid uses virtual scrolling to handle large datasets
2. **Debounced Search**: SearchBar debounces input to reduce API calls  
3. **Memo**: All components use React.memo for performance
4. **Lazy Loading**: Intersection Observer for progressive loading
5. **CSS Classes**: Uses existing CSS classes to minimize bundle size

### Accessibility Features

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- High contrast mode support
- Screen reader friendly
- Touch-friendly controls

## CSS Dependencies

These components depend on the CSS classes defined in `/app/directory-mobile.css`:

- `.business-card` - Business card styling
- `.directory-grid` - Grid layout
- `.filter-panel` - Filter panel styling
- `.directory-search` - Search input styling
- `.skeleton-*` - Loading skeleton styles

Make sure to include the CSS file in your page or layout.

## TypeScript Support

All components are fully typed with TypeScript interfaces exported for reuse:

```tsx
import type { 
  Business,
  BusinessCardProps,
  DirectoryGridProps,
  FilterOptions,
  SearchBarProps
} from '@/components/directory';
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)
- Responsive design works on all screen sizes