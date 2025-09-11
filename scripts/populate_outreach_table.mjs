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

async function populateOutreachTable() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Populating outreach_prospects table from existing data...\n');
  
  try {
    // First, check what data we have in existing tables
    console.log('📊 Checking existing data sources...');
    
    const leadCount = await sql`SELECT COUNT(*) as count FROM leads`;
    console.log(`   - leads table: ${leadCount[0].count} records`);
    
    const prospectCount = await sql`SELECT COUNT(*) as count FROM prospects`;
    console.log(`   - prospects table: ${prospectCount[0].count} records`);
    
    const competitorCount = await sql`SELECT COUNT(*) as count FROM competitor_searches`;
    console.log(`   - competitor_searches table: ${competitorCount[0].count} records\n`);
    
    // 1. Import from leads table (main source)
    console.log('📥 Importing from leads table...');
    const leadsInserted = await sql`
      INSERT INTO outreach_prospects (
        business_name,
        website,
        primary_email,
        email_type,
        phone,
        address,
        city,
        state,
        place_id,
        google_rating,
        review_count,
        ai_intelligence,
        data_source,
        created_at,
        campaign_status,
        priority_score,
        decision_maker_name
      )
      SELECT 
        l.business_name,
        l.website,
        l.email as primary_email,
        CASE 
          WHEN l.email LIKE '%@%' THEN 
            CASE 
              WHEN l.email LIKE 'info@%' OR l.email LIKE 'contact@%' OR l.email LIKE 'hello@%' OR l.email LIKE 'admin@%' THEN 'Generic'
              WHEN l.email LIKE '%gmail.com' OR l.email LIKE '%yahoo.com' OR l.email LIKE '%hotmail.com' THEN 'Personal'
              ELSE 'Business'
            END
          ELSE NULL 
        END as email_type,
        l.phone,
        l.street_address as address,
        l.city,
        l.state,
        l.place_id,
        l.rating::DECIMAL(2,1) as google_rating,
        l.review_count,
        cs.ai_intelligence,
        'Leads Table' as data_source,
        l.created_at,
        'Not Started' as campaign_status,
        CASE 
          WHEN l.rating >= 4.5 AND l.review_count < 50 THEN 90  -- High rating but low reviews = opportunity
          WHEN l.rating < 4.0 THEN 85  -- Low rating = reputation opportunity
          WHEN l.review_count < 20 THEN 80  -- Very few reviews = growth opportunity
          WHEN cs.ai_intelligence IS NOT NULL THEN 75  -- Has AI data
          ELSE 50  -- Default
        END as priority_score,
        COALESCE(l.owner_name, l.medical_director_name) as decision_maker_name
      FROM leads l
      LEFT JOIN competitor_searches cs ON l.place_id = cs.target_business_place_id
      WHERE l.place_id IS NOT NULL
      ON CONFLICT (place_id) 
      DO UPDATE SET
        website = COALESCE(EXCLUDED.website, outreach_prospects.website),
        primary_email = COALESCE(EXCLUDED.primary_email, outreach_prospects.primary_email),
        phone = COALESCE(EXCLUDED.phone, outreach_prospects.phone),
        google_rating = EXCLUDED.google_rating,
        review_count = EXCLUDED.review_count,
        ai_intelligence = COALESCE(EXCLUDED.ai_intelligence, outreach_prospects.ai_intelligence),
        decision_maker_name = COALESCE(EXCLUDED.decision_maker_name, outreach_prospects.decision_maker_name),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    console.log(`✅ Imported/Updated ${leadsInserted.length} records from leads\n`);
    
    // 2. Import from prospects table (additional data)
    console.log('📥 Importing from prospects table...');
    const prospectsInserted = await sql`
      INSERT INTO outreach_prospects (
        business_name,
        website,
        primary_email,
        email_type,
        phone,
        address,
        city,
        state,
        place_id,
        google_rating,
        review_count,
        data_source,
        created_at,
        campaign_status,
        priority_score
      )
      SELECT 
        p.business_name,
        p.website,
        p.email,
        CASE 
          WHEN p.email LIKE 'info@%' OR p.email LIKE 'contact@%' THEN 'Generic'
          WHEN p.email LIKE '%@%' THEN 'Unknown'
          ELSE NULL 
        END as email_type,
        p.phone,
        p.street_address as address,
        p.city,
        p.state,
        p.place_id,
        p.rating::DECIMAL(2,1),
        p.review_count,
        'Prospects Table' as data_source,
        p.created_at,
        'Not Started' as campaign_status,
        CASE 
          WHEN p.rating >= 4.5 AND p.review_count < 50 THEN 85
          WHEN p.rating < 4.0 THEN 80
          WHEN p.review_count < 20 THEN 75
          ELSE 50
        END as priority_score
      FROM prospects p
      WHERE p.place_id IS NOT NULL
      AND p.place_id NOT IN (SELECT place_id FROM outreach_prospects WHERE place_id IS NOT NULL)
      RETURNING id
    `;
    console.log(`✅ Imported ${prospectsInserted.length} new records from prospects\n`);
    
    // 3. Update with competitor intelligence
    console.log('📥 Adding competitor intelligence...');
    const competitorUpdates = await sql`
      UPDATE outreach_prospects op
      SET 
        ai_intelligence = COALESCE(op.ai_intelligence, cs.ai_intelligence),
        updated_at = CURRENT_TIMESTAMP
      FROM competitor_searches cs
      WHERE op.place_id = cs.target_business_place_id
      AND cs.ai_intelligence IS NOT NULL
      RETURNING op.id
    `;
    console.log(`✅ Updated ${competitorUpdates.length} records with AI intelligence data\n`);
    
    // 4. Extract and set pain points from AI intelligence
    console.log('🤖 Extracting pain points from AI intelligence...');
    const painPointUpdates = await sql`
      UPDATE outreach_prospects
      SET 
        pain_points = ARRAY[
          CASE WHEN google_rating < 4.0 THEN 'Low Google rating affecting visibility' ELSE NULL END,
          CASE WHEN review_count < 20 THEN 'Insufficient reviews for credibility' ELSE NULL END,
          CASE WHEN review_count < 100 AND google_rating >= 4.0 THEN 'Good rating but needs more reviews' ELSE NULL END,
          CASE WHEN primary_email IS NULL THEN 'No direct contact method found' ELSE NULL END
        ]::TEXT[],
        opportunities = ARRAY[
          CASE WHEN google_rating < 4.0 THEN 'Reputation management campaign' ELSE NULL END,
          CASE WHEN review_count < 50 THEN 'Review generation strategy' ELSE NULL END,
          CASE WHEN website IS NULL THEN 'Website development needed' ELSE NULL END,
          'Local SEO optimization',
          'Google Maps dominance strategy'
        ]::TEXT[]
      WHERE pain_points IS NULL
      RETURNING id
    `;
    console.log(`✅ Updated ${painPointUpdates.length} records with pain points\n`);
    
    // 5. Set industry/niche based on business name or existing data
    console.log('🏢 Setting industry classifications...');
    const industryUpdates = await sql`
      UPDATE outreach_prospects
      SET 
        industry = CASE
          WHEN LOWER(business_name) LIKE '%spa%' OR LOWER(business_name) LIKE '%aesthetic%' THEN 'Healthcare'
          WHEN LOWER(business_name) LIKE '%dental%' OR LOWER(business_name) LIKE '%dentist%' THEN 'Healthcare'
          WHEN LOWER(business_name) LIKE '%law%' OR LOWER(business_name) LIKE '%attorney%' THEN 'Legal'
          WHEN LOWER(business_name) LIKE '%restaurant%' OR LOWER(business_name) LIKE '%cafe%' THEN 'Food Service'
          WHEN LOWER(business_name) LIKE '%salon%' OR LOWER(business_name) LIKE '%barber%' THEN 'Beauty'
          WHEN LOWER(business_name) LIKE '%fitness%' OR LOWER(business_name) LIKE '%gym%' THEN 'Fitness'
          WHEN LOWER(business_name) LIKE '%plumb%' OR LOWER(business_name) LIKE '%hvac%' THEN 'Home Services'
          ELSE 'Other'
        END,
        niche = CASE
          WHEN LOWER(business_name) LIKE '%med%spa%' OR LOWER(business_name) LIKE '%medspa%' THEN 'Medical Spa'
          WHEN LOWER(business_name) LIKE '%aesthetic%' THEN 'Aesthetics'
          WHEN LOWER(business_name) LIKE '%dental%' THEN 'Dental'
          WHEN LOWER(business_name) LIKE '%orthodont%' THEN 'Orthodontics'
          WHEN LOWER(business_name) LIKE '%chiro%' THEN 'Chiropractic'
          ELSE NULL
        END
      WHERE industry IS NULL OR industry = 'Other'
      RETURNING id
    `;
    console.log(`✅ Updated ${industryUpdates.length} records with industry data\n`);
    
    // Get final statistics
    console.log('📊 Final Statistics:');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_prospects,
        COUNT(primary_email) as with_email,
        COUNT(phone) as with_phone,
        COUNT(website) as with_website,
        COUNT(ai_intelligence) as with_ai_data,
        AVG(priority_score) as avg_priority,
        COUNT(DISTINCT city) as unique_cities,
        COUNT(DISTINCT industry) as unique_industries
      FROM outreach_prospects
    `;
    
    const topCities = await sql`
      SELECT city, state, COUNT(*) as count 
      FROM outreach_prospects 
      WHERE city IS NOT NULL
      GROUP BY city, state 
      ORDER BY count DESC 
      LIMIT 5
    `;
    
    const topIndustries = await sql`
      SELECT industry, COUNT(*) as count 
      FROM outreach_prospects 
      WHERE industry IS NOT NULL
      GROUP BY industry 
      ORDER BY count DESC 
      LIMIT 5
    `;
    
    console.log(`\n✅ Database Population Complete!`);
    console.log(`   Total Prospects: ${stats[0].total_prospects}`);
    console.log(`   With Email: ${stats[0].with_email}`);
    console.log(`   With Phone: ${stats[0].with_phone}`);
    console.log(`   With Website: ${stats[0].with_website}`);
    console.log(`   With AI Data: ${stats[0].with_ai_data}`);
    console.log(`   Avg Priority Score: ${Math.round(stats[0].avg_priority)}`);
    console.log(`   Unique Cities: ${stats[0].unique_cities}`);
    console.log(`   Unique Industries: ${stats[0].unique_industries}`);
    
    console.log(`\n📍 Top Cities:`);
    topCities.forEach(c => {
      console.log(`   - ${c.city}, ${c.state}: ${c.count} prospects`);
    });
    
    console.log(`\n🏢 Top Industries:`);
    topIndustries.forEach(i => {
      console.log(`   - ${i.industry}: ${i.count} prospects`);
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Review prospects with high priority scores');
    console.log('   2. Create targeted campaigns by industry/city');
    console.log('   3. Start outreach to prospects with emails');
    
  } catch (error) {
    console.error('❌ Error populating table:', error.message);
    console.error(error);
    process.exit(1);
  }
}

populateOutreachTable();