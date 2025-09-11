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

async function exportCompleteCampaign() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Exporting COMPLETE Campaign with All Messages...\n');
  
  try {
    // First, ensure everyone has messages
    console.log('📝 Generating missing messages...');
    await sql`
      UPDATE outreach_prospects
      SET 
        greeting = COALESCE(greeting, 
          CASE 
            WHEN first_name IS NOT NULL THEN 'Hi ' || first_name
            ELSE 'Hi there'
          END
        ),
        
        subject_line = COALESCE(subject_line,
          CASE 
            WHEN top_competitor_name IS NOT NULL THEN 
              'Your competitor has ' || top_competitor_reviews || ' reviews to your ' || review_count
            WHEN google_rating < 4.0 THEN 
              'Your ' || google_rating || ' rating is costing you customers'
            WHEN review_count < 20 THEN 
              'Why your business is invisible online'
            WHEN review_count < 50 THEN 
              'Quick question about ' || business_name
            ELSE 
              'Found your business online - quick question'
          END
        ),
        
        opening_line = COALESCE(opening_line,
          'I was researching businesses in ' || COALESCE(city, 'your area') || 
          ' and noticed ' || business_name || ' could be getting significantly more customers from Google.'
        ),
        
        pain_point_line = COALESCE(pain_point_line,
          CASE 
            WHEN review_count < 20 THEN 
              'With only ' || review_count || ' reviews, you''re invisible to 70% of people searching for your services. ' ||
              'Google''s algorithm basically ignores businesses with less than 30 reviews.'
            WHEN review_count < 50 THEN 
              'You have ' || review_count || ' reviews, but your competitors average 200+. ' ||
              'This means they show up first and get the customers who should be yours.'
            WHEN google_rating < 4.0 THEN 
              'Your ' || google_rating || ' rating is below the 4.0 threshold. ' ||
              '92% of consumers won''t even consider businesses under 4 stars.'
            ELSE 
              'Your online presence has gaps that are costing you 20-30 customers per month. ' ||
              'Small fixes could double your leads from Google.'
          END
        ),
        
        competitor_line = COALESCE(competitor_line,
          CASE 
            WHEN top_competitor_name IS NOT NULL THEN 
              'Your main competitor ' || COALESCE(competitor_name_short, top_competitor_name) || 
              ' is dominating local searches with ' || top_competitor_reviews || ' reviews. ' ||
              'They''re not better - just more visible online.'
            ELSE 
              'Your competitors are using simple Google strategies to steal your customers. ' ||
              'You could easily outrank them with the right approach.'
          END
        ),
        
        solution_bullets = COALESCE(solution_bullets,
          '✓ Get you ranking #1-3 on Google Maps for your top 5 keywords\n' ||
          '✓ Generate 30-50 authentic 5-star reviews in 90 days (100% legitimate)\n' ||
          '✓ Fix website issues that are losing you customers\n' ||
          '✓ Set up conversion tracking to measure ROI\n' ||
          '✓ Create automated systems that work 24/7'
        ),
        
        guarantee_line = COALESCE(guarantee_line,
          'I guarantee in 90 days: Top 3 Google Maps ranking for at least 3 keywords, ' ||
          'minimum 30 new authentic reviews, and at least 15 trackable leads - or you pay nothing.'
        ),
        
        urgency_line = COALESCE(urgency_line,
          'I only work with one business per area and I''m already talking to competitors. ' ||
          'First to respond gets the exclusive territory.'
        ),
        
        cta_line = COALESCE(cta_line,
          'Reply "SHOW ME" and I''ll send a 5-minute video showing exactly how to fix these issues ' ||
          'and dominate your local market. No sales call required.'
        ),
        
        ps_line = COALESCE(ps_line,
          CASE 
            WHEN website IS NULL THEN 
              'P.S. You don''t have a website listed on Google. This alone costs you 40% of potential customers.'
            WHEN review_count < 10 THEN 
              'P.S. With less than 10 reviews, you don''t even show up in Google''s map results. Every day = lost customers.'
            ELSE 
              'P.S. I checked your Google presence - quick fixes could triple your leads this month.'
          END
        )
      WHERE primary_email IS NOT NULL
    `;
    console.log('✅ Messages generated for all prospects\n');
    
    // Now export with complete data
    console.log('📊 Exporting complete campaign...');
    const exportData = await sql`
      SELECT 
        COALESCE(business_name_clean, business_name) as business_name,
        primary_email,
        first_name,
        last_name,
        phone,
        website,
        city,
        state,
        google_rating,
        review_count,
        COALESCE(competitor_name_clean, top_competitor_name, '') as competitor_name,
        COALESCE(competitor_name_short, 'your competitor') as competitor_short,
        COALESCE(top_competitor_reviews, 0) as competitor_reviews,
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
      AND LOWER(business_name) NOT LIKE '%fix clinic%'
      AND LOWER(business_name) NOT LIKE '%the fix%'
      ORDER BY 
        CASE 
          WHEN review_count < 20 THEN 1
          WHEN review_count < 50 THEN 2
          WHEN google_rating < 4.0 THEN 3
          ELSE 4
        END,
        priority_score DESC
    `;
    
    console.log(`✅ Retrieved ${exportData.length} prospects with complete messages\n`);
    
    // Verify all have messages
    let missingCount = 0;
    exportData.forEach(row => {
      if (!row.subject_line || !row.opening_line || !row.solution_bullets) {
        missingCount++;
      }
    });
    
    if (missingCount > 0) {
      console.log(`⚠️  Warning: ${missingCount} records still missing some messages`);
    }
    
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
      row.business_name || '',
      row.primary_email || '',
      row.first_name || '',
      row.last_name || '',
      row.phone || '',
      row.website || '',
      row.city || '',
      row.state || '',
      row.google_rating || '',
      row.review_count || '',
      row.competitor_name || '',
      row.competitor_short || '',
      row.competitor_reviews || '',
      row.greeting || 'Hi there',
      `"${(row.subject_line || 'Quick question about your business').replace(/"/g, '""')}"`,
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
    const csvPath = join(__dirname, '..', 'COMPLETE_campaign.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ Exported ${exportData.length} prospects to: COMPLETE_campaign.csv`);
    console.log('\n📊 ALL prospects now have:');
    console.log('   ✓ Subject lines');
    console.log('   ✓ Complete messages');
    console.log('   ✓ Personalized greetings');
    console.log('   ✓ Solution bullets');
    console.log('   ✓ CTAs and PS lines');
    console.log('\n🚫 Excluded: The Fix Clinic (your client)');
    console.log('\n📧 Ready to upload to your email tool!');
    
    // Show a sample to verify
    console.log('\n📝 Sample message to verify:');
    if (exportData.length > 0) {
      const sample = exportData[0];
      console.log(`Business: ${sample.business_name}`);
      console.log(`Subject: ${sample.subject_line}`);
      console.log(`Opening: ${sample.opening_line.substring(0, 100)}...`);
      console.log(`Solution: ${sample.solution_bullets.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportCompleteCampaign();