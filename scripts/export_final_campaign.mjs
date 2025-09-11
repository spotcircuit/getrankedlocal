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

async function exportFinalCampaign() {
  const sql = neon(DATABASE_URL);
  
  console.log('🚀 Exporting FINAL Campaign - Excluding Clients...\n');
  
  try {
    // Export ALL prospects except clients
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
        COALESCE(greeting, 'Hi there') as greeting,
        COALESCE(subject_line, 'Quick question about your online presence') as subject_line,
        COALESCE(opening_line, '') as opening_line,
        COALESCE(pain_point_line, '') as pain_point_line,
        COALESCE(competitor_line, '') as competitor_line,
        COALESCE(solution_bullets, '') as solution_bullets,
        COALESCE(guarantee_line, '') as guarantee_line,
        COALESCE(urgency_line, '') as urgency_line,
        COALESCE(cta_line, '') as cta_line,
        COALESCE(ps_line, '') as ps_line
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      AND LOWER(business_name) NOT LIKE '%fix clinic%'
      AND LOWER(business_name) NOT LIKE '%the fix%'
      ORDER BY priority_score DESC
    `;
    
    console.log(`✅ Retrieved ${exportData.length} prospects (excluding clients)\n`);
    
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
      row.greeting,
      `"${row.subject_line.replace(/"/g, '""')}"`,
      `"${row.opening_line.replace(/"/g, '""')}"`,
      `"${row.pain_point_line.replace(/"/g, '""')}"`,
      `"${row.competitor_line.replace(/"/g, '""')}"`,
      `"${row.solution_bullets.replace(/"/g, '""')}"`,
      `"${row.guarantee_line.replace(/"/g, '""')}"`,
      `"${row.urgency_line.replace(/"/g, '""')}"`,
      `"${row.cta_line.replace(/"/g, '""')}"`,
      `"${row.ps_line.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Save CSV
    const csvPath = join(__dirname, '..', 'FINAL_campaign.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ Exported ${exportData.length} prospects to: FINAL_campaign.csv`);
    console.log('\n📊 This file excludes The Fix Clinic (your client)');
    console.log('📧 Ready to upload to your email tool!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportFinalCampaign();