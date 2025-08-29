const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

loadEnv();

async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  
  try {
    console.log('🚀 Initializing competitor database schema...');
    
    // Create competitor_searches table
    await sql`
      CREATE TABLE IF NOT EXISTS competitor_searches (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) UNIQUE,
        search_term VARCHAR(255) NOT NULL,
        search_destination VARCHAR(255) NOT NULL,
        search_collection VARCHAR(255),
        target_business_name VARCHAR(255),
        target_business_place_id VARCHAR(255),
        target_business_rank INTEGER,
        total_competitors_found INTEGER,
        market_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created competitor_searches table');
    
    // Create indexes for competitor_searches
    await sql`CREATE INDEX IF NOT EXISTS idx_search_term ON competitor_searches(search_term)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_search_destination ON competitor_searches(search_destination)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_search_collection ON competitor_searches(search_collection)`;
    console.log('✅ Created indexes for competitor_searches');
    
    // Create competitors table
    await sql`
      CREATE TABLE IF NOT EXISTS competitors (
        id SERIAL PRIMARY KEY,
        search_id INTEGER REFERENCES competitor_searches(id) ON DELETE CASCADE,
        
        -- Core business data (matching lead database)
        place_id VARCHAR(255),
        business_name VARCHAR(255) NOT NULL,
        rank INTEGER,
        rating DECIMAL(2,1),
        review_count INTEGER,
        
        -- Location data (actual business location)
        street_address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        
        -- Additional fields
        phone VARCHAR(20),
        website VARCHAR(255),
        snippet TEXT,
        book_online_link VARCHAR(500),
        
        -- Search context
        search_destination VARCHAR(255),
        source_directory VARCHAR(255),
        is_top_3 BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Composite unique to prevent duplicates per search
        UNIQUE(search_id, place_id)
      )
    `;
    console.log('✅ Created competitors table');
    
    // Create indexes for competitors
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_place_id ON competitors(place_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_search ON competitors(search_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_rank ON competitors(rank)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_destination ON competitors(search_destination)`;
    console.log('✅ Created indexes for competitors');
    
    // Verify tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('competitor_searches', 'competitors')
      ORDER BY table_name
    `;
    
    console.log('\n📊 Database tables verified:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    console.log('\n✨ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();