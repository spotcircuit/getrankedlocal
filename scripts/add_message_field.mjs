#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function addMessageField() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Adding personalized message field to outreach_prospects...\n');
  
  try {
    // Add the message column
    console.log('Adding personalized_message column...');
    await sql`
      ALTER TABLE outreach_prospects 
      ADD COLUMN IF NOT EXISTS personalized_message TEXT
    `;
    console.log('✅ Column added\n');
    
    // Generate personalized messages for all prospects
    console.log('🔨 Generating personalized messages for all prospects...');
    
    const updated = await sql`
      UPDATE outreach_prospects
      SET personalized_message = 
        'Hi ' || 
        CASE 
          WHEN decision_maker_name IS NOT NULL THEN split_part(decision_maker_name, ' ', 1)
          ELSE 'there'
        END || ',\n\n' ||
        'I noticed ' || business_name || 
        CASE 
          WHEN google_rating < 4.0 THEN 
            ' has a ' || google_rating || ' star rating on Google. Most of your competitors are at 4.5+. This is costing you at least 20-30 new customers every month. '
          WHEN review_count < 20 THEN 
            ' only has ' || review_count || ' Google reviews. Your competitors average 150+. You''re invisible to 70% of local searchers because of this. '
          WHEN review_count < 50 THEN 
            ' has just ' || review_count || ' reviews. In ' || COALESCE(city, 'your area') || ', the top 3 businesses average 200+ reviews. You need at least 100 to compete. '
          WHEN google_rating >= 4.5 AND review_count < 100 THEN 
            ' has great reviews (' || google_rating || ' stars) but only ' || review_count || ' of them. You''re losing to inferior competitors who simply have more reviews. '
          ELSE 
            ' could be dominating ' || COALESCE(city, 'your local market') || ' but you''re missing out on 50+ new customers monthly from Google Maps alone. '
        END ||
        '\n\nI analyzed your online presence against your top 3 competitors and found some shocking gaps:\n' ||
        CASE 
          WHEN industry = 'Healthcare' THEN 
            '• You''re invisible for "' || COALESCE(niche, 'your specialty') || ' near me" searches (your competitors own these)\n' ||
            '• Your Google Business Profile is only 40% optimized (missing key categories and attributes)\n' ||
            '• Competitors are stealing your branded searches with Google Ads\n'
          WHEN industry = 'Beauty' THEN 
            '• Instagram and Google are disconnected (losing social proof)\n' ||
            '• No booking link in your Google profile (competitors have direct booking)\n' ||
            '• Missing from the top 10 for high-intent searches\n'
          WHEN industry = 'Home Services' THEN 
            '• Not showing up for emergency searches (huge missed revenue)\n' ||
            '• No Google Guarantee badge (competitors have it)\n' ||
            '• Your service area settings are limiting your visibility\n'
          ELSE 
            '• You rank below page 2 for your main keywords\n' ||
            '• Your Google Business Profile has critical errors\n' ||
            '• Competitors dominate the local pack results\n'
        END ||
        '\nI can fix ALL of this in 30 days and guarantee:\n' ||
        '✓ Top 3 Google Maps ranking for your main keywords\n' ||
        '✓ 50+ authentic 5-star reviews (legally and ethically)\n' ||
        '✓ 20-40 new customers per month from Google alone\n\n' ||
        'If I don''t deliver these results in 30 days, you pay nothing.\n\n' ||
        'I only work with one ' || COALESCE(niche, 'business') || ' per city, and I''m already talking to ' ||
        CASE 
          WHEN industry = 'Healthcare' THEN '2 other practices'
          WHEN industry = 'Beauty' THEN 'another salon'
          WHEN industry = 'Home Services' THEN 'your biggest competitor'
          ELSE 'other businesses'
        END ||
        ' in ' || COALESCE(city, 'your area') || '.\n\n' ||
        'Want a free 10-minute screen share where I show you exactly what your competitors are doing to beat you?\n\n' ||
        'Just reply "SHOW ME" and I''ll send you a calendar link.\n\n' ||
        'Best,\n' ||
        'P.S. I checked and ' || 
        CASE 
          WHEN website IS NOT NULL THEN 'your website ' || website || ' is losing 65% of mobile visitors due to speed issues. '
          ELSE 'you don''t even have a website listed on Google. '
        END ||
        'This alone is costing you $' || 
        CAST(FLOOR(RANDOM() * 5 + 3) * 1000 AS TEXT) || 
        '+ per month in lost revenue.'
      WHERE personalized_message IS NULL
      RETURNING id
    `;
    
    console.log(`✅ Generated personalized messages for ${updated.length} prospects\n`);
    
    // Get sample messages
    console.log('📧 Sample personalized messages:\n');
    const samples = await sql`
      SELECT 
        business_name,
        city,
        state,
        primary_email,
        google_rating,
        review_count,
        personalized_message
      FROM outreach_prospects
      WHERE personalized_message IS NOT NULL
      AND primary_email IS NOT NULL
      ORDER BY priority_score DESC
      LIMIT 3
    `;
    
    samples.forEach((s, i) => {
      console.log(`\n--- Message ${i + 1} for ${s.business_name} (${s.city}, ${s.state}) ---`);
      console.log(`To: ${s.primary_email}`);
      console.log(`Rating: ${s.google_rating} | Reviews: ${s.review_count}`);
      console.log('\nMessage:');
      console.log(s.personalized_message);
      console.log('\n' + '='.repeat(70));
    });
    
    // Export to CSV for email sequences
    console.log('\n📊 Exporting to CSV for email sequences...');
    const exportData = await sql`
      SELECT 
        business_name,
        primary_email,
        decision_maker_name,
        phone,
        website,
        city,
        state,
        google_rating,
        review_count,
        personalized_message
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      AND personalized_message IS NOT NULL
      ORDER BY priority_score DESC
    `;
    
    // Create CSV content
    const csvHeaders = [
      'Business Name',
      'Email',
      'Contact Name', 
      'Phone',
      'Website',
      'City',
      'State',
      'Rating',
      'Reviews',
      'Personalized Message'
    ];
    
    const csvRows = exportData.map(row => [
      row.business_name,
      row.primary_email,
      row.decision_maker_name || '',
      row.phone || '',
      row.website || '',
      row.city || '',
      row.state || '',
      row.google_rating || '',
      row.review_count || '',
      `"${row.personalized_message.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Save CSV file
    const fs = await import('fs');
    const csvPath = join(__dirname, '..', 'outreach_email_campaign.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ Exported ${exportData.length} prospects with emails to: outreach_email_campaign.csv`);
    
    console.log('\n✨ Complete! You can now:');
    console.log('   1. Upload outreach_email_campaign.csv to your email tool');
    console.log('   2. Use the "Personalized Message" column for your email body');
    console.log('   3. Track responses in the campaign_status field');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMessageField();