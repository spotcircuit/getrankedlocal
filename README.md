# GetLocalRanked - Google Maps Ranking Analysis Platform

## 🚀 Project Overview

GetLocalRanked is a sophisticated Google Maps ranking analysis and lead generation platform designed to help local businesses (particularly medical spas, dental practices, and law firms) understand and improve their local search visibility.

## 📊 Current Project Status (Updated: December 2024)

### ✅ Completed Features
- **Core Analysis Engine**: Fully functional Google Maps scraping and ranking analysis
- **Real-time Data**: Live competitor analysis with 100+ businesses tracked per search
- **AI Intelligence**: Advanced business intelligence extraction using AI
- **Visual Analytics**: Interactive maps, competitor comparisons, and ranking visualizations
- **Directory System**: Multi-city business directory with SEO-optimized pages
- **Lead Collections System**: Many-to-many relationship system for organizing leads by search collections and destinations
- **Data Migration**: Successfully migrated 6,511 leads to normalized collection system with 9 distinct collections
- **Collection Utilities**: Normalization functions for collection names and destination parsing
- **Railway Backend**: Deployed Python/Flask API for scraping operations
- **Vercel Frontend**: Next.js 14 app with TypeScript and Tailwind CSS
- **Stakeholder Landing Pages**: Created business-owner focused landing pages
- **Trust Signals**: Integrated trust badges and social proof elements
- **ROI Calculator**: Built interactive ROI and revenue loss calculators
- **Progressive Disclosure**: Simplified results view with detail toggle
- **Urgency Triggers**: Added competitor movement alerts and countdown timers
- **Visual Assets**: Integrated visual problem representations for better understanding

### 🎯 Recently Implemented

#### Lead Collections System (Version 2.0)
The platform now features a comprehensive lead collections system that organizes 6,511 leads across 9 distinct business categories:

**Collections Available:**
- Medical Spas & Cosmetic Surgery
- Dental Practices & Orthodontics
- Law Firms & Legal Services
- Veterinary Clinics
- Chiropractors & Physical Therapy
- Real Estate Agencies
- Auto Dealerships
- Restaurants & Food Services
- Fitness Centers & Gyms

**Technical Implementation:**
- **Lead Collections API**: New endpoints for browsing collections and directory pages
  - `GET /api/directory/collections` - Lists all collections with statistics and location breakdowns
  - `GET /api/directory/[collection]/[state]/[city]` - Gets leads for specific directory pages with SEO optimization
- **Enhanced AI Extraction**: New flexible parser with improved owner/founder name extraction
- **Database Schema Updates**: Added lead_collections table with proper indexes and relationships for scalable many-to-many architecture
- **Collection Utilities**: Comprehensive normalization and parsing functions for business collections
- **Directory System Enhancement**: Displays businesses by search location rather than business location for better local SEO

**Business-Focused Features:**
- **StakeholderHero Component**: Personalized landing for email/directory traffic showing revenue loss
- **SimplifiedSolution Component**: 3-step roadmap to #1 in 90 days with ROI focus
- **CaseStudySection**: Interactive case studies with before/after metrics
- **UrgencyBanner**: Rotating urgency messages with competitor alerts
- **AIIntelligenceDynamic**: Enhanced AI response parsing with deduplication
- **Trust Bar in Header**: Full trust badges image for credibility
- **Social Proof Integration**: Success stories prominently displayed

### 🔧 TODO Checklist
- [ ] Fix broken image reference in SolutionSection.tsx (line 44 - /images/seodashboard.png)
- [ ] Fix missing testimonial images in CaseStudySection.tsx or remove references
- [ ] Create CompetitorAlert component with competitor-alert-dashboard.png
- [ ] Add CompetitorAlert to ResultsSectionV2 after BusinessInsights
- [ ] Add 90dayROI.png to SimplifiedSolution after 90-day process section
- [ ] Add 90-day-success-roadmap.png to SimplifiedSolution after 3-step cards
- [ ] Add social-proof.jpeg to CaseStudySection after header
- [ ] Implement pricing strategy (plans defined, pricing TBD)
- [ ] Set up A/B testing for conversion optimization
- [ ] Create email templates for stakeholder outreach

### 💡 What's Different Now
The platform has been transformed from a technical analysis tool to a business-owner friendly solution:
- **Before**: Complex data dumps that overwhelmed non-technical users
- **After**: Progressive disclosure with simple/detailed views
- **Before**: Feature-focused messaging ("We analyze rankings")
- **After**: ROI-focused messaging ("You're losing $15,000/month")
- **Before**: Generic landing pages
- **After**: Personalized stakeholder pages with specific business data

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (optional for full features)
- Git for version control

### 1) Clone and Install
```bash
git clone <repository-url>
cd getlocalranked
npm install
```

### 2) Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables:
# DATABASE_URL=postgresql://user:password@host/database
# Add your API keys and configuration
```

### 3) Build CSS Architecture
```bash
# Build the modular CSS system
npm run css:build

# For development with watch mode
npm run css:watch
```

### 4) Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 5) Directory System Usage

#### Browse Service Directory
- `/directory/medical-spas` - All medical spa services
- `/directory/medical-spas/california` - California medical spas
- `/directory/medical-spas/california/los-angeles` - LA medical spas

#### API Endpoints
- `GET /api/directory/services` - List all services
- `GET /api/directory/services/medical-spas` - Service data
- `GET /api/directory/services/medical-spas/california` - State data
- `GET /api/directory/services/medical-spas/california/los-angeles` - City data

## 🏗️ Directory Architecture

The platform implements a **service-first directory structure** with dual URL support for maximum SEO coverage:

### Service-First (Canonical)
```
/directory/[service]/[state]/[city]
Examples:
- /directory/medical-spas/california/los-angeles
- /directory/wellness-centers/texas/houston
- /directory/aesthetic-clinics/florida/miami
```

### Collection-Based (Alternative)
```
/directory/[collection]/[state]/[city]
Examples:
- /directory/medspas/california/los-angeles
- /directory/dental-practices/texas/houston
```

### URL Strategy
- **Canonical URLs**: Service-first structure for better keyword targeting
- **Alternative URLs**: Collection-based for legacy compatibility
- **SEO Optimization**: Both patterns supported with proper redirects
- **Clean URLs**: Lowercase, hyphen-separated, no special characters

## 📁 Project Structure

```
getlocalranked/
├── app/                           # Next.js App Router
│   ├── directory/                 # Directory system
│   │   ├── [service]/            # Service-first pages (CANONICAL)
│   │   │   ├── [state]/          # State-level service pages
│   │   │   │   └── [city]/       # City-level service pages
│   │   │   └── page.tsx          # Service landing page
│   │   ├── [collection]/         # Collection-based pages (legacy)
│   │   │   ├── [state]/          # State-level collection pages
│   │   │   │   └── [city]/       # City-level collection pages
│   │   │   └── page.tsx          # Collection landing page
│   │   └── page.tsx              # Directory index
│   ├── api/                      # API routes
│   │   └── directory/            # Directory API endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # Reusable components
│   ├── directory/               # Directory-specific components
│   ├── ui/                      # UI components
│   └── layout/                  # Layout components
├── styles/                       # Modular CSS architecture
│   ├── tokens.css               # Design system tokens
│   ├── base.css                 # Base styles
│   ├── layout.css               # Layout utilities
│   ├── utilities.css            # Utility classes
│   └── components/              # Component-specific styles
├── docs/                        # Documentation
│   ├── directory-architecture.md
│   ├── seo-strategy.md
│   ├── css-architecture.md
│   └── api-reference.md
└── public/                      # Static assets

## 🎨 CSS Architecture

The platform uses a **modular CSS architecture** with mobile-first design:

### Design System
- **Tokens**: CSS custom properties for colors, spacing, typography
- **Mobile-First**: Responsive breakpoints (sm: 480px, md: 768px, lg: 1024px)
- **Modular**: Component-specific CSS modules
- **Performance**: PurgeCSS optimization, under 45KB gzipped

### Key Features
- Design token system with semantic color variables
- Dark/light theme support with CSS custom properties  
- Accessibility features (reduced motion, high contrast)
- Touch-friendly mobile interface (44px minimum touch targets)

## 🔍 SEO Strategy

The directory system implements comprehensive SEO optimization:

### Technical SEO
- **Canonical URLs**: Service-first structure (`/directory/medical-spas/california/los-angeles`)
- **Structured Data**: LocalBusiness, BreadcrumbList, FAQ, and ItemList schemas
- **Meta Optimization**: Dynamic titles, descriptions, and Open Graph tags
- **Performance**: Core Web Vitals optimization, lazy loading, CDN delivery

### Local SEO
- **Geographic Targeting**: State and city-specific landing pages
- **NAP Consistency**: Structured business name, address, phone data
- **Review Integration**: Google review display and ratings
- **Local Keywords**: City + service keyword optimization

See `/docs/seo-strategy.md` for complete implementation details.

## 🎯 Features

- **Personalized URLs**: `http://localhost:3000?name=BusinessName&id=123`
- **Dynamic Data**: Shows their actual ranking and competitors
- **Lost Revenue Calculator**: Interactive tool showing money left on table
- **Real Client Testimonials**: The Fix Clinic, Contours Concierge
- **Responsive Design**: Works on all devices
- **Fast Loading**: Optimized Next.js build

## 💰 The Sales Pitch

1. **Problem**: "You're ranked #7, losing 85% of customers"
2. **Agitate**: Show competitors winning + revenue calculator
3. **Solution**: "SEO 2.0 - AI-optimized approach"
4. **Proof**: Real client results
5. **CTA**: Urgent call to action

## 🔧 Customization

### Change Business Defaults
Edit `app/page.tsx`:
```typescript
function getDemoBusinessData(): BusinessData {
  return {
    name: 'Your Business',
    rating: 4.2,
    reviewCount: 85,
    city: 'Austin',
    niche: 'med spas'
  };
}
```

### Update Calculator Defaults
Edit `components/LostRevenueCalculator.tsx`:
```typescript
const [aov, setAov] = useState(350); // Change average customer value
```

### Add More Testimonials
Edit `components/SocialProof.tsx`:
```typescript
const testimonials = [
  // Add your clients here
];
```

## 🌐 Production Deployment

### Build for Production
```powershell
npm run build
# or: .\build.bat
```

### Start Production Server
```powershell
npm run start
# or: .\start-prod.bat
```

### Deploy to Vercel
```bash
npx vercel
```

## 🔑 Environment Variables

Create `.env.local` (never commit). See `.env.example` for the shape.

- `DATABASE_URL` (optional) — PostgreSQL connection string used by API features.
  - Format: `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
  - If unset, the site still runs; API-backed features may be limited.

## 🔎 Key Routes

- `/` — Homepage with “Browse Med Spas by Location”, social proof, and CTAs.
- `/getrankedlocal` — Get Ranked Local page with hero form, CTA, breadcrumbs, and lead capture modal.
- `/[state]`, `/[state]/[city]`, etc. — Dynamic directories.

## 📊 Tracking & Analytics

The app tracks:
- Page views
- Calculator interactions
- CTA clicks
- Form submissions

View analytics in your Vercel dashboard.

## 🔗 Integration with Your Data

The app can pull real data from your scraped businesses:

1. Start the API backend
2. Pass business ID in URL: `?id=123`
3. API fetches from your database
4. Shows personalized competitive analysis

## 📈 Conversion Optimization Tips

1. **Send personalized URLs** in cold emails via ReachInbox
2. **Track opens** to see who's interested
3. **Follow up** immediately when they view the calculator
4. **A/B test** different pain points and urgency messages
5. **Use retargeting** pixels for visitors who don't convert

## 🛠️ Troubleshooting

### CSS Issues
The app uses manual CSS for compatibility. Edit `app/globals.css` for style changes.

### Images Not Loading
Ensure images are in `public/images/` folder.

### API Connection Failed
Check that Python backend is running on port 8000.

### Build Warning about Dynamic Route
If you see a Next.js message about dynamic server usage for `/api/analyze`, it's expected when that route inspects `request.url`. This does not block the build.

## 📞 Support

For issues or customization help, refer to the main README in the parent directory.