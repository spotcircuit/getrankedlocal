import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      // Lead contact info
      businessName, 
      name, 
      email, 
      phone, 
      website,
      // Searched business context
      searchedBusinessId,  // ID from leads table
      searchedPlaceId,     // place_id of the business they searched
      currentRank,
      monthlyLoss,
      topCompetitors,
      city,
      state,
      niche
    } = data;
    
    console.log('Enhanced lead captured with business context:', {
      businessName,
      name,
      email,
      searchedPlaceId,
      currentRank,
      timestamp: new Date().toISOString()
    });
    
    // If database URL is configured, store in database
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      try {
        const sql = neon(databaseUrl);
        
        // First, ensure the leads_captured table has the new columns
        await sql`
          ALTER TABLE leads_captured 
          ADD COLUMN IF NOT EXISTS searched_place_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS searched_business_id INTEGER,
          ADD COLUMN IF NOT EXISTS shown_rank INTEGER,
          ADD COLUMN IF NOT EXISTS shown_monthly_loss DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS shown_competitors JSONB,
          ADD COLUMN IF NOT EXISTS search_city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS search_state VARCHAR(50),
          ADD COLUMN IF NOT EXISTS search_niche VARCHAR(100)
        `;
        
        // Add foreign key constraint to leads table if not exists
        await sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'fk_searched_business'
            ) THEN
              ALTER TABLE leads_captured 
              ADD CONSTRAINT fk_searched_business 
              FOREIGN KEY (searched_business_id) 
              REFERENCES leads(id);
            END IF;
          END $$;
        `;
        
        // Look up the business ID from leads table if we have place_id
        let businessId = searchedBusinessId;
        if (!businessId && searchedPlaceId) {
          const result = await sql`
            SELECT id FROM leads 
            WHERE place_id = ${searchedPlaceId}
            LIMIT 1
          `;
          businessId = result[0]?.id || null;
        }
        
        // Insert the enhanced lead capture
        const insertResult = await sql`
          INSERT INTO leads_captured (
            business_name, 
            contact_name, 
            email, 
            phone, 
            website,
            searched_place_id,
            searched_business_id,
            shown_rank,
            shown_monthly_loss,
            shown_competitors,
            search_city,
            search_state,
            search_niche,
            page_url,
            source
          ) VALUES (
            ${businessName}, 
            ${name}, 
            ${email}, 
            ${phone}, 
            ${website || null},
            ${searchedPlaceId || null},
            ${businessId || null},
            ${currentRank || null},
            ${monthlyLoss || null},
            ${topCompetitors ? JSON.stringify(topCompetitors) : null},
            ${city || null},
            ${state || null},
            ${niche || null},
            ${req.headers.get('referer') || null},
            'results_page'
          )
          RETURNING id
        `;
        
        console.log('Enhanced lead stored with ID:', insertResult[0].id);
        console.log('Linked to searched business:', businessId ? `ID ${businessId}` : 'No link');
        
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError);
        // Continue even if database fails - we don't want to lose the lead
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead captured successfully with business context' 
    });
    
  } catch (error) {
    console.error('Error capturing enhanced lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve leads with their searched business context
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId');
    const email = searchParams.get('email');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not configured' 
      }, { status: 500 });
    }
    
    const sql = neon(databaseUrl);
    
    let query;
    if (placeId) {
      // Get all leads interested in a specific business
      query = sql`
        SELECT 
          lc.*,
          l.business_name as searched_business_name,
          l.rating as searched_business_rating,
          l.review_count as searched_business_reviews
        FROM leads_captured lc
        LEFT JOIN leads l ON lc.searched_business_id = l.id
        WHERE lc.searched_place_id = ${placeId}
        ORDER BY lc.captured_at DESC
      `;
    } else if (email) {
      // Get all submissions from a specific email
      query = sql`
        SELECT 
          lc.*,
          l.business_name as searched_business_name,
          l.rating as searched_business_rating,
          l.review_count as searched_business_reviews
        FROM leads_captured lc
        LEFT JOIN leads l ON lc.searched_business_id = l.id
        WHERE lc.email = ${email}
        ORDER BY lc.captured_at DESC
      `;
    } else {
      // Get recent leads with context
      query = sql`
        SELECT 
          lc.*,
          l.business_name as searched_business_name,
          l.rating as searched_business_rating,
          l.review_count as searched_business_reviews,
          l.city as searched_business_city,
          l.state as searched_business_state
        FROM leads_captured lc
        LEFT JOIN leads l ON lc.searched_business_id = l.id
        ORDER BY lc.captured_at DESC
        LIMIT 100
      `;
    }
    
    const results = await query;
    
    return NextResponse.json({ 
      success: true, 
      leads: results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}