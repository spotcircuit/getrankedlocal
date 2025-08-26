import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function slugNormalizeNiche(n?: string): string {
  const t = (n || '').toLowerCase().replace(/\s+/g, '');
  if (t === 'medspas' || t === 'med-spas') return 'med spas';
  if (t === 'lawfirms' || t === 'law-firms') return 'law firms';
  if (t === 'homeservices' || t === 'home-services') return 'home services';
  return n || 'med spas';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const collection = searchParams.get('city') || ''; // city param is actually collection name
    const state = searchParams.get('state') || '';
    const nicheRaw = searchParams.get('niche') || 'med spas';
    const niche = slugNormalizeNiche(nicheRaw);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      // Return demo data if no DB
      return NextResponse.json({ 
        source: 'demo',
        business: {
          name: name || 'Demo Business',
          rating: 4.2,
          reviewCount: 85,
          city: collection || 'Austin',
          state: state || 'TX',
          niche
        },
        analysis: {
          currentRank: 7,
          potentialTraffic: '85%',
          lostRevenue: 75000,
          competitors: []
        }
      });
    }

    const sql = neon(databaseUrl);
    
    // Build the source_directory for this collection
    const sourceDirectory = `med_spas_${collection.replace(/ /g, '_')}_${state}`;
    console.log('Looking for business in collection:', sourceDirectory);

    // Get ALL businesses in collection with their ranks
    const allBusinesses = await sql`
      SELECT 
        id, business_name, rating, review_count::int AS review_count,
        city, state, website, phone, street_address, 
        owner_name, medical_director_name,
        search_niche, lead_score, source_directory,
        instagram_handle, facebook_handle, twitter_handle,
        tiktok_handle, youtube_handle,
        ROW_NUMBER() OVER (
          ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST
        ) as collection_rank
      FROM leads
      WHERE source_directory = ${sourceDirectory}
      ORDER BY collection_rank
    `;

    // Find the specific business
    let lead = null;
    let currentRank = null;
    
    if (name) {
      // Find the business by name (case insensitive)
      for (const biz of allBusinesses) {
        if (biz.business_name.toLowerCase().includes(name.toLowerCase())) {
          lead = biz;
          currentRank = biz.collection_rank;
          break;
        }
      }
    }

    console.log('Found business:', lead?.business_name, 'with rank:', currentRank);

    // Get top 3 competitors
    // Always exclude the current business from competitors
    let competitors = [];
    if (currentRank && currentRank <= 3) {
      // Business is already top 3
      // Show the other top 3 businesses (excluding themselves) plus next best
      competitors = allBusinesses
        .filter(b => lead && b.id !== lead.id)  // Exclude current business
        .slice(0, 3);  // Get next 3 best competitors
    } else {
      // Business is not top 3, show the actual top 3
      competitors = allBusinesses
        .filter(b => !lead || b.id !== lead.id)  // Exclude current business
        .slice(0, 3);
    }
    console.log('Competitors for rank', currentRank, ':', competitors.map(c => c.business_name));

    const business = lead ? {
      name: lead.business_name,
      rating: lead.rating,
      reviewCount: lead.review_count,
      city: lead.city,
      state: lead.state,
      niche,
      website: lead.website,
      phone: lead.phone,
      address: lead.street_address,
      ownerName: lead.owner_name,
      medicalDirector: lead.medical_director_name,
      leadScore: lead.lead_score
    } : {
      name: name || 'Unknown Business',
      rating: null,
      reviewCount: null,
      city: collection,
      state: state,
      niche
    };

    // Calculate average reviews for competitors
    const competitorsAvgReviews = competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => sum + (c.review_count || 0), 0) / competitors.length)
      : undefined;

    // Calculate lost revenue based on rank (top 3 don't lose revenue, others do)
    const lostRevenue = currentRank && currentRank <= 3 
      ? 0  // Top 3 businesses aren't losing revenue
      : currentRank && currentRank <= 10 
        ? 50000  // Ranks 4-10 lose moderate revenue
        : 75000; // Ranks 11+ lose significant revenue

    // Calculate potential traffic gain
    const potentialTraffic = currentRank && currentRank === 1 
      ? '0%'  // Already #1, no traffic to gain
      : currentRank && currentRank <= 3 
        ? '15%'  // Top 3 can gain some traffic
        : '85%'; // Others have high potential

    const analysis = {
      currentRank: currentRank ? Number(currentRank) : null,
      potentialTraffic,
      lostRevenue,
      reviewDeficit: (business.reviewCount && competitorsAvgReviews) 
        ? Math.max(0, competitorsAvgReviews - business.reviewCount)
        : undefined,
      competitorsAvgReviews,
      competitors: competitors.map(c => ({
        name: c.business_name,
        rank: c.collection_rank,
        rating: c.rating,
        reviews: c.review_count,
        city: c.city,
        website: c.website,
        phone: c.phone,
        advantages: []
      })),
      painPoints: [],
      solutions: ['AI-Optimized Content Strategy', 'Review Generation System', 'Technical SEO Overhaul'],
      timeline: '90 days to #1',
      urgency: 'Competitors gaining 10+ reviews monthly',
      actionPlan: [],
      marketIntel: {
        market_summary: {
          total_businesses: allBusinesses.length,
          avg_rating: allBusinesses.length > 0 
            ? Number((allBusinesses.reduce((sum, b) => sum + Number(b.rating || 0), 0) / allBusinesses.length).toFixed(2))
            : 0,
          avg_reviews: allBusinesses.length > 0
            ? Math.round(allBusinesses.reduce((sum, b) => sum + (b.review_count || 0), 0) / allBusinesses.length)
            : 0,
          median_reviews: (() => {
            const sorted = allBusinesses.map(b => b.review_count || 0).sort((a, b) => a - b);
            if (sorted.length === 0) return 0;
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
          })(),
          max_reviews: Math.max(...allBusinesses.map(b => b.review_count || 0), 0)
        },
        top_competitors: allBusinesses.slice(0, 10).map(c => ({
          name: c.business_name,
          rating: c.rating,
          reviews: c.review_count,
          rank: c.collection_rank
        })),
        digital_presence: {
          with_website: allBusinesses.filter(b => b.website).length,
          with_instagram: allBusinesses.filter(b => b.instagram_handle).length,
          with_facebook: allBusinesses.filter(b => b.facebook_handle).length
        },
        review_momentum: {
          over_100_reviews: allBusinesses.filter(b => (b.review_count || 0) > 100).length,
          over_500_reviews: allBusinesses.filter(b => (b.review_count || 0) > 500).length,
          excellent_rating: allBusinesses.filter(b => (b.rating || 0) >= 4.8).length
        }
      }
    };

    return NextResponse.json({ source: 'db', business, analysis });
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}