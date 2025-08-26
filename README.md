# Sales Funnel App - SEO 2.0 Dynamic Landing Pages

## 🚀 Quick Start (Windows)

### 1. Install Dependencies
```cmd
install.bat
```

### 2. Start Development Server
```cmd
dev.bat
```

Then open http://localhost:3000 in your browser

### 3. Start API Backend (Optional - for dynamic data)
In a separate terminal:
```cmd
start-api.bat
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
```cmd
build.bat
```

### Start Production Server
```cmd
start-prod.bat
```

### Deploy to Vercel
```bash
npx vercel
```

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

## 📞 Support

For issues or customization help, refer to the main README in the parent directory.