import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  console.log('\n🚀 Creating Grid Search Tables in Neon Database\n');
  console.log('='*60);
  
  try {
    // 1. Create grid_searches table
    console.log('Creating grid_searches table...');
    await sql`
      CREATE TABLE IF NOT EXISTS grid_searches (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        search_term VARCHAR(255) NOT NULL,
        center_lat DECIMAL(10, 7) NOT NULL,
        center_lng DECIMAL(10, 7) NOT NULL,
        search_radius_miles DECIMAL(4,2) DEFAULT 5.0,
        grid_size INTEGER DEFAULT 169,
        grid_rows INTEGER DEFAULT 13,
        grid_cols INTEGER DEFAULT 13,
        initiated_by_place_id VARCHAR(255),
        initiated_by_name VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        total_unique_businesses INTEGER,
        avg_businesses_per_point DECIMAL(5, 2),
        max_businesses_per_point INTEGER,
        min_businesses_per_point INTEGER,
        total_search_results INTEGER,
        execution_time_seconds INTEGER,
        success_rate DECIMAL(5, 2),
        api_calls_made INTEGER DEFAULT 169,
        session_id VARCHAR(100),
        user_id VARCHAR(255),
        raw_config JSONB
      )
    `;
    console.log('✅ grid_searches table created');

    // 2. Create grid_competitors table
    console.log('Creating grid_competitors table...');
    await sql`
      CREATE TABLE IF NOT EXISTS grid_competitors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
        place_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        rating DECIMAL(2, 1),
        reviews INTEGER,
        price_level INTEGER,
        business_type VARCHAR(255),
        business_lat DECIMAL(10, 7),
        business_lng DECIMAL(10, 7),
        address VARCHAR(500),
        appearances INTEGER,
        coverage_percent DECIMAL(5, 2),
        avg_rank DECIMAL(5, 2),
        best_rank INTEGER,
        worst_rank INTEGER,
        median_rank INTEGER,
        rank_std_dev DECIMAL(5, 2),
        top_3_count INTEGER,
        top_10_count INTEGER,
        first_place_count INTEGER,
        north_appearances INTEGER,
        south_appearances INTEGER,
        east_appearances INTEGER,
        west_appearances INTEGER,
        center_appearances INTEGER,
        avg_competition_faced DECIMAL(5, 2),
        CONSTRAINT unique_competitor_per_search UNIQUE(search_id, place_id)
      )
    `;
    console.log('✅ grid_competitors table created');

    // 3. Create grid_point_results table
    console.log('Creating grid_point_results table...');
    await sql`
      CREATE TABLE IF NOT EXISTS grid_point_results (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
        competitor_id UUID REFERENCES grid_competitors(id) ON DELETE CASCADE,
        grid_row INTEGER NOT NULL,
        grid_col INTEGER NOT NULL,
        grid_index INTEGER NOT NULL,
        lat DECIMAL(10, 7) NOT NULL,
        lng DECIMAL(10, 7) NOT NULL,
        rank_position INTEGER NOT NULL,
        total_results_at_point INTEGER,
        distance_from_center_miles DECIMAL(5, 2),
        distance_from_business_miles DECIMAL(5, 2),
        is_sponsored BOOLEAN DEFAULT FALSE,
        CONSTRAINT unique_grid_point_result UNIQUE(search_id, grid_row, grid_col, competitor_id)
      )
    `;
    console.log('✅ grid_point_results table created');

    // 4. Create competitor_summaries table
    console.log('Creating competitor_summaries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS competitor_summaries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        place_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        total_searches_appeared INTEGER DEFAULT 0,
        total_grid_points_appeared INTEGER DEFAULT 0,
        overall_avg_rank DECIMAL(5, 2),
        overall_avg_coverage DECIMAL(5, 2),
        overall_best_rank INTEGER,
        overall_worst_rank INTEGER,
        coverage_trend VARCHAR(20),
        rank_trend VARCHAR(20),
        dominant_search_terms TEXT[],
        weak_search_terms TEXT[],
        first_seen_date DATE,
        last_seen_date DATE,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        prospect_id UUID,
        lead_id UUID,
        latest_rating DECIMAL(2, 1),
        latest_reviews INTEGER,
        latest_address VARCHAR(500),
        business_lat DECIMAL(10, 7),
        business_lng DECIMAL(10, 7)
      )
    `;
    console.log('✅ competitor_summaries table created');

    // 5. Create grid_cells table
    console.log('Creating grid_cells table...');
    await sql`
      CREATE TABLE IF NOT EXISTS grid_cells (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        search_id UUID REFERENCES grid_searches(id) ON DELETE CASCADE,
        grid_row INTEGER NOT NULL,
        grid_col INTEGER NOT NULL,
        lat DECIMAL(10, 7) NOT NULL,
        lng DECIMAL(10, 7) NOT NULL,
        total_businesses INTEGER,
        competition_level VARCHAR(20),
        top_3_competitors JSONB,
        distance_from_center_miles DECIMAL(5, 2),
        quadrant VARCHAR(10),
        CONSTRAINT unique_grid_cell UNIQUE(search_id, grid_row, grid_col)
      )
    `;
    console.log('✅ grid_cells table created');

    // Create indexes
    console.log('\nCreating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_searches_created ON grid_searches(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_searches_term ON grid_searches(search_term)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_searches_location ON grid_searches(center_lat, center_lng)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_search ON grid_competitors(search_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_place_id ON grid_competitors(place_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_coverage ON grid_competitors(coverage_percent DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_competitors_avg_rank ON grid_competitors(avg_rank)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_points_search ON grid_point_results(search_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_points_competitor ON grid_point_results(competitor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_points_location ON grid_point_results(grid_row, grid_col)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grid_points_rank ON grid_point_results(rank_position)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_summaries_place_id ON competitor_summaries(place_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_summaries_name ON competitor_summaries(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_summaries_coverage ON competitor_summaries(overall_avg_coverage DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_cells_search ON grid_cells(search_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cells_location ON grid_cells(grid_row, grid_col)`;
    
    console.log('✅ All indexes created');

    // Verify tables
    console.log('\n📊 Verifying tables:');
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('grid_searches', 'grid_competitors', 'grid_point_results', 'competitor_summaries', 'grid_cells')
      ORDER BY tablename
    `;
    
    console.log('\nTables in database:');
    tables.forEach(t => console.log(`  ✓ ${t.tablename}`));
    
    console.log('\n' + '='*60);
    console.log('🎉 All 5 grid search tables created successfully!\n');
    console.log('Tables created:');
    console.log('  1. grid_searches - Main search records');
    console.log('  2. grid_competitors - All businesses found');
    console.log('  3. grid_point_results - Business rankings at each grid point');
    console.log('  4. competitor_summaries - Aggregated business statistics');
    console.log('  5. grid_cells - Grid cell metadata');
    console.log('\nDatabase is ready to store grid search data!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    process.exit();
  }
}

createTables();