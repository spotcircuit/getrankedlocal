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

// Function to clean company names
function cleanCompanyName(name) {
  if (!name) return name;
  
  // Remove common suffixes
  let cleaned = name
    .replace(/, LLC\.?$/i, '')
    .replace(/, Inc\.?$/i, '')
    .replace(/ LLC\.?$/i, '')
    .replace(/ Inc\.?$/i, '')
    .replace(/ Corporation$/i, '')
    .replace(/ Corp\.?$/i, '')
    .replace(/ Company$/i, '')
    .replace(/ Co\.$/i, '')
    .replace(/ Ltd\.?$/i, '')
    .replace(/ Limited$/i, '')
    .replace(/ LLP$/i, '')
    .replace(/ LP$/i, '')
    .replace(/ PC$/i, '')
    .replace(/ PLLC$/i, '')
    .replace(/ Associates$/i, '')
    .replace(/ Group$/i, '');
  
  // Remove duplicate city names (e.g., "Urban Medspa Charlotte Charlotte")
  const words = cleaned.split(' ');
  const uniqueWords = [];
  let lastWord = '';
  
  for (const word of words) {
    if (word.toLowerCase() !== lastWord.toLowerCase()) {
      uniqueWords.push(word);
      lastWord = word;
    }
  }
  
  cleaned = uniqueWords.join(' ');
  
  // Remove trailing " -" or " –" often added to location-based names
  cleaned = cleaned.replace(/ [-–] .+$/, '');
  
  return cleaned.trim();
}

// Function to get short name for competitor (use in repetitions)
function getShortName(fullName) {
  if (!fullName) return 'them';
  
  const cleaned = cleanCompanyName(fullName);
  const words = cleaned.split(' ');
  
  // If it's 3 words or less, use all
  if (words.length <= 3) return cleaned;
  
  // If contains "Medical Spa" or "Med Spa", just use first part
  if (cleaned.includes('Medical Spa') || cleaned.includes('Med Spa') || cleaned.includes('Medspa')) {
    return words[0] + ' ' + words[1];
  }
  
  // Otherwise use first 2 words
  return words.slice(0, 2).join(' ');
}

async function createPolishedCampaign() {
  const sql = neon(DATABASE_URL);
  
  console.log('🎯 Creating Polished Email Campaign with Better Personalization...\n');
  
  try {
    // Add columns for cleaned names
    console.log('📊 Adding normalized name columns...');
    await sql`
      ALTER TABLE outreach_prospects 
      ADD COLUMN IF NOT EXISTS business_name_clean VARCHAR(255),
      ADD COLUMN IF NOT EXISTS competitor_name_clean VARCHAR(255),
      ADD COLUMN IF NOT EXISTS competitor_name_short VARCHAR(255)
    `;
    console.log('✅ Columns added\n');
    
    // Update with cleaned names using SQL
    console.log('🧹 Normalizing business names...');
    await sql`
      UPDATE outreach_prospects
      SET 
        business_name_clean = TRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(business_name, 
                '(, LLC|, Inc|LLC|Inc|Corporation|Corp|Company|Co|Ltd|Limited|LLP|LP|PC|PLLC|Associates|Group)\.?$', '', 'gi'),
              ' - .+$', ''),
            '  +', ' ', 'g')
        )
    `;
    
    await sql`
      UPDATE outreach_prospects
      SET 
        competitor_name_clean = TRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(top_competitor_name, 
                '(, LLC|, Inc|LLC|Inc|Corporation|Corp|Company|Co|Ltd|Limited|LLP|LP|PC|PLLC|Associates|Group)\.?$', '', 'gi'),
              ' - .+$', ''),
            '  +', ' ', 'g')
        )
      WHERE top_competitor_name IS NOT NULL
    `;
    
    // Create short names for competitors
    await sql`
      UPDATE outreach_prospects
      SET competitor_name_short = 
        CASE 
          WHEN competitor_name_clean IS NULL THEN 'your top competitor'
          WHEN LENGTH(competitor_name_clean) <= 20 THEN competitor_name_clean
          WHEN competitor_name_clean LIKE '%Med Spa%' OR competitor_name_clean LIKE '%Medical Spa%' 
            THEN SPLIT_PART(competitor_name_clean, ' ', 1) || ' ' || SPLIT_PART(competitor_name_clean, ' ', 2)
          ELSE SPLIT_PART(competitor_name_clean, ' ', 1) || ' ' || SPLIT_PART(competitor_name_clean, ' ', 2)
        END
      WHERE competitor_name_clean IS NOT NULL
    `;
    
    console.log('✅ Names normalized\n');
    
    // Generate improved message components
    console.log('✉️ Generating improved personalized messages...');
    await sql`
      UPDATE outreach_prospects
      SET 
        -- Better subject lines (shorter, more personal)
        subject_line = CASE 
          WHEN top_competitor_name IS NOT NULL AND top_competitor_reviews > review_count * 3 THEN 
            first_name || ', ' || competitor_name_short || ' has ' || top_competitor_reviews || ' reviews to your ' || review_count
          WHEN google_rating < 4.0 THEN 
            business_name_clean || ': Your ' || google_rating || ' rating is costing you $10k/month'
          WHEN review_count < 20 THEN 
            first_name || ' - why ' || business_name_clean || ' is invisible online'
          WHEN review_count < 50 THEN 
            'Quick question about ' || business_name_clean || '''s growth'
          ELSE 
            first_name || ', saw ' || business_name_clean || ' online...'
        END,
        
        -- More personal opening line
        opening_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            'I was researching ' || COALESCE(niche, industry, 'businesses') || 
            ' in ' || city || ' for a client project, and I noticed something concerning about ' || 
            business_name_clean || '''s online presence compared to ' || competitor_name_clean || '.'
          WHEN google_rating < 4.0 THEN 
            'I came across ' || business_name_clean || ' while researching ' || city || 
            ' businesses, and I noticed your ' || google_rating || 
            ' star rating is significantly impacting your visibility. Most customers won''t even see you in search results.'
          WHEN review_count < 30 THEN 
            'I found ' || business_name_clean || ' on Google Maps, and noticed you''re doing great work (based on your ' ||
            CASE WHEN google_rating >= 4.5 THEN 'excellent ' || google_rating || ' rating' ELSE 'reviews' END ||
            '), but with only ' || review_count || ' reviews, most people searching for ' || 
            COALESCE(niche, 'your services') || ' in ' || city || ' never find you.'
          ELSE 
            'I specialize in helping ' || COALESCE(niche, industry, 'local businesses') || 
            ' dominate their local market, and ' || business_name_clean || 
            ' caught my attention as having massive untapped potential in ' || city || '.'
        END,
        
        -- More conversational pain point
        pain_point_line = CASE 
          WHEN top_competitor_name IS NOT NULL AND top_competitor_reviews > review_count * 2 THEN 
            'Here''s what''s happening: ' || competitor_name_clean || ' shows up for nearly every search while ' ||
            business_name_clean || ' is buried on page 2 or 3. They have ' || top_competitor_reviews || 
            ' reviews to your ' || review_count || ', so Google assumes they''re more trustworthy. ' ||
            'Even when someone searches for YOUR business by name, ' || competitor_name_short || ' often appears right next to you.'
          WHEN google_rating < 4.0 THEN 
            'The harsh reality: 92% of people won''t consider a business under 4 stars. ' ||
            business_name_clean || '''s ' || google_rating || ' rating doesn''t reflect your actual service quality - ' ||
            'it''s just that unhappy customers are more motivated to leave reviews. Meanwhile, your happy customers never do.'
          WHEN review_count < 20 THEN 
            'Google''s algorithm basically ignores businesses with fewer than 20-30 recent reviews. ' ||
            business_name_clean || ' could be the best ' || COALESCE(niche, 'option') || ' in ' || city || 
            ', but with ' || review_count || ' reviews, you''re invisible. Customers are choosing inferior options simply because they show up and you don''t.'
          ELSE 
            business_name_clean || ' should be the obvious choice for ' || COALESCE(niche, 'your services') || 
            ' in ' || city || ', but online visibility gaps are sending those customers elsewhere. ' ||
            'Small fixes could bring 20-30 new customers monthly.'
        END,
        
        -- Competitor line that's less repetitive
        competitor_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            'I did a quick analysis: ' || competitor_name_short || 
            ' gets 3x more visibility than you for high-intent searches. They''re not better - ' ||
            'they just optimized their Google presence. The good news? Their weak spots are easy to exploit.'
          WHEN industry = 'Healthcare' THEN 
            'Your competitors are using Google''s healthcare-specific features (online booking, insurance info, ' ||
            'Google Guaranteed badge) that ' || business_name_clean || ' isn''t leveraging yet.'
          WHEN industry = 'Beauty' THEN 
            'I found 3 nearby salons getting 40+ bookings weekly from Instagram-to-Google integration ' ||
            'that ' || business_name_clean || ' could easily implement.'
          ELSE 
            'Three competitors in ' || city || ' are using simple Google strategies to dominate. ' ||
            business_name_clean || ' could easily outrank them with the right approach.'
        END,
        
        -- Updated urgency with less competitor repetition
        urgency_line = CASE 
          WHEN top_competitor_name IS NOT NULL THEN 
            'I only work with one ' || COALESCE(niche, 'business') || ' per area. ' ||
            'I''ve been in discussions with ' || competitor_name_short || ', but honestly, ' ||
            'I think ' || business_name_clean || ' has more potential. I need to make a decision by Friday.'
          WHEN city IN ('Ashburn', 'Leesburg', 'Vienna', 'McLean') THEN 
            'I''m taking on 3 Northern Virginia clients this quarter. ' || business_name_clean || 
            ' would be perfect, but I have 7 businesses interested. First come, first served.'
          ELSE 
            'I''m expanding into ' || city || ' and offering my proven system to just 5 businesses ' ||
            'at 50% off my regular rate. ' || business_name_clean || ' would be ideal. Two spots are already tentatively booked.'
        END,
        
        -- More specific CTA
        cta_line = 'Reply "SHOW ME" and I''ll send a 5-minute video breaking down exactly what ' ||
          CASE 
            WHEN top_competitor_name IS NOT NULL THEN competitor_name_short || ' is doing'
            ELSE 'your competitors are doing'
          END || 
          ' to beat you, and the 3 quick fixes that would put ' || business_name_clean || 
          ' on top. No sales call - just watch the video and decide if it makes sense.',
        
        -- Better PS line mentioning their business
        ps_line = CASE 
          WHEN website IS NULL THEN 
            'P.S. ' || business_name_clean || ' doesn''t have a website on Google. ' ||
            'You''re losing 40% of potential customers who research before calling. This is the easiest fix.'
          WHEN review_count < 10 THEN 
            'P.S. ' || business_name_clean || '''s ' || review_count || ' reviews put you below Google''s ' ||
            'minimum threshold for local pack visibility. Every day without action = lost customers.'
          WHEN top_competitor_name IS NOT NULL THEN 
            'P.S. While ' || business_name_clean || ' stays stuck at ' || review_count || ' reviews, ' ||
            competitor_name_short || ' is actively growing. The gap widens every month.'
          ELSE 
            'P.S. I analyzed ' || business_name_clean || '''s Google presence - ' ||
            'you''re getting traffic but not converting. Quick fixes could 3x your leads from existing visitors.'
        END
        
      WHERE primary_email IS NOT NULL
    `;
    console.log('✅ Improved messages generated\n');
    
    // Export the polished campaign
    console.log('💾 Exporting polished campaign...');
    const exportData = await sql`
      SELECT 
        business_name_clean as business_name,
        primary_email,
        first_name,
        last_name,
        phone,
        website,
        city,
        state,
        google_rating,
        review_count,
        competitor_name_clean as competitor_name,
        competitor_name_short,
        top_competitor_reviews as competitor_reviews,
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
          WHEN city IN ('Ashburn', 'Leesburg', 'Vienna', 'McLean', 'Reston', 'Sterling') THEN 1
          WHEN state = 'VA' THEN 2
          ELSE 3
        END,
        priority_score DESC
      LIMIT 500
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
    const csvPath = join(__dirname, '..', 'polished_campaign.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ Exported ${exportData.length} prospects to: polished_campaign.csv\n`);
    
    // Show samples
    console.log('📧 SAMPLE MESSAGES FOR REVIEW:\n');
    console.log('=' .repeat(70));
    
    // Get 3 different samples
    const samples = await sql`
      SELECT * FROM (
        SELECT *, 'Has Competitor' as type FROM outreach_prospects 
        WHERE primary_email IS NOT NULL AND top_competitor_name IS NOT NULL 
        ORDER BY priority_score DESC LIMIT 1
      ) t1
      UNION ALL
      SELECT * FROM (
        SELECT *, 'Low Reviews' as type FROM outreach_prospects 
        WHERE primary_email IS NOT NULL AND review_count < 20 
        ORDER BY priority_score DESC LIMIT 1
      ) t2
      UNION ALL
      SELECT * FROM (
        SELECT *, 'Low Rating' as type FROM outreach_prospects 
        WHERE primary_email IS NOT NULL AND google_rating < 4.0 
        ORDER BY priority_score DESC LIMIT 1
      ) t3
      LIMIT 3
    `;
    
    for (const [idx, sample] of samples.entries()) {
      console.log(`\n--- SAMPLE ${idx + 1}: ${sample.type} ---`);
      console.log(`Business: ${sample.business_name_clean}`);
      console.log(`Email: ${sample.primary_email}`);
      console.log(`Stats: ${sample.google_rating}⭐ with ${sample.review_count} reviews\n`);
      
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
      console.log('[Your signature]\n');
      console.log(sample.ps_line);
      console.log('\n' + '=' .repeat(70));
    }
    
    console.log('\n✨ Polished campaign ready!');
    console.log('   ✓ Company names normalized (no LLC, Inc, etc.)');
    console.log('   ✓ Competitor names shortened after first mention');
    console.log('   ✓ More personal tone using their business name');
    console.log('   ✓ Less repetitive, more conversational');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createPolishedCampaign();