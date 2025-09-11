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

async function createColdEmailCampaign() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Creating SHORT Cold Email Campaign...\n');
  
  try {
    // Add cold email specific columns
    console.log('📝 Adding cold email columns...');
    await sql`
      ALTER TABLE outreach_prospects 
      ADD COLUMN IF NOT EXISTS cold_subject VARCHAR(255),
      ADD COLUMN IF NOT EXISTS cold_message TEXT,
      ADD COLUMN IF NOT EXISTS cold_ps VARCHAR(500)
    `;
    console.log('✅ Columns added\n');
    
    // Generate SHORT cold email messages
    console.log('✉️ Generating short cold email messages...');
    await sql`
      UPDATE outreach_prospects
      SET 
        -- Short, punchy subject lines
        cold_subject = CASE 
          WHEN top_competitor_name IS NOT NULL AND top_competitor_reviews > review_count * 3 THEN 
            COALESCE(competitor_name_short, 'Your competitor') || ' has ' || top_competitor_reviews || ' reviews to your ' || review_count
          WHEN google_rating < 4.0 THEN 
            'Your ' || google_rating || ' rating is costing you customers'
          WHEN review_count < 20 THEN 
            'Quick question about ' || COALESCE(business_name_clean, business_name)
          WHEN review_count < 50 THEN 
            COALESCE(first_name, 'Hi') || ', found ' || COALESCE(business_name_clean, business_name) || ' on Google'
          ELSE 
            'Can I send you a case study?'
        END,
        
        -- Short cold email body (under 100 words)
        cold_message = 
          COALESCE(greeting, 'Hi there') || ',\n\n' ||
          
          -- Opening (1 line)
          CASE 
            WHEN top_competitor_name IS NOT NULL AND top_competitor_reviews > review_count * 2 THEN 
              'I noticed ' || COALESCE(business_name_clean, business_name) || ' has ' || review_count || 
              ' reviews while ' || COALESCE(competitor_name_short, 'your competitor') || ' has ' || top_competitor_reviews || '.\n\n'
            WHEN review_count < 20 THEN 
              'I found ' || COALESCE(business_name_clean, business_name) || 
              ' on Google Maps - you only have ' || review_count || ' reviews so you''re invisible to most searchers.\n\n'
            WHEN google_rating < 4.0 THEN 
              COALESCE(business_name_clean, business_name) || '''s ' || google_rating || 
              ' star rating is below Google''s visibility threshold.\n\n'
            ELSE 
              'I help ' || COALESCE(niche, industry, 'businesses') || ' in ' || COALESCE(city, 'your area') || 
              ' dominate Google Maps.\n\n'
          END ||
          
          -- Pain point (1 line)
          CASE 
            WHEN top_competitor_name IS NOT NULL THEN 
              'They''re getting YOUR customers simply because they show up first on Google.\n\n'
            WHEN review_count < 30 THEN 
              'You need at least 30 reviews to show up in local searches.\n\n'
            ELSE 
              'You''re losing 20+ customers/month to competitors who rank higher.\n\n'
          END ||
          
          -- Social proof (1 line)
          'I just got The Fix Clinic to #1 for "med spa" and "botox" in Reston in 67 days.\n\n' ||
          
          -- CTA (1 line)
          'Want a 5-min video showing exactly how I''d do it for ' || COALESCE(business_name_clean, business_name) || '?\n\n' ||
          
          -- Simple close
          'Reply "YES" for the video.\n\n' ||
          
          -- One line guarantee
          '(Top 3 in 90 days or you pay nothing)',
        
        -- Short PS
        cold_ps = CASE 
          WHEN website IS NULL THEN 
            'P.S. You don''t have a website on Google - fixing this alone would 2x your leads.'
          WHEN review_count < 10 THEN 
            'P.S. Every day without reviews = lost customers to ' || COALESCE(competitor_name_short, 'competitors') || '.'
          WHEN top_competitor_name IS NOT NULL THEN 
            'P.S. ' || COALESCE(competitor_name_short, 'Your competitor') || ' is adding reviews daily. The gap widens every month.'
          ELSE 
            'P.S. I''m only taking 3 new clients this month. First come, first served.'
        END
        
      WHERE primary_email IS NOT NULL
    `;
    console.log('✅ Cold email messages generated\n');
    
    // Export cold email campaign
    console.log('📊 Exporting cold email campaign...');
    const exportData = await sql`
      SELECT 
        COALESCE(business_name_clean, business_name) as business_name,
        primary_email as email,
        COALESCE(first_name, '') as first_name,
        COALESCE(last_name, '') as last_name,
        phone,
        website,
        city,
        state,
        google_rating as rating,
        review_count as reviews,
        COALESCE(competitor_name_clean, top_competitor_name, '') as competitor_name,
        COALESCE(competitor_name_short, 'competitor') as competitor_short,
        COALESCE(top_competitor_reviews, 0) as competitor_reviews,
        COALESCE(greeting, 'Hi there') as greeting,
        cold_subject as subject_line,
        cold_message as full_message,
        cold_ps as ps_line
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      AND LOWER(business_name) NOT LIKE '%fix clinic%'
      AND LOWER(business_name) NOT LIKE '%the fix%'
      AND LOWER(business_name) NOT LIKE '%radiance aesthetics%'
      ORDER BY 
        CASE 
          WHEN review_count < 20 THEN 1
          WHEN review_count < 50 THEN 2
          WHEN google_rating < 4.0 THEN 3
          WHEN top_competitor_reviews > review_count * 3 THEN 4
          ELSE 5
        END,
        review_count ASC
    `;
    
    console.log(`✅ Retrieved ${exportData.length} prospects\n`);
    
    // Calculate message length stats
    let totalLength = 0;
    let maxLength = 0;
    let over150words = 0;
    
    exportData.forEach(row => {
      const wordCount = row.full_message.split(/\s+/).length;
      totalLength += wordCount;
      if (wordCount > maxLength) maxLength = wordCount;
      if (wordCount > 150) over150words++;
    });
    
    console.log('📊 Message Stats:');
    console.log(`   Average word count: ${Math.round(totalLength / exportData.length)} words`);
    console.log(`   Max word count: ${maxLength} words`);
    console.log(`   Messages over 150 words: ${over150words}`);
    
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
      'Competitor Short',
      'Competitor Reviews',
      'Greeting',
      'Subject Line',
      'Full Message',
      'PS Line'
    ];
    
    const csvRows = exportData.map(row => [
      row.business_name || '',
      row.email || '',
      row.first_name || '',
      row.last_name || '',
      row.phone || '',
      row.website || '',
      row.city || '',
      row.state || '',
      row.rating || '',
      row.reviews || '',
      row.competitor_name || '',
      row.competitor_short || '',
      row.competitor_reviews || '',
      row.greeting || 'Hi there',
      `"${(row.subject_line || '').replace(/"/g, '""')}"`,
      `"${(row.full_message || '').replace(/"/g, '""')}"`,
      `"${(row.ps_line || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Save CSV
    const csvPath = join(__dirname, '..', 'COLD_EMAIL_CAMPAIGN.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`\n✅ Exported ${exportData.length} prospects to: COLD_EMAIL_CAMPAIGN.csv`);
    
    // Show samples
    console.log('\n📧 SAMPLE COLD EMAILS:\n');
    console.log('=' .repeat(70));
    
    // Get different types of samples
    const samples = [
      exportData.find(d => d.reviews < 20),
      exportData.find(d => d.competitor_reviews > d.reviews * 3),
      exportData.find(d => d.rating < 4.0)
    ].filter(Boolean).slice(0, 2);
    
    samples.forEach((sample, idx) => {
      console.log(`\n--- SAMPLE ${idx + 1} ---`);
      console.log(`To: ${sample.email}`);
      console.log(`Business: ${sample.business_name} (${sample.reviews} reviews)`);
      console.log(`Subject: ${sample.subject_line}\n`);
      console.log(sample.full_message);
      console.log('\nBest,\nBrian\nSpotCircuit\n');
      console.log(sample.ps_line);
      console.log('\n' + '=' .repeat(70));
    });
    
    console.log('\n✨ Cold Email Campaign Ready!');
    console.log('   ✓ Short messages (under 100 words)');
    console.log('   ✓ One clear pain point');
    console.log('   ✓ One line social proof');
    console.log('   ✓ Simple CTA');
    console.log('   ✓ One line guarantee');
    console.log('\n🚫 Excluded: The Fix Clinic & Radiance Aesthetics (your clients)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createColdEmailCampaign();