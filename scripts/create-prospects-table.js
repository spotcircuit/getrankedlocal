#!/usr/bin/env node

/**
 * Create prospects table - same schema as leads but for unenriched businesses
 * These are competitors found in searches that will eventually become leads after enrichment
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) {
      connectionString = match[1].trim();
    }
  } catch (e) {
    console.error('Could not read .env file');
  }
}

if (!connectionString) {
  throw new Error('DATABASE_URL not found in environment or .env file');
}

const sql = neon(connectionString);

async function createProspectsTable() {
  try {
    console.log('🚀 Creating prospects table...\n');

    // First, get the exact schema from leads table
    console.log('Getting leads table schema...');
    const leadColumns = await sql`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `;
    
    console.log(`Found ${leadColumns.length} columns in leads table\n`);

    // Drop old tables if they exist
    console.log('Dropping old tables if they exist...');
    await sql`DROP TABLE IF EXISTS search_prospects CASCADE`;
    await sql`DROP TABLE IF EXISTS prospects CASCADE`;
    
    // Create prospects table with same schema as leads but place_id as PRIMARY KEY
    console.log('Creating prospects table...');
    await sql`
      CREATE TABLE prospects (
        -- Use place_id as primary key for deduplication
        place_id VARCHAR(255) PRIMARY KEY,
        
        -- Basic business information (from search results)
        business_name VARCHAR(255) NOT NULL,
        rating DECIMAL(2,1),
        review_count INTEGER,
        street_address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        website VARCHAR(255),
        phone VARCHAR(50),
        
        -- Decision maker info (NULL until enriched)
        owner_name VARCHAR(255),
        owner_first_name VARCHAR(100),
        owner_last_name VARCHAR(100),
        medical_director_name VARCHAR(255),
        medical_director_first_name VARCHAR(100),
        medical_director_last_name VARCHAR(100),
        
        -- Contact info (NULL until enriched)
        email VARCHAR(255),
        email_type VARCHAR(50),
        additional_emails TEXT[],
        additional_phones TEXT[],
        
        -- AI Intelligence (NULL until enriched)
        domain VARCHAR(255),
        ai_extraction_timestamp TIMESTAMP,
        
        -- Pricing info (NULL until enriched)
        pricing_botox VARCHAR(100),
        pricing_filler VARCHAR(100),
        pricing_membership VARCHAR(100),
        
        -- Social media (NULL until enriched)
        instagram_handle VARCHAR(100),
        facebook_handle VARCHAR(100),
        twitter_handle VARCHAR(100),
        tiktok_handle VARCHAR(100),
        youtube_handle VARCHAR(100),
        instagram_followers VARCHAR(50),
        facebook_followers VARCHAR(50),
        
        -- Search context (from which searches this was found)
        search_city VARCHAR(100),
        search_state VARCHAR(50),
        search_niche VARCHAR(100),
        source_directory VARCHAR(255),
        
        -- Status tracking
        enrichment_status VARCHAR(50) DEFAULT 'pending',
        enriched_at TIMESTAMP,
        lead_score INTEGER DEFAULT 0,
        email_enrichment_status VARCHAR(50) DEFAULT 'not_started',
        outreach_status VARCHAR(50) DEFAULT 'not_started',
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Flexible JSON field
        additional_data JSONB
      )
    `;
    
    // Create indexes for better performance
    console.log('Creating indexes...');
    await sql`CREATE INDEX idx_prospects_business_name ON prospects(business_name)`;
    await sql`CREATE INDEX idx_prospects_city ON prospects(city)`;
    await sql`CREATE INDEX idx_prospects_state ON prospects(state)`;
    await sql`CREATE INDEX idx_prospects_search_city ON prospects(search_city)`;
    await sql`CREATE INDEX idx_prospects_search_niche ON prospects(search_niche)`;
    await sql`CREATE INDEX idx_prospects_enrichment_status ON prospects(enrichment_status)`;
    await sql`CREATE INDEX idx_prospects_lead_score ON prospects(lead_score)`;
    
    // Create junction table to track which prospects were found in which searches
    console.log('Creating search_prospects junction table...');
    await sql`
      CREATE TABLE search_prospects (
        search_id INTEGER REFERENCES competitor_searches(id) ON DELETE CASCADE,
        prospect_place_id VARCHAR(255) REFERENCES prospects(place_id) ON DELETE CASCADE,
        rank INTEGER,
        is_target_business BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (search_id, prospect_place_id)
      )
    `;
    
    await sql`CREATE INDEX idx_search_prospects_search ON search_prospects(search_id)`;
    await sql`CREATE INDEX idx_search_prospects_place ON search_prospects(prospect_place_id)`;
    await sql`CREATE INDEX idx_search_prospects_rank ON search_prospects(rank)`;
    
    console.log('\n✅ Prospects table created successfully!');
    console.log('\nThis table will store:');
    console.log('  - Competitors found in searches (unenriched)');
    console.log('  - Deduplicated by place_id');
    console.log('  - Ready to be enriched and promoted to leads table');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createProspectsTable();