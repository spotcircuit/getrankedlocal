# Mobile-First CSS Architecture

## Overview
This CSS architecture implements a comprehensive mobile-first, modular system optimized for performance and accessibility. It provides a complete replacement for inline styles and mixed CSS approaches.

## Architecture Layers

### 1. **Tokens** (`tokens.css`)
- CSS custom properties defining design system values
- Mobile-optimized breakpoints (320px → 1536px)
- Fluid typography using clamp()
- Touch-friendly spacing scale
- Performance-focused animation durations

### 2. **Themes** (`themes.css`)
- Dark mode (default) and light mode support
- High contrast mode for accessibility
- Semantic color system
- Component-specific theming variables
- Automatic theme detection via prefers-color-scheme

### 3. **Reset** (`reset.css`)
- Modern CSS reset optimized for mobile
- Touch target minimum sizes (44px)
- Viewport height fixes for mobile browsers
- Native lazy loading support
- Focus-visible for keyboard navigation

### 4. **Base** (`base.css`)
- Mobile-first typography scale
- Container system with responsive padding
- Form element defaults
- Card and button base styles
- Accessibility helpers (sr-only, focus-trap)

### 5. **Layout** (`layout.css`)
- Flexbox and Grid utilities
- Mobile-first responsive modifiers
- Container queries for component responsiveness
- Safe area insets for modern devices
- Gap and spacing utilities

### 6. **Components** (`components.css`)
- Reusable UI component styles
- Touch-optimized interactive elements
- Loading states and skeletons
- Modal and overlay patterns
- Mobile-friendly navigation

### 7. **Utilities** (`utilities.css`)
- Single-purpose helper classes
- Responsive variants (sm, md, lg)
- Motion-safe animations
- Print-specific styles
- Accessibility utilities

## Mobile-First Breakpoints

```css
/* Mobile First Approach */
320px  - xs  - Mobile portrait
480px  - sm  - Mobile landscape  
768px  - md  - Tablet
1024px - lg  - Desktop
1280px - xl  - Wide desktop
1536px - 2xl - Ultra-wide
```

## Performance Optimizations

### CSS Bundle Optimization
- Route-level code splitting
- PurgeCSS for removing unused styles
- CSS minification with cssnano
- Gzip compression target: <45KB

### Critical CSS Strategy
```bash
# Build optimized CSS
npm run css:build

# Analyze bundle size
npm run css:analyze

# Purge unused CSS
npm run css:purge
```

### Resource Hints
```html
<!-- Preload critical CSS -->
<link rel="preload" href="/styles/bundle.css" as="style">

<!-- DNS prefetch for fonts -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

## Accessibility Features

### WCAG 2.1 AA Compliance
- Focus-visible indicators
- Reduced motion support
- High contrast mode
- Touch target minimums (44px)
- Screen reader utilities

### Implementation
```css
/* Focus visible only for keyboard users */
:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Theming System

### Using Themes
```html
<!-- Default (dark) theme -->
<html>

<!-- Light theme -->
<html data-theme="light">

<!-- High contrast -->
<html data-theme="high-contrast">
```

### Theme Switching
```javascript
// Toggle theme
const toggleTheme = () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
};

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.dataset.theme = savedTheme;
```

## Container Queries

### Component-Level Responsiveness
```css
/* Card adapts based on container width */
.card-container {
  container-type: inline-size;
}

@container (min-width: 420px) {
  .card {
    padding: var(--space-6);
  }
}
```

## Migration Guide

### From Inline Styles
```jsx
// Before (inline styles)
<div style={{ 
  display: 'flex', 
  gap: '1rem',
  padding: '1rem'
}}>

// After (CSS classes)
<div className="flex gap-4 p-4">
```

### From Tailwind Classes
```jsx
// Tailwind classes map directly
<div className="flex items-center justify-between p-4 bg-gray-900">

// Custom CSS equivalent  
<div className="flex items-center justify-between p-4 bg-surface">
```

## Build Commands

```json
{
  "scripts": {
    "css:dev": "postcss styles/index.css -o public/styles/bundle.css --watch",
    "css:build": "NODE_ENV=production postcss styles/index.css -o public/styles/bundle.css",
    "css:minify": "NODE_ENV=production postcss styles/index.css -o public/styles/bundle.min.css",
    "css:purge": "purgecss --config purgecss.config.cjs",
    "css:lint": "stylelint \"styles/**/*.css\" --fix",
    "css:analyze": "ANALYZE=true npm run css:build"
  }
}
```

## Bundle Size Targets

| File | Target | Gzipped |
|------|--------|---------|
| bundle.css | <150KB | <45KB |
| critical.css | <20KB | <7KB |
| route-specific | <30KB | <10KB |

## Testing Checklist

### Mobile Performance
- [ ] Lighthouse score >90 on mobile
- [ ] First Contentful Paint <1.8s
- [ ] Cumulative Layout Shift <0.1
- [ ] Touch targets ≥44px
- [ ] Horizontal scroll prevention

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast ratios pass
- [ ] Focus indicators visible
- [ ] Reduced motion respected

### Cross-Device
- [ ] iOS Safari (iPhone/iPad)
- [ ] Android Chrome
- [ ] Desktop Chrome/Firefox/Safari
- [ ] Tablet landscape/portrait
- [ ] PWA mode

## Component Usage Examples

### Button
```html
<button class="btn btn-primary">
  Click Me
</button>

<button class="btn btn-secondary btn-lg">
  Large Button
</button>
```

### Card
```html
<div class="card card-hover">
  <div class="card-header">
    <h3 class="text-xl font-bold">Title</h3>
  </div>
  <div class="card-body">
    <p>Content goes here</p>
  </div>
</div>
```

### Form
```html
<form class="form">
  <div class="form-group">
    <label class="form-label">Email</label>
    <input type="email" class="form-input" placeholder="Enter email">
  </div>
  <button type="submit" class="btn btn-primary">
    Submit
  </button>
</form>
```

## Best Practices

1. **Mobile-First Development**
   - Start with mobile styles
   - Add tablet/desktop with min-width queries
   - Test on real devices

2. **Performance**
   - Use CSS variables for dynamic values
   - Avoid deep nesting (max 3 levels)
   - Minimize repaints/reflows

3. **Accessibility**
   - Always include focus states
   - Use semantic HTML
   - Test with screen readers

4. **Maintainability**
   - Follow BEM naming for components
   - Keep specificity low
   - Document complex patterns

## Support Matrix

| Browser | Version |
|---------|---------|
| Chrome | Last 2 |
| Safari | Last 2 |
| Firefox | Last 2 |
| Edge | Last 2 |
| iOS Safari | 15+ |
| Android Chrome | Latest |

## Resources

- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Mobile-First Design](https://www.lukew.com/ff/entry.asp?933)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)