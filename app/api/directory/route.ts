import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const collection = searchParams.get('collection');
  const niche = searchParams.get('niche');
  const slug = searchParams.get('slug');
  const debug = searchParams.get('debug');
  const sort = searchParams.get('sort');

  try {
    if (debug === 'columns') {
      // Return columns in leads table related to rating/review to help pick correct fields
      const cols = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'leads'
          AND (column_name ILIKE '%rating%' OR column_name ILIKE '%review%')
        ORDER BY column_name
      `;
      return NextResponse.json({ columns: cols.map((c: any) => c.column_name) });
    } else if (state && collection && niche && slug) {
      // Single business by slug
      const sourceDir = `med_spas_${collection.replace(/ /g, '_')}_${state}`;
      const rows = await sql`
        SELECT 
          id,
          business_name as name,
          regexp_replace(LOWER(REPLACE(business_name, ' ', '-')), '[^a-z0-9-]+', '', 'g') as slug,
          CAST(rating AS float) as rating,
          CAST(review_count AS int) as "reviewCount",
          CONCAT(street_address, ', ', city, ', ', state) as address,
          website,
          phone,
          ROW_NUMBER() OVER (ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST) as rank,
          (rating >= 4.5) as trending,
          'Premier medical spa offering advanced aesthetic treatments' as description
        FROM leads
        WHERE LOWER(source_directory) = LOWER(${sourceDir})
      `;
      const match = rows.find((r: any) => r.slug === slug.toLowerCase());
      if (!match) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ business: match });
    } else if (state && collection && niche) {
      // Get businesses in a specific collection and niche
      let businesses;
      if (sort === 'rating_asc') {
        businesses = await sql`
          SELECT 
            id,
            business_name as name,
            regexp_replace(LOWER(REPLACE(business_name, ' ', '-')), '[^a-z0-9-]+', '', 'g') as slug,
            CAST(rating AS float) as rating,
            CAST(review_count AS int) as "reviewCount",
            CONCAT(street_address, ', ', city, ', ', state) as address,
            website,
            phone,
            ROW_NUMBER() OVER (ORDER BY rating ASC NULLS LAST, review_count DESC NULLS LAST) as rank,
            (rating >= 4.5) as trending,
            'Premier medical spa offering advanced aesthetic treatments' as description
          FROM leads
          WHERE source_directory = ${`med_spas_${collection.replace(/ /g, '_')}_${state}`}
            AND business_name !~* 'sponsored'
          ORDER BY rating ASC NULLS LAST, review_count DESC NULLS LAST
          LIMIT 50
        `;
      } else if (sort === 'rating_desc') {
        businesses = await sql`
          SELECT 
            id,
            business_name as name,
            regexp_replace(LOWER(REPLACE(business_name, ' ', '-')), '[^a-z0-9-]+', '', 'g') as slug,
            CAST(rating AS float) as rating,
            CAST(review_count AS int) as "reviewCount",
            CONCAT(street_address, ', ', city, ', ', state) as address,
            website,
            phone,
            ROW_NUMBER() OVER (ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST) as rank,
            (rating >= 4.5) as trending,
            'Premier medical spa offering advanced aesthetic treatments' as description
          FROM leads
          WHERE source_directory = ${`med_spas_${collection.replace(/ /g, '_')}_${state}`}
            AND business_name !~* 'sponsored'
          ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST
          LIMIT 50
        `;
      } else {
        // Default: reviews_desc
        businesses = await sql`
          SELECT 
            id,
            business_name as name,
            regexp_replace(LOWER(REPLACE(business_name, ' ', '-')), '[^a-z0-9-]+', '', 'g') as slug,
            CAST(rating AS float) as rating,
            CAST(review_count AS int) as "reviewCount",
            CONCAT(street_address, ', ', city, ', ', state) as address,
            website,
            phone,
            ROW_NUMBER() OVER (ORDER BY review_count DESC NULLS LAST, rating DESC NULLS LAST) as rank,
            (rating >= 4.5) as trending,
            'Premier medical spa offering advanced aesthetic treatments' as description
          FROM leads
          WHERE source_directory = ${`med_spas_${collection.replace(/ /g, '_')}_${state}`}
            AND business_name !~* 'sponsored'
          ORDER BY review_count DESC NULLS LAST, rating DESC NULLS LAST
          LIMIT 50
        `;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('[directory] sample ratings:', businesses.slice(0, 10).map((b: any) => ({ n: b.name, r: b.rating, rc: b.reviewCount })));
      }
      const payload: any = { businesses };
      if (debug === '1') {
        payload.debugSample = businesses.slice(0, 10).map((b: any) => ({ name: b.name, rating: b.rating, reviewCount: b.reviewCount }));
      }
      return NextResponse.json(payload);
    } else if (state && collection) {
      // Get niches for a collection - for now just med spas
      const topBusinesses = await sql`
        SELECT 
          business_name as name
        FROM leads
        WHERE source_directory = ${`med_spas_${collection.replace(/ /g, '_')}_${state}`}
        ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST
        LIMIT 3
      `;
      
      const avgRating = await sql`
        SELECT AVG(rating) as avg_rating
        FROM leads
        WHERE source_directory = ${`med_spas_${collection.replace(/ /g, '_')}_${state}`}
          AND rating IS NOT NULL
      `;
      
      return NextResponse.json({ 
        niches: [{
          niche: 'medspas',
          displayName: 'Medical Spas',
          businessCount: await getBusinessCount(state, collection),
          averageRating: Number(avgRating[0]?.avg_rating || 4.5).toFixed(1),
          topBusinesses: topBusinesses.map(b => b.name),
          icon: '💉'
        }]
      });
    } else if (state) {
      // Get all collections for a state
      const result = await sql`
        SELECT 
          source_directory,
          COUNT(*) as count
        FROM leads
        WHERE source_directory LIKE ${'%_' + state}
        GROUP BY source_directory
        ORDER BY count DESC
      `;
      
      const collections = result.map(row => {
        // Extract collection name from source_directory
        // Format: med_spas_Collection_Name_STATE
        const parts = row.source_directory.split('_');
        // Remove 'med_spas' prefix and state suffix
        const collectionParts = parts.slice(2, -1);
        const collectionName = collectionParts.map((p: string) => 
          p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        ).join(' ');
        
        return {
          collection: collectionName,
          businessCount: Number(row.count),
          niche: 'medspas'
        };
      });
      
      return NextResponse.json({ collections });
    } else {
      // Get all states with collections
      const result = await sql`
        SELECT 
          SUBSTRING(source_directory FROM '([A-Z]{2})$') as state,
          COUNT(DISTINCT source_directory) as collection_count,
          COUNT(*) as business_count
        FROM leads
        WHERE source_directory IS NOT NULL
        GROUP BY SUBSTRING(source_directory FROM '([A-Z]{2})$')
        HAVING SUBSTRING(source_directory FROM '([A-Z]{2})$') IS NOT NULL
        ORDER BY business_count DESC
      `;
      
      const states = result.map(row => ({
        code: row.state,
        name: getStateName(row.state),
        cities: Number(row.collection_count), // Using collections as "cities" for display
        businesses: Number(row.business_count),
        featured: ['TX', 'CA', 'FL'].includes(row.state)
      }));
      
      return NextResponse.json({ states, featured: [] });
    }
  } catch (error) {
    console.error('Directory API error:', error);
    return NextResponse.json({ error: 'Failed to fetch directory data' }, { status: 500 });
  }
}

async function getBusinessCount(state: string, collection: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM leads
    WHERE source_directory = ${`med_spas_${collection.replace(/ /g, '_')}_${state}`}
  `;
  return Number(result[0].count);
}

function getStateName(code: string): string {
  const states: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  };
  return states[code] || code;
}