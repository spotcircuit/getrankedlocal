#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function setupDatabase() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Setting up outreach database tables...\n');
  
  try {
    // Create outreach_prospects table
    console.log('Creating outreach_prospects table...');
    await sql`
      CREATE TABLE IF NOT EXISTS outreach_prospects (
        id SERIAL PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        industry VARCHAR(100),
        niche VARCHAR(100),
        
        -- Contact Information
        primary_email VARCHAR(255),
        email_type VARCHAR(50),
        decision_maker_name VARCHAR(255),
        decision_maker_title VARCHAR(255),
        decision_maker_email VARCHAR(255),
        phone VARCHAR(50),
        
        -- Location
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        
        -- Google Data
        place_id VARCHAR(255) UNIQUE,
        google_rating DECIMAL(2, 1),
        review_count INTEGER,
        
        -- Performance Metrics
        grid_coverage_percent DECIMAL(5, 2),
        avg_ranking DECIMAL(4, 2),
        top3_count INTEGER,
        running_google_ads BOOLEAN DEFAULT FALSE,
        running_meta_ads BOOLEAN DEFAULT FALSE,
        monthly_search_volume INTEGER,
        competition_level VARCHAR(20),
        
        -- Campaign Tracking
        campaign_status VARCHAR(50) DEFAULT 'Not Started',
        last_contact_date TIMESTAMP,
        last_email_sent TEXT,
        total_emails_sent INTEGER DEFAULT 0,
        email_opens INTEGER DEFAULT 0,
        email_clicks INTEGER DEFAULT 0,
        
        -- Response Tracking
        response_status VARCHAR(50),
        response_text TEXT,
        follow_up_date DATE,
        follow_up_count INTEGER DEFAULT 0,
        
        -- AI Intelligence
        ai_intelligence JSONB,
        competitor_intel JSONB,
        pain_points TEXT[],
        opportunities TEXT[],
        
        -- Metadata
        data_source VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        tags TEXT[],
        priority_score INTEGER
      )
    `;
    console.log('✅ outreach_prospects table created\n');
    
    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_op_campaign_status ON outreach_prospects(campaign_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_op_city_state ON outreach_prospects(city, state)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_op_industry ON outreach_prospects(industry)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_op_priority ON outreach_prospects(priority_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_op_follow_up ON outreach_prospects(follow_up_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_op_place_id ON outreach_prospects(place_id)`;
    console.log('✅ Indexes created\n');
    
    // Create outreach_campaigns table
    console.log('Creating outreach_campaigns table...');
    await sql`
      CREATE TABLE IF NOT EXISTS outreach_campaigns (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(100),
        industry_target VARCHAR(100),
        city_target VARCHAR(100),
        state_target VARCHAR(50),
        
        -- Campaign Content
        subject_lines TEXT[],
        email_templates TEXT[],
        value_proposition TEXT,
        offer_details TEXT,
        guarantee TEXT,
        
        -- Campaign Settings
        status VARCHAR(50) DEFAULT 'Draft',
        start_date DATE,
        end_date DATE,
        daily_send_limit INTEGER DEFAULT 50,
        
        -- Performance Metrics
        total_sent INTEGER DEFAULT 0,
        total_opens INTEGER DEFAULT 0,
        total_clicks INTEGER DEFAULT 0,
        total_replies INTEGER DEFAULT 0,
        total_meetings INTEGER DEFAULT 0,
        total_conversions INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ outreach_campaigns table created\n');
    
    // Create email history table
    console.log('Creating outreach_email_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS outreach_email_history (
        id SERIAL PRIMARY KEY,
        prospect_id INTEGER REFERENCES outreach_prospects(id),
        campaign_id INTEGER REFERENCES outreach_campaigns(id),
        
        -- Email Details
        email_to VARCHAR(255),
        email_from VARCHAR(255),
        subject_line TEXT,
        email_body TEXT,
        email_type VARCHAR(50),
        
        -- Tracking
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        replied_at TIMESTAMP,
        bounced_at TIMESTAMP,
        unsubscribed_at TIMESTAMP,
        
        -- Response
        response_received BOOLEAN DEFAULT FALSE,
        response_text TEXT,
        response_sentiment VARCHAR(20),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ outreach_email_history table created\n');
    
    // Check created tables
    console.log('📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'outreach%'
      ORDER BY table_name
    `;
    
    console.log('✅ Created tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Insert sample prospect
    console.log('\n📝 Inserting sample prospect...');
    await sql`
      INSERT INTO outreach_prospects (
        business_name,
        website,
        industry,
        niche,
        primary_email,
        email_type,
        city,
        state,
        google_rating,
        review_count,
        grid_coverage_percent,
        competition_level,
        campaign_status,
        pain_points,
        opportunities,
        data_source,
        priority_score
      ) VALUES (
        'Sample Medical Spa',
        'samplemedspa.com',
        'Healthcare',
        'Medical Spa',
        'info@samplemedspa.com',
        'Generic',
        'Ashburn',
        'VA',
        4.5,
        127,
        27.5,
        'High',
        'Not Started',
        ARRAY['Low map visibility', 'Competitor ads taking traffic'],
        ARRAY['Expand to new market', 'Dominate local searches'],
        'Manual Entry',
        85
      )
      ON CONFLICT (place_id) DO NOTHING
    `;
    
    // Count prospects
    const count = await sql`SELECT COUNT(*) as count FROM outreach_prospects`;
    console.log(`✅ Sample inserted. Total prospects: ${count[0].count}\n`);
    
    console.log('✨ Database setup complete!');
    console.log('📌 You can now:');
    console.log('   1. Import prospects from grid searches');
    console.log('   2. Create email campaigns');
    console.log('   3. Track outreach performance');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();