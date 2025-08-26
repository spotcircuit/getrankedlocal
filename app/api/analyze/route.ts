export const dynamic = 'force-dynamic';
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
    const idParam = searchParams.get('id');
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

    // Data holders
    let lead: any = null;
    let currentRank: number | null = null;
    let collectionDir = `med_spas_${collection.replace(/ /g, '_')}_${state}`;
    let allBusinesses: any[] = [];
    let foundByName = false;

    // If id is provided, fetch the lead directly and derive its source_directory
    if (idParam) {
      const idNum = Number(idParam);
      if (!Number.isNaN(idNum)) {
        const rows = await sql`SELECT 
            id::int AS id, business_name, rating, review_count::int AS review_count,
            city, state, website, phone, street_address,
            owner_name, medical_director_name,
            search_niche, lead_score, source_directory,
            instagram_handle, facebook_handle, twitter_handle,
            tiktok_handle, youtube_handle
          FROM leads WHERE id = ${idNum} LIMIT 1`;
        lead = rows[0] || null;
        if (lead?.source_directory) {
          collectionDir = String(lead.source_directory);
        }
      }
    }

    console.log('Looking for business in collection:', collectionDir);

    // Load the collection's businesses after determining the directory
    allBusinesses = await sql`
      SELECT 
        id::int AS id, business_name, CAST(rating AS float) AS rating, review_count::int AS review_count,
        city, state, website, phone, street_address, 
        owner_name, medical_director_name,
        search_niche, lead_score, source_directory,
        instagram_handle, facebook_handle, twitter_handle,
        tiktok_handle, youtube_handle,
        (ROW_NUMBER() OVER (
          ORDER BY review_count DESC NULLS LAST, rating DESC NULLS LAST
        ))::int as collection_rank
      FROM leads
      WHERE source_directory = ${collectionDir}
        AND business_name !~* 'sponsored'
      ORDER BY collection_rank
    `;

    // If lead was fetched by id, compute its rank within this collection
    if (lead && !currentRank) {
      const found = allBusinesses.find(b => Number(b.id) === Number(lead.id));
      currentRank = typeof found?.collection_rank === 'number' ? found.collection_rank : (found ? Number(found.collection_rank) : null);
    }

    // Fallback: compute rank directly from SQL if still not found
    if (lead && (currentRank == null)) {
      const rankRows = await sql`
        SELECT rnk::int AS rnk FROM (
          SELECT id::int AS id,
                 ROW_NUMBER() OVER (
                   ORDER BY review_count::int DESC NULLS LAST, CAST(rating AS float) DESC NULLS LAST
                 ) AS rnk
          FROM leads
          WHERE source_directory = ${collectionDir}
            AND business_name !~* 'sponsored'
        ) t WHERE id = ${Number(lead.id)}
        LIMIT 1
      `;
      if (rankRows && rankRows[0]?.rnk != null) {
        currentRank = Number(rankRows[0].rnk);
      }
    }

    if (!lead && name) {
      // First try exact match (case insensitive)
      for (const biz of allBusinesses) {
        if (biz.business_name.toLowerCase() === name.toLowerCase()) {
          lead = biz;
          currentRank = biz.collection_rank;
          foundByName = true;
          break;
        }
      }
      
      // If no exact match, try partial match
      if (!lead) {
        for (const biz of allBusinesses) {
          // Handle URL slugs like "-ed-pa" which might be part of a business name
          const searchTerm = name.toLowerCase().replace(/-/g, ' ').trim();
          if (searchTerm.length >= 2 && biz.business_name.toLowerCase().includes(searchTerm)) {
            lead = biz;
            currentRank = biz.collection_rank;
            foundByName = true;
            break;
          }
        }
      }
    }
    if (!idParam && name) {
      console.log('Search term:', name, 'Found business:', lead?.business_name, 'with rank:', currentRank);
    }

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
      name: name || undefined,
      rating: undefined,
      reviewCount: undefined,
      city: collection || undefined,
      state: state || undefined,
      niche
    };

    // Calculate average reviews for competitors
    const competitorsAvgReviews = competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => sum + (c.review_count || 0), 0) / competitors.length)
      : undefined;

    // Calculate lost revenue based on rank (top 3 don't lose revenue, others do)
    const lostRevenue = typeof currentRank === 'number'
      ? (currentRank <= 3 ? 0 : currentRank <= 10 ? 50000 : 75000)
      : undefined;

    // Calculate potential traffic gain
    const potentialTraffic = typeof currentRank === 'number'
      ? (currentRank === 1 ? '0%' : currentRank <= 3 ? '15%' : '85%')
      : undefined;

    // Build top_competitors list for click distribution
    let topCompetitorsList = allBusinesses.slice(0, 10).map(c => ({
      name: c.business_name,
      rating: c.rating,
      reviews: c.review_count,
      rank: c.collection_rank
    }));

    // Keep top_competitors as-is; no placeholder rewriting

    const analysis = {
      currentRank: typeof currentRank === 'number' ? Number(currentRank) : undefined,
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
        top_competitors: topCompetitorsList,
        digital_presence: {
          with_website: allBusinesses.filter(b => b.website && b.website.trim() !== '').length,
          with_instagram: allBusinesses.filter(b => b.instagram_handle && b.instagram_handle.trim() !== '').length,
          with_facebook: allBusinesses.filter(b => b.facebook_handle && b.facebook_handle.trim() !== '').length
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