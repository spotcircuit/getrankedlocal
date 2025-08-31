#!/usr/bin/env node

/**
 * Fix the competitors table by dropping and recreating with proper schema
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Try to read from .env file
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

// Create neon client
const sql = neon(connectionString);

async function fixCompetitorsTable() {
  try {
    console.log('🔧 Fixing competitors table...\n');

    // Drop the old competitors table
    console.log('Dropping old competitors table...');
    await sql`DROP TABLE IF EXISTS search_competitors CASCADE`;
    await sql`DROP TABLE IF EXISTS competitors CASCADE`;
    
    // Create new competitors table with correct schema
    console.log('Creating new competitors table with all columns...');
    await sql`
      CREATE TABLE competitors (
        place_id VARCHAR(255) PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        rating DECIMAL(2,1),
        review_count INTEGER,
        street_address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        phone VARCHAR(50),
        website VARCHAR(255),
        search_city VARCHAR(100),
        search_niche VARCHAR(100),
        source_directory VARCHAR(100),
        enrichment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX idx_competitors_business_name ON competitors(business_name)`;
    await sql`CREATE INDEX idx_competitors_city ON competitors(city)`;
    await sql`CREATE INDEX idx_competitors_search_city ON competitors(search_city)`;
    await sql`CREATE INDEX idx_competitors_enrichment_status ON competitors(enrichment_status)`;
    
    // Create junction table
    console.log('Creating search_competitors junction table...');
    await sql`
      CREATE TABLE search_competitors (
        search_id INTEGER,
        competitor_place_id VARCHAR(255),
        rank INTEGER,
        is_target_business BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (search_id, competitor_place_id)
      )
    `;
    
    await sql`CREATE INDEX idx_search_competitors_search ON search_competitors(search_id)`;
    await sql`CREATE INDEX idx_search_competitors_place ON search_competitors(competitor_place_id)`;
    
    console.log('✅ Competitors table fixed successfully!\n');
    console.log('Now run: node scripts/process-search-results.js');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixCompetitorsTable();