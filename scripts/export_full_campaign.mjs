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

async function exportFullCampaign() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Exporting FULL Campaign - ALL Prospects with Emails...\n');
  
  try {
    // Get count first
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
    `;
    
    console.log(`📊 Total prospects with emails: ${countResult[0].total}`);
    
    // Export ALL prospects with emails
    console.log('💾 Exporting ALL prospects...');
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
        COALESCE(competitor_name_clean, top_competitor_name) as competitor_name,
        COALESCE(competitor_name_short, 'competitor') as competitor_short,
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
        ps_line,
        priority_score,
        CASE 
          WHEN review_count < 20 THEN 'Critical - Very Low Reviews'
          WHEN review_count < 50 THEN 'High - Low Reviews'
          WHEN google_rating < 4.0 THEN 'High - Bad Rating'
          WHEN review_count < 100 THEN 'Medium - Needs Growth'
          WHEN website IS NULL THEN 'Medium - No Website'
          WHEN top_competitor_reviews > review_count * 3 THEN 'Medium - Competitor Dominating'
          ELSE 'Low - Maintenance'
        END as segment,
        CASE 
          WHEN city IN ('Ashburn', 'Leesburg', 'Vienna', 'McLean', 'Reston', 'Sterling') THEN 'Local - VA'
          WHEN state = 'VA' THEN 'State - VA'
          WHEN state IN ('MD', 'DC') THEN 'Regional - DMV'
          ELSE 'National'
        END as location_tier
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      ORDER BY 
        CASE 
          WHEN city IN ('Ashburn', 'Leesburg', 'Vienna', 'McLean', 'Reston', 'Sterling') THEN 1
          WHEN state = 'VA' THEN 2
          WHEN state IN ('MD', 'DC') THEN 3
          ELSE 4
        END,
        priority_score DESC
    `;
    
    console.log(`✅ Retrieved ${exportData.length} prospects\n`);
    
    // Break down by segment
    const segments = {};
    exportData.forEach(row => {
      const seg = row.segment || 'Unknown';
      segments[seg] = (segments[seg] || 0) + 1;
    });
    
    console.log('📊 Breakdown by Priority:');
    Object.entries(segments)
      .sort((a, b) => b[1] - a[1])
      .forEach(([segment, count]) => {
        console.log(`   ${segment}: ${count} prospects`);
      });
    
    // Break down by location
    const locations = {};
    exportData.forEach(row => {
      const loc = row.location_tier || 'Unknown';
      locations[loc] = (locations[loc] || 0) + 1;
    });
    
    console.log('\n📍 Breakdown by Location:');
    Object.entries(locations)
      .sort((a, b) => {
        const order = {'Local - VA': 1, 'State - VA': 2, 'Regional - DMV': 3, 'National': 4};
        return (order[a[0]] || 5) - (order[b[0]] || 5);
      })
      .forEach(([location, count]) => {
        console.log(`   ${location}: ${count} prospects`);
      });
    
    // Create CSV with all fields
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
      'PS Line',
      'Priority Score',
      'Segment',
      'Location Tier'
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
      `"${(row.subject_line || 'Quick question about your online presence').replace(/"/g, '""')}"`,
      `"${(row.opening_line || '').replace(/"/g, '""')}"`,
      `"${(row.pain_point_line || '').replace(/"/g, '""')}"`,
      `"${(row.competitor_line || '').replace(/"/g, '""')}"`,
      `"${(row.solution_bullets || '').replace(/"/g, '""')}"`,
      `"${(row.guarantee_line || '').replace(/"/g, '""')}"`,
      `"${(row.urgency_line || '').replace(/"/g, '""')}"`,
      `"${(row.cta_line || '').replace(/"/g, '""')}"`,
      `"${(row.ps_line || '').replace(/"/g, '""')}"`,
      row.priority_score || 50,
      row.segment || '',
      row.location_tier || ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Save main CSV
    const csvPath = join(__dirname, '..', 'FULL_email_campaign.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`\n✅ Exported ALL ${exportData.length} prospects to: FULL_email_campaign.csv`);
    
    // Also create segmented files for easier management
    console.log('\n📂 Creating segmented files...');
    
    // Critical prospects (need immediate help)
    const criticalProspects = exportData.filter(row => 
      row.segment && row.segment.includes('Critical')
    );
    
    if (criticalProspects.length > 0) {
      const criticalCsv = [
        csvHeaders.join(','),
        ...criticalProspects.map(row => [
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
          `"${(row.ps_line || '').replace(/"/g, '""')}"`,
          row.priority_score || 50,
          row.segment || '',
          row.location_tier || ''
        ].join(','))
      ].join('\n');
      
      fs.writeFileSync(join(__dirname, '..', 'CRITICAL_prospects.csv'), criticalCsv);
      console.log(`   ✓ CRITICAL_prospects.csv: ${criticalProspects.length} prospects (< 20 reviews)`);
    }
    
    // Local VA prospects
    const localProspects = exportData.filter(row => 
      row.location_tier === 'Local - VA'
    );
    
    if (localProspects.length > 0) {
      const localCsv = [
        csvHeaders.join(','),
        ...localProspects.map(row => [
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
          `"${(row.ps_line || '').replace(/"/g, '""')}"`,
          row.priority_score || 50,
          row.segment || '',
          row.location_tier || ''
        ].join(','))
      ].join('\n');
      
      fs.writeFileSync(join(__dirname, '..', 'LOCAL_VA_prospects.csv'), localCsv);
      console.log(`   ✓ LOCAL_VA_prospects.csv: ${localProspects.length} prospects (Ashburn/Leesburg area)`);
    }
    
    console.log('\n✨ Export Complete!');
    console.log('\n📁 Files Created:');
    console.log('   1. FULL_email_campaign.csv - ALL prospects');
    console.log('   2. CRITICAL_prospects.csv - Urgent needs (<20 reviews)');
    console.log('   3. LOCAL_VA_prospects.csv - Your local market');
    console.log('\n💡 You can upload any of these to your email tool');
    console.log('   Start with CRITICAL or LOCAL for best results!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

exportFullCampaign();