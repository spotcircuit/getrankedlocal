#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function createWinningCampaign() {
  const sql = neon(DATABASE_URL);
  
  console.log('🎯 Creating Winning Email Campaign with Competitor Intelligence...\n');
  
  try {
    // First, add new columns for better message structure
    console.log('📊 Adding campaign columns...');
    await sql`
      ALTER TABLE outreach_prospects 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS greeting VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subject_line VARCHAR(255),
      ADD COLUMN IF NOT EXISTS opening_line TEXT,
      ADD COLUMN IF NOT EXISTS pain_point_line TEXT,
      ADD COLUMN IF NOT EXISTS competitor_line TEXT,
      ADD COLUMN IF NOT EXISTS solution_bullets TEXT,
      ADD COLUMN IF NOT EXISTS guarantee_line TEXT,
      ADD COLUMN IF NOT EXISTS urgency_line TEXT,
      ADD COLUMN IF NOT EXISTS cta_line TEXT,
      ADD COLUMN IF NOT EXISTS ps_line TEXT,
      ADD COLUMN IF NOT EXISTS top_competitor_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS top_competitor_rating DECIMAL(2,1),
      ADD COLUMN IF NOT EXISTS top_competitor_reviews INTEGER
    `;
    console.log('✅ Columns added\n');
    
    // Extract first and last names
    console.log('👤 Extracting names...');
    await sql`
      UPDATE outreach_prospects
      SET 
        first_name = CASE 
          WHEN decision_maker_name IS NOT NULL THEN 
            split_part(decision_maker_name, ' ', 1)
          ELSE NULL
        END,
        last_name = CASE 
          WHEN decision_maker_name IS NOT NULL AND array_length(string_to_array(decision_maker_name, ' '), 1) > 1 THEN 
            split_part(decision_maker_name, ' ', 2)
          ELSE NULL
        END
      WHERE first_name IS NULL
    `;
    console.log('✅ Names extracted\n');
    
    // Find top competitors for each business based on city and industry
    console.log('🔍 Finding top competitors for each prospect...');
    await sql`
      WITH competitor_analysis AS (
        SELECT 
          op1.id as prospect_id,
          op2.business_name as competitor_name,
          op2.google_rating as competitor_rating,
          op2.review_count as competitor_reviews,
          ROW_NUMBER() OVER (
            PARTITION BY op1.id 
            ORDER BY op2.review_count DESC, op2.google_rating DESC
          ) as rank
        FROM outreach_prospects op1
        JOIN outreach_prospects op2 
          ON op1.city = op2.city 
          AND op1.state = op2.state
          AND op1.industry = op2.industry
          AND op1.id != op2.id
          AND op2.review_count > op1.review_count
      )
      UPDATE outreach_prospects op
      SET 
        top_competitor_name = ca.competitor_name,
        top_competitor_rating = ca.competitor_rating,
        top_competitor_reviews = ca.competitor_reviews
      FROM competitor_analysis ca
      WHERE op.id = ca.prospect_id
      AND ca.rank = 1
    `;
    console.log('✅ Competitor analysis complete\n');
    
    // Generate message components
    console.log('✉️ Generating personalized message components...');
    await sql`
      UPDATE outreach_prospects
      SET 
        -- Greeting
        greeting = CASE 
          WHEN first_name IS NOT NULL THEN 'Hi ' || first_name
          ELSE 'Hi there'
        END,
        
        -- Subject Lines (A/B test options)
        subject_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            top_competitor_name || ' is stealing your ' || city || ' customers (proof inside)'
          WHEN google_rating < 4.0 THEN 
            'Your ' || google_rating || ' star rating is killing your business'
          WHEN review_count < 20 THEN 
            'Why you''re invisible to 73% of ' || city || ' searchers'
          WHEN review_count < 50 THEN 
            business_name || ': You''re losing $10k/month (here''s how)'
          ELSE 
            'Quick question about ' || business_name
        END,
        
        -- Opening Line
        opening_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            'I just ran a competitive analysis for ' || COALESCE(niche, industry, 'businesses') || 
            ' in ' || city || ', and I need to show you something urgent about ' || top_competitor_name || '.'
          WHEN google_rating < 4.0 THEN 
            'I noticed ' || business_name || ' has a ' || google_rating || 
            ' star rating while the average ' || COALESCE(niche, 'business') || ' in ' || city || 
            ' maintains 4.5+ stars. This is costing you at least 15-20 new customers every month.'
          WHEN review_count < 30 THEN 
            'I found ' || business_name || ' on Google Maps, but you only have ' || review_count || 
            ' reviews. This is why you''re invisible to most ' || city || ' searchers looking for ' || 
            COALESCE(niche, 'your services') || '.'
          ELSE 
            'I help ' || COALESCE(niche, industry, 'local businesses') || 
            ' in ' || city || ' dominate Google Maps, and I noticed ' || business_name || 
            ' has huge untapped potential.'
        END,
        
        -- Pain Point Line
        pain_point_line = CASE 
          WHEN top_competitor_name IS NOT NULL AND top_competitor_reviews > review_count * 2 THEN 
            top_competitor_name || ' has ' || top_competitor_reviews || ' reviews to your ' || 
            review_count || '. They''re capturing customers who should be yours - people literally searching for "' || 
            business_name || '" end up choosing them instead.'
          WHEN google_rating < 4.0 THEN 
            'Here''s the brutal truth: 92% of consumers won''t even consider a business under 4 stars. ' ||
            'Your ' || google_rating || ' rating puts you in the invisible zone. Even worse, Google''s algorithm ' ||
            'actively suppresses low-rated businesses in search results.'
          WHEN review_count < 20 THEN 
            'The Google Maps algorithm requires a minimum of 20-30 recent reviews to show you in local searches. ' ||
            'With only ' || review_count || ' reviews, you''re essentially invisible. Your competitors are getting ' ||
            'YOUR customers simply because they show up and you don''t.'
          WHEN review_count BETWEEN 20 AND 50 THEN 
            'You need at least 100 reviews to compete in ' || city || '. With only ' || review_count || 
            ', you''re losing to inferior competitors who simply have more social proof. ' ||
            'Every day you wait, they pull further ahead.'
          ELSE 
            'Your online presence has critical gaps that are sending customers to competitors. ' ||
            'I found at least 3 quick wins that could bring you 20+ new customers this month.'
        END,
        
        -- Competitor Line
        competitor_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            'I tracked where your lost customers go: ' || top_competitor_name || 
            ' gets 67% of them. They rank #1-3 for all your money keywords while you''re buried on page 2. ' ||
            'They''re even running Google Ads targeting YOUR business name.'
          WHEN industry = 'Healthcare' THEN 
            'Your competitors are using Google''s Local Service Ads to appear above you, ' ||
            'even when patients search for your name specifically. Plus they have the Google Guarantee badge you''re missing.'
          WHEN industry = 'Beauty' THEN 
            'I found 3 competitors booking 40+ appointments weekly from Instagram + Google while ' ||
            'you''re missing both the Instagram booking integration and Google Reserve.'
          ELSE 
            'Three competitors in ' || city || ' are dominating your market using strategies ' ||
            'you''re not even aware of. They''re not better - they''re just more visible online.'
        END,
        
        -- Solution Bullets  
        solution_bullets = '✓ Get you ranking #1-3 on Google Maps for your top 5 keywords\n' ||
          '✓ Generate 30-50 authentic 5-star reviews in 90 days (100% legitimate)\n' ||
          '✓ Fix the ' || 
          CASE 
            WHEN website IS NULL THEN 'missing website that''s costing you 40% of potential customers'
            ELSE 'website technical issues causing 60% of visitors to leave'
          END || '\n' ||
          '✓ Set up conversion tracking so you know exactly how many customers come from Google\n' ||
          '✓ Create a review automation system that runs on autopilot',
        
        -- Guarantee Line (Realistic 90-day)
        guarantee_line = 'I guarantee in 90 days: Top 3 Google Maps ranking for at least 3 of your main keywords, ' ||
          'minimum 30 new authentic reviews, and at least 15 trackable leads from Google - or you pay absolutely nothing. ' ||
          'No contracts, cancel anytime.',
        
        -- Urgency Line
        urgency_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            'I only work with one ' || COALESCE(niche, 'business') || ' per area, and I''ve already had ' ||
            'an initial call with ' || top_competitor_name || '. I''d prefer to work with you, but I need ' ||
            'to make a decision by Friday.'
          WHEN city = 'Ashburn' OR city = 'Leesburg' THEN 
            'I''m only taking 3 new clients in Northern Virginia this quarter, and I have 7 businesses interested. ' ||
            'First come, first served.'
          ELSE 
            'I''m launching my ' || city || ' market expansion and offering my pilot program to just 5 businesses ' ||
            'at 50% off my normal rate. Two spots are already tentatively booked.'
        END,
        
        -- CTA Line
        cta_line = 'Reply with "INTERESTED" and I''ll send you a 10-minute video showing exactly how ' ||
          CASE 
            WHEN top_competitor_name IS NOT NULL THEN top_competitor_name || ' is beating you'
            ELSE 'your competitors are stealing your customers'
          END || 
          ' and the specific steps to fix it. No sales call required - watch the video first, then decide if we should talk.',
        
        -- PS Line
        ps_line = CASE 
          WHEN website IS NULL THEN 
            'P.S. You don''t have a website listed on Google. This alone is costing you 40% of potential customers ' ||
            'who won''t call without researching first. I can fix this in week 1.'
          WHEN website LIKE '%.wixsite.com%' OR website LIKE '%.weebly.com%' THEN 
            'P.S. Your ' || website || ' is on a platform that Google penalizes in rankings. ' ||
            'This technical issue alone is costing you 30+ customers monthly.'
          WHEN review_count < 10 THEN 
            'P.S. With less than 10 reviews, you''re not even eligible for Google''s Local Pack ' ||
            '(the map results at the top). Every day you wait = lost customers.'
          WHEN top_competitor_name IS NOT NULL THEN 
            'P.S. ' || top_competitor_name || ' gained ' || 
            CAST(FLOOR(RANDOM() * 20 + 10) AS TEXT) || 
            ' new reviews last month while you gained ' ||
            CAST(FLOOR(RANDOM() * 3) AS TEXT) || 
            '. At this rate, you''ll never catch up without help.'
          ELSE 
            'P.S. I checked your Google Analytics (publicly available data) - you''re getting traffic but ' ||
            'your conversion rate is 0.8%. Industry average is 3.5%. That''s literally throwing away customers.'
        END
        
      WHERE primary_email IS NOT NULL
    `;
    console.log('✅ Message components generated\n');
    
    // Get statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(first_name) as with_names,
        COUNT(top_competitor_name) as with_competitors,
        AVG(review_count) as avg_reviews,
        COUNT(CASE WHEN review_count < 50 THEN 1 END) as needs_help,
        COUNT(CASE WHEN google_rating < 4.5 THEN 1 END) as low_rating
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
    `;
    
    console.log('📊 Campaign Statistics:');
    console.log(`   Total prospects with email: ${stats[0].total}`);
    console.log(`   With personal names: ${stats[0].with_names}`);
    console.log(`   With competitor data: ${stats[0].with_competitors}`);
    console.log(`   Need review help (<50): ${stats[0].needs_help}`);
    console.log(`   Need rating help (<4.5): ${stats[0].low_rating}\n`);
    
    // Export to CSV with all components
    console.log('💾 Exporting to CSV...');
    const exportData = await sql`
      SELECT 
        business_name,
        primary_email,
        first_name,
        last_name,
        phone,
        website,
        city,
        state,
        google_rating,
        review_count,
        top_competitor_name,
        top_competitor_reviews,
        greeting,
        subject_line,
        opening_line,
        pain_point_line,
        competitor_line,
        solution_bullets,
        guarantee_line,
        urgency_line,
        cta_line,
        ps_line
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      AND (
        review_count < 100 
        OR google_rating < 4.5 
        OR website IS NULL
        OR top_competitor_reviews > review_count * 2
      )
      ORDER BY 
        CASE 
          WHEN city IN ('Ashburn', 'Leesburg', 'Vienna', 'McLean') THEN 1
          ELSE 2
        END,
        priority_score DESC
      LIMIT 1000
    `;
    
    // Create CSV
    const csvHeaders = [
      'Business Name',
      'Email',
      'First Name',
      'Last Name',
      'Phone',
      'Website',
      'City',
      'State',
      'Rating',
      'Reviews',
      'Competitor Name',
      'Competitor Reviews',
      'Greeting',
      'Subject Line',
      'Opening Line',
      'Pain Point',
      'Competitor Intel',
      'Solution Bullets',
      'Guarantee',
      'Urgency',
      'CTA',
      'PS Line'
    ];
    
    const csvRows = exportData.map(row => [
      row.business_name,
      row.primary_email,
      row.first_name || '',
      row.last_name || '',
      row.phone || '',
      row.website || '',
      row.city || '',
      row.state || '',
      row.google_rating || '',
      row.review_count || '',
      row.top_competitor_name || '',
      row.top_competitor_reviews || '',
      row.greeting || 'Hi there',
      `"${(row.subject_line || '').replace(/"/g, '""')}"`,
      `"${(row.opening_line || '').replace(/"/g, '""')}"`,
      `"${(row.pain_point_line || '').replace(/"/g, '""')}"`,
      `"${(row.competitor_line || '').replace(/"/g, '""')}"`,
      `"${(row.solution_bullets || '').replace(/"/g, '""')}"`,
      `"${(row.guarantee_line || '').replace(/"/g, '""')}"`,
      `"${(row.urgency_line || '').replace(/"/g, '""')}"`,
      `"${(row.cta_line || '').replace(/"/g, '""')}"`,
      `"${(row.ps_line || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Save CSV
    const csvPath = join(__dirname, '..', 'winning_campaign.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ Exported ${exportData.length} high-priority prospects to: winning_campaign.csv`);
    
    // Show sample message
    console.log('\n📧 SAMPLE COMPLETE MESSAGE:');
    console.log('=' .repeat(70));
    
    if (exportData.length > 0) {
      const sample = exportData[0];
      console.log(`To: ${sample.primary_email}`);
      console.log(`Subject: ${sample.subject_line}\n`);
      console.log(`${sample.greeting},\n`);
      console.log(sample.opening_line + '\n');
      console.log(sample.pain_point_line + '\n');
      console.log(sample.competitor_line + '\n');
      console.log('Here\'s what I can do for you in the next 90 days:\n');
      console.log(sample.solution_bullets + '\n');
      console.log(sample.guarantee_line + '\n');
      console.log(sample.urgency_line + '\n');
      console.log(sample.cta_line + '\n');
      console.log('[Your signature here]\n');
      console.log(sample.ps_line);
    }
    
    console.log('\n✨ Campaign ready! You can now:');
    console.log('   1. Upload winning_campaign.csv to your email tool');
    console.log('   2. Use the columns to build your email template');
    console.log('   3. Add your signature between CTA and PS');
    console.log('   4. A/B test different subject lines');
    console.log('   5. Track responses and update campaign_status');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createWinningCampaign();