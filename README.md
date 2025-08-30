# GetLocalRanked - Google Maps Ranking Analysis Platform

## 🚀 Project Overview

GetLocalRanked is a sophisticated Google Maps ranking analysis and lead generation platform designed to help local businesses (particularly medical spas, dental practices, and law firms) understand and improve their local search visibility.

## 📊 Current Project Status

### ✅ What's Working
- **Core Analysis Engine**: Fully functional Google Maps scraping and ranking analysis
- **Real-time Data**: Live competitor analysis with 100+ businesses tracked per search
- **AI Intelligence**: Advanced business intelligence extraction using AI
- **Visual Analytics**: Interactive maps, competitor comparisons, and ranking visualizations
- **Directory System**: Multi-city business directory with SEO-optimized pages
- **Railway Backend**: Deployed Python/Flask API for scraping operations
- **Vercel Frontend**: Next.js 14 app with TypeScript and Tailwind CSS

### 🚧 Current Development Focus
We're currently transforming the platform from a technical analysis tool into a revenue-generating machine that resonates with business owners. See [TODO.md](./TODO.md) for detailed implementation checklist.

**Active Sprint Goals:**
1. Simplifying the user experience for non-technical business owners
2. Adding trust signals and social proof
3. Implementing ROI-focused messaging
4. Creating urgency triggers and competitor alerts
5. Building stakeholder-specific landing pages

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