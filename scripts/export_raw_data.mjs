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

async function exportRawData() {
  const sql = neon(DATABASE_URL);
  
  console.log('📊 Exporting ALL Raw Data from Database...\n');
  
  try {
    // Get ALL data from outreach_prospects table
    console.log('🔍 Fetching all data from outreach_prospects...');
    const rawData = await sql`
      SELECT 
        -- Core Business Info
        id,
        business_name,
        business_name_clean,
        website,
        industry,
        niche,
        
        -- Contact Information
        primary_email,
        email_type,
        decision_maker_name,
        decision_maker_title,
        decision_maker_email,
        phone,
        first_name,
        last_name,
        greeting,
        
        -- Location Data
        address,
        city,
        state,
        zip_code,
        lat,
        lng,
        place_id,
        
        -- Google Performance Metrics
        google_rating,
        review_count,
        grid_coverage_percent,
        avg_ranking,
        top3_count,
        running_google_ads,
        running_meta_ads,
        monthly_search_volume,
        competition_level,
        
        -- Competitor Intelligence
        top_competitor_name,
        competitor_name_clean,
        competitor_name_short,
        top_competitor_rating,
        top_competitor_reviews,
        competitor_intel::text as competitor_intel_json,
        ai_intelligence::text as ai_intelligence_json,
        
        -- Pain Points & Opportunities
        ARRAY_TO_STRING(pain_points, ' | ') as pain_points_list,
        ARRAY_TO_STRING(opportunities, ' | ') as opportunities_list,
        
        -- Message Components
        subject_line,
        opening_line,
        pain_point_line,
        competitor_line,
        solution_bullets,
        guarantee_line,
        urgency_line,
        cta_line,
        ps_line,
        personalized_message,
        
        -- Cold Email Fields
        cold_subject,
        cold_message,
        cold_ps,
        
        -- Campaign Tracking
        campaign_status,
        last_contact_date,
        last_email_sent,
        total_emails_sent,
        email_opens,
        email_clicks,
        response_status,
        response_text,
        follow_up_date,
        follow_up_count,
        
        -- Metadata
        data_source,
        created_at,
        updated_at,
        notes,
        ARRAY_TO_STRING(tags, ' | ') as tags_list,
        priority_score
        
      FROM outreach_prospects
      ORDER BY 
        priority_score DESC NULLS LAST,
        review_count ASC NULLS LAST
    `;
    
    console.log(`✅ Retrieved ${rawData.length} total records\n`);
    
    // Analyze data quality
    console.log('📈 Data Quality Analysis:');
    
    const stats = {
      total: rawData.length,
      with_email: rawData.filter(r => r.primary_email).length,
      with_phone: rawData.filter(r => r.phone).length,
      with_website: rawData.filter(r => r.website).length,
      with_rating: rawData.filter(r => r.google_rating !== null).length,
      with_reviews: rawData.filter(r => r.review_count !== null).length,
      with_competitor: rawData.filter(r => r.top_competitor_name).length,
      with_ai_intel: rawData.filter(r => r.ai_intelligence_json && r.ai_intelligence_json !== 'null').length,
      with_first_name: rawData.filter(r => r.first_name).length,
      with_decision_maker: rawData.filter(r => r.decision_maker_name).length,
      with_pain_points: rawData.filter(r => r.pain_points_list && r.pain_points_list !== '').length,
      with_cold_message: rawData.filter(r => r.cold_message).length,
      with_personalized: rawData.filter(r => r.personalized_message).length
    };
    
    console.log(`  Total Records: ${stats.total}`);
    console.log(`  With Email: ${stats.with_email} (${(stats.with_email/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Phone: ${stats.with_phone} (${(stats.with_phone/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Website: ${stats.with_website} (${(stats.with_website/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Rating: ${stats.with_rating} (${(stats.with_rating/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Reviews: ${stats.with_reviews} (${(stats.with_reviews/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Competitor Data: ${stats.with_competitor} (${(stats.with_competitor/stats.total*100).toFixed(1)}%)`);
    console.log(`  With AI Intelligence: ${stats.with_ai_intel} (${(stats.with_ai_intel/stats.total*100).toFixed(1)}%)`);
    console.log(`  With First Name: ${stats.with_first_name} (${(stats.with_first_name/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Decision Maker: ${stats.with_decision_maker} (${(stats.with_decision_maker/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Pain Points: ${stats.with_pain_points} (${(stats.with_pain_points/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Cold Message: ${stats.with_cold_message} (${(stats.with_cold_message/stats.total*100).toFixed(1)}%)`);
    console.log(`  With Personalized: ${stats.with_personalized} (${(stats.with_personalized/stats.total*100).toFixed(1)}%)\n`);
    
    // Review distribution
    console.log('📊 Review Count Distribution:');
    const reviewBuckets = {
      '0 reviews': rawData.filter(r => r.review_count === 0).length,
      '1-10 reviews': rawData.filter(r => r.review_count > 0 && r.review_count <= 10).length,
      '11-20 reviews': rawData.filter(r => r.review_count > 10 && r.review_count <= 20).length,
      '21-50 reviews': rawData.filter(r => r.review_count > 20 && r.review_count <= 50).length,
      '51-100 reviews': rawData.filter(r => r.review_count > 50 && r.review_count <= 100).length,
      '100+ reviews': rawData.filter(r => r.review_count > 100).length,
      'No data': rawData.filter(r => r.review_count === null).length
    };
    
    Object.entries(reviewBuckets).forEach(([bucket, count]) => {
      if (count > 0) {
        console.log(`  ${bucket}: ${count} (${(count/stats.total*100).toFixed(1)}%)`);
      }
    });
    console.log('');
    
    // Rating distribution
    console.log('⭐ Rating Distribution:');
    const ratingBuckets = {
      'Below 3.0': rawData.filter(r => r.google_rating && r.google_rating < 3.0).length,
      '3.0-3.9': rawData.filter(r => r.google_rating >= 3.0 && r.google_rating < 4.0).length,
      '4.0-4.4': rawData.filter(r => r.google_rating >= 4.0 && r.google_rating < 4.5).length,
      '4.5-4.9': rawData.filter(r => r.google_rating >= 4.5 && r.google_rating < 5.0).length,
      '5.0': rawData.filter(r => r.google_rating === 5.0).length,
      'No rating': rawData.filter(r => !r.google_rating).length
    };
    
    Object.entries(ratingBuckets).forEach(([bucket, count]) => {
      if (count > 0) {
        console.log(`  ${bucket}: ${count} (${(count/stats.total*100).toFixed(1)}%)`);
      }
    });
    console.log('');
    
    // Create comprehensive CSV
    const csvHeaders = [
      'ID',
      'Business Name',
      'Business Name Clean',
      'Website',
      'Industry',
      'Niche',
      'Primary Email',
      'Email Type',
      'Decision Maker Name',
      'Decision Maker Title',
      'Decision Maker Email',
      'Phone',
      'First Name',
      'Last Name',
      'Greeting',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Latitude',
      'Longitude',
      'Place ID',
      'Google Rating',
      'Review Count',
      'Grid Coverage %',
      'Avg Ranking',
      'Top 3 Count',
      'Running Google Ads',
      'Running Meta Ads',
      'Monthly Search Volume',
      'Competition Level',
      'Top Competitor Name',
      'Competitor Name Clean',
      'Competitor Name Short',
      'Competitor Rating',
      'Competitor Reviews',
      'Competitor Intel JSON',
      'AI Intelligence JSON',
      'Pain Points',
      'Opportunities',
      'Subject Line',
      'Opening Line',
      'Pain Point Line',
      'Competitor Line',
      'Solution Bullets',
      'Guarantee Line',
      'Urgency Line',
      'CTA Line',
      'PS Line',
      'Personalized Message',
      'Cold Subject',
      'Cold Message',
      'Cold PS',
      'Campaign Status',
      'Last Contact Date',
      'Last Email Sent',
      'Total Emails Sent',
      'Email Opens',
      'Email Clicks',
      'Response Status',
      'Response Text',
      'Follow Up Date',
      'Follow Up Count',
      'Data Source',
      'Created At',
      'Updated At',
      'Notes',
      'Tags',
      'Priority Score'
    ];
    
    // Helper function to escape CSV values
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csvRows = rawData.map(row => [
      row.id,
      row.business_name,
      row.business_name_clean,
      row.website,
      row.industry,
      row.niche,
      row.primary_email,
      row.email_type,
      row.decision_maker_name,
      row.decision_maker_title,
      row.decision_maker_email,
      row.phone,
      row.first_name,
      row.last_name,
      row.greeting,
      row.address,
      row.city,
      row.state,
      row.zip_code,
      row.lat,
      row.lng,
      row.place_id,
      row.google_rating,
      row.review_count,
      row.grid_coverage_percent,
      row.avg_ranking,
      row.top3_count,
      row.running_google_ads,
      row.running_meta_ads,
      row.monthly_search_volume,
      row.competition_level,
      row.top_competitor_name,
      row.competitor_name_clean,
      row.competitor_name_short,
      row.top_competitor_rating,
      row.top_competitor_reviews,
      row.competitor_intel_json,
      row.ai_intelligence_json,
      row.pain_points_list,
      row.opportunities_list,
      row.subject_line,
      row.opening_line,
      row.pain_point_line,
      row.competitor_line,
      row.solution_bullets,
      row.guarantee_line,
      row.urgency_line,
      row.cta_line,
      row.ps_line,
      row.personalized_message,
      row.cold_subject,
      row.cold_message,
      row.cold_ps,
      row.campaign_status,
      row.last_contact_date,
      row.last_email_sent,
      row.total_emails_sent,
      row.email_opens,
      row.email_clicks,
      row.response_status,
      row.response_text,
      row.follow_up_date,
      row.follow_up_count,
      row.data_source,
      row.created_at,
      row.updated_at,
      row.notes,
      row.tags_list,
      row.priority_score
    ].map(escapeCSV));
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Save CSV
    const csvPath = join(__dirname, '..', 'RAW_DATA_EXPORT.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ Exported ${rawData.length} records to: RAW_DATA_EXPORT.csv`);
    console.log(`📁 File location: ${csvPath}\n`);
    
    // Show sample records
    console.log('📋 Sample Records (First 3):');
    console.log('=' .repeat(80));
    
    rawData.slice(0, 3).forEach((sample, idx) => {
      console.log(`\nRecord ${idx + 1}:`);
      console.log(`  Business: ${sample.business_name || 'N/A'}`);
      console.log(`  Email: ${sample.primary_email || 'N/A'}`);
      console.log(`  Location: ${sample.city || 'N/A'}, ${sample.state || 'N/A'}`);
      console.log(`  Rating: ${sample.google_rating || 'N/A'} (${sample.review_count || 0} reviews)`);
      console.log(`  Competitor: ${sample.top_competitor_name || 'None'} (${sample.top_competitor_reviews || 0} reviews)`);
      console.log(`  Priority: ${sample.priority_score || 'N/A'}`);
      console.log(`  Has AI Intel: ${sample.ai_intelligence_json && sample.ai_intelligence_json !== 'null' ? 'Yes' : 'No'}`);
      console.log(`  Has Cold Message: ${sample.cold_message ? 'Yes' : 'No'}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✨ Raw Data Export Complete!');
    console.log('   This CSV contains ALL available data fields (70+ columns)');
    console.log('   Use this for data analysis, template creation, and campaign planning');
    console.log('   NULL values are preserved as empty cells for transparency');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportRawData();