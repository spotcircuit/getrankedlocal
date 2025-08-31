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
- **Railway Backend**: Deployed Python/Flask API for scraping operations
- **Vercel Frontend**: Next.js 14 app with TypeScript and Tailwind CSS
- **Stakeholder Landing Pages**: Created business-owner focused landing pages
- **Trust Signals**: Integrated trust badges and social proof elements
- **ROI Calculator**: Built interactive ROI and revenue loss calculators
- **Progressive Disclosure**: Simplified results view with detail toggle
- **Urgency Triggers**: Added competitor movement alerts and countdown timers
- **Visual Assets**: Integrated visual problem representations for better understanding

### 🎯 Recently Implemented
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

## 🚀 Quick Start (Windows)

### 1) Install dependencies
```powershell
npm install
# or: .\install.bat
```

### 2) Configure environment (optional)
Copy `.env.example` to `.env.local` and fill in values.
```powershell
Copy-Item .env.example .env.local
```

### 3) Start dev server
```powershell
npm run dev
# or: .\dev.bat
```

Open http://localhost:3000

### 4) Start API backend (optional)
In a separate terminal (only if using API-driven features):
```powershell
.\start-api.bat
```

## 📁 File Structure

```
sales_funnel_app/
├── app/                    # Next.js pages
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # App layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── HeroSection.tsx    # Hero with urgency
│   ├── ProblemSection.tsx # Pain points + calculator
│   ├── CompetitorAnalysis.tsx # Shows why they're losing
│   ├── SolutionSection.tsx # SEO 2.0 pitch
│   ├── SocialProof.tsx    # Client testimonials
│   ├── CTASection.tsx     # Call to action
│   └── LostRevenueCalculator.tsx # Interactive calculator
├── public/images/         # Your images
│   ├── herobackground.png
│   ├── beforeaftergoogle.png
│   ├── declinegoogletraffic.png
│   ├── ailogos.png
│   └── seodashboard.png
├── api/                   # Python backend
│   └── funnel_api.py      # FastAPI server
└── types/                 # TypeScript types
    └── index.ts

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