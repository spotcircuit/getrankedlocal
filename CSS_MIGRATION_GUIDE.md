# CSS Architecture Migration Guide

## Overview
This guide provides instructions for migrating from inline styles to the new modular CSS architecture.

## New CSS Architecture

### File Structure
```
/styles/
├── tokens.css          # Design tokens (colors, spacing, typography)
├── reset.css           # CSS reset for consistent baseline
├── base.css            # Base element styles
├── layout.css          # Layout utilities (grid, flexbox)
├── utilities.css       # Utility classes
├── index.css           # Main entry point
└── components/
    ├── business-card.module.css
    ├── directory-grid.module.css
    ├── breadcrumb.module.css
    └── stats-bar.module.css
```

### Design Tokens
All design values are defined as CSS custom properties in `tokens.css`:
- Colors: `--color-purple-500`, `--color-blue-500`, etc.
- Spacing: `--space-1` through `--space-32`
- Typography: `--text-xs` through `--text-7xl`
- Breakpoints: `--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`

## Migration Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build CSS
```bash
npm run css:build
```

### 3. Import CSS in Your App

#### For Next.js 15:
In your `app/layout.tsx`:
```tsx
import '/styles/index.css'
// Or for production:
import '/public/styles/bundle.min.css'
```

### 4. Replace Inline Styles

#### Before (Inline Styles):
```tsx
<div style={{
  background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
  padding: '1.5rem',
  borderRadius: '12px'
}}>
```

#### After (CSS Classes):
```tsx
<div className="bg-gradient-purple-blue p-6 rounded-xl">
```

### 5. Use CSS Modules for Components

#### Import CSS Module:
```tsx
import styles from '@/styles/components/business-card.module.css'

function BusinessCard() {
  return (
    <div className={styles.card}>
      <h3 className={styles.name}>Business Name</h3>
      <div className={styles.rating}>
        {/* Rating content */}
      </div>
    </div>
  )
}
```

## Component Migration Examples

### Directory Grid Component

#### Before:
```tsx
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1.5rem'
}}>
```

#### After:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Business Card Component

#### Before:
```tsx
<div style={{
  background: 'rgba(31, 41, 55, 0.8)',
  border: '1px solid rgba(75, 85, 99, 0.5)',
  borderRadius: '12px',
  padding: '1.5rem',
  transition: 'all 0.2s ease'
}}>
```

#### After:
```tsx
import styles from '@/styles/components/business-card.module.css'

<div className={styles.card}>
```

### Stats Bar Component

#### Before:
```tsx
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  padding: '1rem',
  background: 'var(--gradient-surface)'
}}>
```

#### After:
```tsx
import styles from '@/styles/components/stats-bar.module.css'

<div className={styles.container}>
  <div className={styles.wrapper}>
    <div className={styles.grid}>
      {/* Stats content */}
    </div>
  </div>
</div>
```

## Mobile-First Responsive Design

### Breakpoint Strategy
- Mobile: Default styles (no prefix)
- Tablet: `md:` prefix (768px+)
- Desktop: `lg:` prefix (1024px+)

### Example:
```html
<div className="text-base md:text-lg lg:text-xl">
  <!-- Font size increases with screen size -->
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Grid columns increase with screen size -->
</div>
```

## Performance Optimization

### 1. Build Production CSS
```bash
npm run css:minify
```

### 2. Purge Unused CSS
```bash
npm run css:purge
```

### 3. Analyze Bundle Size
```bash
npm run css:analyze
```

## Accessibility Features

### Focus States
All interactive elements have proper focus states:
```css
.button:focus-visible {
  outline: 2px solid var(--color-purple-500);
  outline-offset: 2px;
}
```

### Reduced Motion
Animations respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

### Touch Targets
Minimum touch target size for mobile:
```css
button {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);
}
```

## Dark/Light Theme Support

### Using Theme Variables
```css
/* Automatic theme switching */
.card {
  background: var(--color-surface);
  color: var(--color-text-primary);
}
```

### Toggle Theme
```tsx
// In your theme toggle component
document.documentElement.setAttribute('data-theme', 'light')
// or
document.documentElement.setAttribute('data-theme', 'dark')
```

## Common Utility Classes

### Spacing
- Padding: `p-4`, `px-6`, `py-8`
- Margin: `m-4`, `mx-auto`, `mt-8`
- Gap: `gap-4`, `gap-x-6`, `gap-y-8`

### Typography
- Size: `text-sm`, `text-base`, `text-lg`, `text-xl`
- Weight: `font-normal`, `font-medium`, `font-bold`
- Color: `text-primary`, `text-secondary`, `text-muted`

### Layout
- Display: `block`, `flex`, `grid`, `hidden`
- Flexbox: `flex-col`, `items-center`, `justify-between`
- Grid: `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`

### Visual
- Background: `bg-surface`, `bg-gradient-purple-blue`
- Border: `border`, `border-purple-500`, `rounded-xl`
- Shadow: `shadow-lg`, `shadow-glow-purple`

## Scripts Reference

- `npm run css:build` - Build CSS bundle
- `npm run css:watch` - Watch and rebuild on changes
- `npm run css:minify` - Create production build
- `npm run css:purge` - Remove unused CSS
- `npm run css:lint` - Lint and fix CSS files
- `npm run css:analyze` - Analyze bundle size
- `npm run build:css` - Complete production build

## Browser Support

The CSS architecture supports:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 12+
- Android Chrome 90+

## Migration Checklist

- [ ] Install CSS build dependencies
- [ ] Build initial CSS bundle
- [ ] Import CSS in app layout
- [ ] Replace inline styles in directory pages
- [ ] Update BusinessCard component
- [ ] Update directory grid layouts
- [ ] Update breadcrumb component
- [ ] Update stats bar component
- [ ] Test responsive design on mobile devices
- [ ] Test accessibility with keyboard navigation
- [ ] Run CSS purge for production
- [ ] Verify bundle size is under 45KB gzipped

## Support

For questions or issues with the CSS migration, refer to:
- Design tokens: `/styles/tokens.css`
- Component examples: `/styles/components/`
- PostCSS config: `/postcss.config.cjs`
- PurgeCSS config: `/purgecss.config.cjs`