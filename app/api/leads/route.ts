import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { businessName, name, email, phone, website } = data;
    
    // For now, just log the lead data
    console.log('Lead captured:', {
      businessName,
      name,
      email,
      phone,
      website,
      timestamp: new Date().toISOString()
    });
    
    // If database URL is configured, store in database
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      try {
        const sql = neon(databaseUrl);
        
        // Check if leads_captured table exists, if not create it
        await sql`
          CREATE TABLE IF NOT EXISTS leads_captured (
            id SERIAL PRIMARY KEY,
            business_name VARCHAR(255),
            contact_name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            website VARCHAR(255),
            captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            page_url TEXT,
            source VARCHAR(50) DEFAULT 'sales_funnel'
          )
        `;
        
        // Insert the lead
        await sql`
          INSERT INTO leads_captured (
            business_name, contact_name, email, phone, website
          ) VALUES (
            ${businessName}, ${name}, ${email}, ${phone}, ${website || null}
          )
        `;
        
        console.log('Lead stored in database');
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError);
        // Continue even if database fails - we don't want to lose the lead
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead captured successfully' 
    });
    
  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Lead capture API endpoint' 
  });
}