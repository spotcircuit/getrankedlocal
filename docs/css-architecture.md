# CSS Architecture Documentation

## Overview

The GetLocalRanked platform implements a **modern, modular CSS architecture** built on design tokens, mobile-first principles, and component-based organization. This documentation covers the complete CSS system, from design tokens to component patterns, build process, and performance optimization.

## Architecture Philosophy

### Design System Foundation

The CSS architecture is built on a comprehensive design token system that ensures:

- **Consistency**: Unified visual language across all components
- **Scalability**: Easy maintenance and expansion of design choices
- **Accessibility**: Built-in support for accessibility requirements
- **Performance**: Optimized for minimal bundle size and fast loading

### Mobile-First Approach

All styles are designed with a mobile-first methodology:

```css
/* Mobile styles (default) */
.component { 
  font-size: var(--text-base);
  padding: var(--space-4);
}

/* Tablet styles (768px+) */
@media (min-width: 768px) {
  .component {
    font-size: var(--text-lg);
    padding: var(--space-6);
  }
}

/* Desktop styles (1024px+) */
@media (min-width: 1024px) {
  .component {
    font-size: var(--text-xl);
    padding: var(--space-8);
  }
}
```

## File Structure

### CSS Organization

```
styles/
├── index.css                    # Main entry point and imports
├── tokens.css                   # Design system tokens
├── reset.css                    # CSS reset for browser consistency
├── base.css                     # Base element styles
├── layout.css                   # Layout utilities and grid systems
├── utilities.css                # Utility classes
└── components/                  # Component-specific styles
    ├── business-card.module.css
    ├── directory-grid.module.css
    ├── breadcrumb.module.css
    └── stats-bar.module.css
```

### Import Hierarchy

```css
/* styles/index.css - Main entry point */
@import './tokens.css';        /* Design tokens first */
@import './reset.css';         /* Browser reset */
@import './base.css';          /* Base element styles */
@import './layout.css';        /* Layout utilities */
@import './utilities.css';     /* Utility classes */

/* Component styles are imported individually where needed */
```

## Design Token System

### Color Tokens

The color system provides semantic color variables with comprehensive scales:

```css
:root {
  /* Brand Colors */
  --color-brand-primary: #a855f7;     /* Purple 500 */
  --color-brand-secondary: #3b82f6;   /* Blue 500 */
  --color-brand-accent: #ec4899;      /* Pink 500 */
  
  /* Purple Scale */
  --color-purple-50: #faf5ff;
  --color-purple-500: #a855f7;
  --color-purple-900: #581c87;
  
  /* Semantic Colors */
  --color-background: #000000;
  --color-surface: var(--color-gray-900);
  --color-text-primary: #ffffff;
  --color-text-secondary: var(--color-gray-300);
  
  /* Gradients */
  --gradient-purple-blue: linear-gradient(135deg, var(--color-purple-600) 0%, var(--color-blue-600) 100%);
  --gradient-surface: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%);
}
```

### Typography Tokens

Mobile-first typography system with responsive scaling:

```css
:root {
  /* Font Families */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Fira Code', monospace;
  
  /* Font Sizes - Mobile First */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-4xl: 2.25rem;    /* 36px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}

/* Responsive Typography Scaling */
@media (min-width: 768px) {
  :root {
    --text-4xl: 2.5rem;    /* 40px */
    --text-5xl: 3.5rem;    /* 56px */
  }
}

@media (min-width: 1024px) {
  :root {
    --text-4xl: 2.75rem;   /* 44px */
    --text-5xl: 4rem;      /* 64px */
  }
}
```

### Spacing System

Consistent spacing scale based on 4px base unit:

```css
:root {
  /* Spacing Scale */
  --space-0: 0;
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  
  /* Container Padding */
  --container-padding-mobile: var(--space-4);
  --container-padding-tablet: var(--space-6);
  --container-padding-desktop: var(--space-8);
}
```

### Breakpoint System

```css
:root {
  /* Breakpoint Values */
  --breakpoint-sm: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  
  /* Container Widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
}
```

## Layout System

### Grid Utilities

Responsive grid system with mobile-first breakpoints:

```css
/* Base Grid Classes */
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

/* Responsive Grid Classes */
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

### Flexbox Utilities

```css
/* Flexbox Layout */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }

/* Alignment */
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

/* Flex Properties */
.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-none { flex: none; }
```

### Container System

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding-mobile);
  padding-right: var(--container-padding-mobile);
}

@media (min-width: 640px) {
  .container { max-width: var(--container-sm); }
}

@media (min-width: 768px) {
  .container { 
    max-width: var(--container-md);
    padding-left: var(--container-padding-tablet);
    padding-right: var(--container-padding-tablet);
  }
}

@media (min-width: 1024px) {
  .container { 
    max-width: var(--container-lg);
    padding-left: var(--container-padding-desktop);
    padding-right: var(--container-padding-desktop);
  }
}
```

## Component Architecture

### CSS Modules Structure

Each component has its own CSS module following BEM-inspired naming:

```css
/* styles/components/business-card.module.css */

.card {
  background: var(--gradient-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: var(--transition-base);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-purple);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.rating {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ratingStars {
  color: var(--color-brand-warning);
}

.ratingCount {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.content {
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.address {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: auto;
}

.button {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  font-weight: var(--font-medium);
  transition: var(--transition-base);
  cursor: pointer;
  min-height: var(--touch-target-min);
}

.buttonPrimary {
  background: var(--gradient-purple-blue);
  color: white;
}

.buttonPrimary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.buttonSecondary {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.buttonSecondary:hover {
  background: var(--color-gray-700);
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .card {
    padding: var(--space-8);
  }
  
  .name {
    font-size: var(--text-xl);
  }
  
  .actions {
    gap: var(--space-4);
  }
}
```

### Directory Grid Component

```css
/* styles/components/directory-grid.module.css */

.container {
  width: 100%;
  padding: var(--space-4) 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.loadMoreContainer {
  display: flex;
  justify-content: center;
  margin-top: var(--space-8);
}

.loadMoreButton {
  padding: var(--space-4) var(--space-8);
  background: var(--gradient-purple-blue);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  min-height: var(--touch-target-min);
}

.loadMoreButton:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.loadMoreButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
```

### Stats Bar Component

```css
/* styles/components/stats-bar.module.css */

.container {
  background: var(--gradient-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.wrapper {
  width: 100%;
  max-width: var(--container-lg);
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 480px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
  
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-6);
  }
}

.stat {
  text-align: center;
  padding: var(--space-2);
}

.statNumber {
  display: block;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-brand-primary);
  line-height: var(--leading-tight);
}

@media (min-width: 768px) {
  .statNumber {
    font-size: var(--text-3xl);
  }
}

.statLabel {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
  line-height: var(--leading-normal);
}
```

## Utility Classes

### Spacing Utilities

```css
/* Padding */
.p-0 { padding: var(--space-0); }
.p-1 { padding: var(--space-1); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

/* Padding X/Y */
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }

/* Margin */
.m-0 { margin: var(--space-0); }
.m-4 { margin: var(--space-4); }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-4 { margin-top: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }

/* Gap */
.gap-2 { gap: var(--space-2); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
```

### Typography Utilities

```css
/* Font Sizes */
.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.text-2xl { font-size: var(--text-2xl); }

/* Font Weights */
.font-normal { font-weight: var(--font-normal); }
.font-medium { font-weight: var(--font-medium); }
.font-semibold { font-weight: var(--font-semibold); }
.font-bold { font-weight: var(--font-bold); }

/* Text Colors */
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-muted { color: var(--color-text-muted); }

/* Text Alignment */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Line Height */
.leading-none { line-height: var(--leading-none); }
.leading-tight { line-height: var(--leading-tight); }
.leading-normal { line-height: var(--leading-normal); }
```

### Visual Utilities

```css
/* Background Colors */
.bg-surface { background-color: var(--color-surface); }
.bg-elevated { background-color: var(--color-surface-elevated); }

/* Background Gradients */
.bg-gradient-purple-blue { background: var(--gradient-purple-blue); }
.bg-gradient-surface { background: var(--gradient-surface); }

/* Borders */
.border { border: 1px solid var(--color-border); }
.border-purple-500 { border-color: var(--color-purple-500); }

/* Border Radius */
.rounded { border-radius: var(--radius-base); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-full); }

/* Shadows */
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-glow-purple { box-shadow: var(--shadow-glow-purple); }

/* Opacity */
.opacity-0 { opacity: 0; }
.opacity-50 { opacity: 0.5; }
.opacity-100 { opacity: 1; }
```

## Theme System

### Dark/Light Theme Support

```css
/* Default Dark Theme */
:root {
  --color-background: #000000;
  --color-surface: var(--color-gray-900);
  --color-text-primary: #ffffff;
  --color-text-secondary: var(--color-gray-300);
}

/* Light Theme Override */
[data-theme="light"] {
  --color-background: #ffffff;
  --color-surface: var(--color-gray-50);
  --color-surface-elevated: #ffffff;
  --color-border: var(--color-gray-200);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-700);
  --color-text-muted: var(--color-gray-500);
}

/* Theme Toggle Implementation */
.theme-toggle {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: var(--space-2);
  cursor: pointer;
  transition: var(--transition-base);
}
```

### Theme Switching

```typescript
// Theme switching functionality
const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

// Initialize theme from localStorage or system preference
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = savedTheme || systemPreference;
  
  document.documentElement.setAttribute('data-theme', theme);
};
```

## Accessibility Features

### Focus Management

```css
/* Focus Styles */
*:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
  border-radius: var(--radius-base);
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-brand-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  border-radius: var(--radius-base);
  z-index: var(--z-tooltip);
}

.skip-link:focus {
  top: 6px;
}
```

### Touch Targets

```css
/* Minimum Touch Target Sizes */
button, 
.button,
[role="button"],
a {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Comfortable Touch Targets for Important Actions */
.button-primary {
  min-height: var(--touch-target-comfortable); /* 48px */
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms;
    --transition-base: 0ms;
    --transition-slow: 0ms;
    --duration-150: 0ms;
    --duration-300: 0ms;
  }
  
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  :root {
    --color-border: var(--color-gray-400);
    --color-text-muted: var(--color-gray-200);
  }
  
  .button {
    border: 2px solid currentColor;
  }
}
```

## Build System

### PostCSS Configuration

```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-custom-properties': {
      preserve: false
    },
    'postcss-nested': {},
    'autoprefixer': {},
    'cssnano': {
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifySelectors: true
      }]
    }
  }
};
```

### PurgeCSS Configuration

```javascript
// purgecss.config.cjs
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}'
  ],
  css: ['./styles/bundle.css'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  safelist: [
    /^grid-cols-/,
    /^md:/,
    /^lg:/,
    /^hover:/,
    /^focus:/,
    /^data-/
  ]
};
```

### Build Scripts

```json
{
  "scripts": {
    "css:build": "postcss styles/index.css -o public/styles/bundle.css",
    "css:watch": "postcss styles/index.css -o public/styles/bundle.css --watch",
    "css:minify": "postcss styles/index.css -o public/styles/bundle.min.css --env production",
    "css:purge": "purgecss --config purgecss.config.cjs --output public/styles/",
    "css:lint": "stylelint \"styles/**/*.css\" --fix",
    "css:analyze": "bundlesize",
    "build:css": "npm run css:build && npm run css:purge && npm run css:minify"
  }
}
```

## Performance Optimization

### Bundle Size Optimization

Target bundle sizes:
- **Development**: ~120KB uncompressed
- **Production**: <45KB gzipped
- **Critical CSS**: <14KB inline

### Critical CSS Strategy

```css
/* Critical CSS - Inlined in <head> */
/* Above-the-fold styles only */
.container { /* container styles */ }
.header { /* header styles */ }
.hero { /* hero section styles */ }
.business-card { /* initial card styles */ }
```

### Lazy Loading Patterns

```css
/* Lazy-loaded component styles */
.lazy-component {
  opacity: 0;
  transform: translateY(20px);
  transition: var(--transition-slow);
}

.lazy-component.loaded {
  opacity: 1;
  transform: translateY(0);
}
```

### Image Optimization Integration

```css
/* Optimized image containers */
.image-container {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-base);
}

.image-placeholder {
  background: var(--color-gray-800);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
```

## Testing and Quality Assurance

### Browser Testing Matrix

- **Chrome**: 90+ (primary target)
- **Safari**: 14+ (iOS/macOS)
- **Firefox**: 88+
- **Edge**: 90+
- **Mobile Safari**: iOS 12+
- **Chrome Mobile**: Android 10+

### CSS Validation

```bash
# Lint CSS files
npm run css:lint

# Validate CSS syntax
stylelint "styles/**/*.css"

# Check bundle size
npm run css:analyze
```

### Performance Testing

```bash
# Lighthouse CI for CSS performance
lighthouse --only-categories=performance,accessibility

# Bundle analyzer
npm run css:analyze

# Critical CSS validation
critical-css-validator
```

This CSS architecture provides a solid foundation for scalable, maintainable, and performant styling that grows with the application while maintaining consistency and accessibility standards.