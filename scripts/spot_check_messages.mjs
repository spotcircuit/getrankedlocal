#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function spotCheck() {
  console.log('🔍 SPOT CHECKING PERSONALIZED MESSAGES\n');
  console.log('=' .repeat(80));
  
  // Get variety of messages - different scenarios
  const checks = await sql`
    SELECT 
      business_name,
      city,
      state,
      industry,
      niche,
      primary_email,
      decision_maker_name,
      google_rating,
      review_count,
      website,
      personalized_message,
      priority_score,
      CASE 
        WHEN google_rating < 4.0 THEN 'Low Rating'
        WHEN review_count < 20 THEN 'Very Low Reviews'
        WHEN review_count BETWEEN 20 AND 50 THEN 'Low Reviews'
        WHEN google_rating >= 4.5 AND review_count < 100 THEN 'Good Rating Low Reviews'
        ELSE 'Standard'
      END as scenario
    FROM outreach_prospects
    WHERE primary_email IS NOT NULL
    AND personalized_message IS NOT NULL
    AND (
      (google_rating < 4.0 AND industry = 'Healthcare')
      OR (review_count < 20 AND industry = 'Healthcare')
      OR (review_count BETWEEN 20 AND 50 AND industry = 'Beauty')
      OR (google_rating >= 4.5 AND review_count < 100)
      OR (industry = 'Home Services')
      OR (decision_maker_name IS NOT NULL)
      OR (website IS NULL)
      OR (city = 'Ashburn')
    )
    ORDER BY 
      CASE 
        WHEN city = 'Ashburn' THEN 1
        WHEN decision_maker_name IS NOT NULL THEN 2
        WHEN google_rating < 4.0 THEN 3
        WHEN review_count < 20 THEN 4
        ELSE 5
      END
    LIMIT 8
  `;
  
  // Display each message with analysis
  checks.forEach((msg, i) => {
    console.log(`\n📧 MESSAGE ${i + 1}: ${msg.scenario}`);
    console.log('-'.repeat(80));
    console.log(`Business: ${msg.business_name}`);
    console.log(`Location: ${msg.city}, ${msg.state}`);
    console.log(`Industry: ${msg.industry} ${msg.niche ? `(${msg.niche})` : ''}`);
    console.log(`Email: ${msg.primary_email}`);
    console.log(`Contact: ${msg.decision_maker_name || 'No name'}`);
    console.log(`Stats: ${msg.google_rating}⭐ with ${msg.review_count} reviews`);
    console.log(`Website: ${msg.website || 'NONE'}`);
    console.log(`Priority Score: ${msg.priority_score}`);
    console.log('\n--- MESSAGE ---');
    console.log(msg.personalized_message);
    
    // Check for issues
    console.log('\n✅ Quality Checks:');
    const issues = [];
    
    // Check greeting
    if (msg.personalized_message.includes('Hi there,')) {
      issues.push('⚠️  Generic greeting (no name available)');
    } else if (msg.decision_maker_name && msg.personalized_message.includes('Hi ' + msg.decision_maker_name.split(' ')[0])) {
      console.log('✓ Personal greeting with first name');
    }
    
    // Check if stats match
    if (msg.personalized_message.includes(msg.google_rating.toString())) {
      console.log('✓ Correct rating mentioned');
    } else {
      issues.push('❌ Rating mismatch');
    }
    
    if (msg.personalized_message.includes(msg.review_count.toString())) {
      console.log('✓ Correct review count mentioned');
    } else {
      issues.push('❌ Review count mismatch');
    }
    
    // Check city mention
    if (msg.city && msg.personalized_message.includes(msg.city)) {
      console.log('✓ City mentioned');
    }
    
    // Check website mention
    if (msg.website && msg.personalized_message.includes(msg.website)) {
      console.log('✓ Website mentioned in P.S.');
    } else if (!msg.website && msg.personalized_message.includes("don't even have a website")) {
      console.log('✓ No website handled correctly');
    }
    
    // Check for industry-specific content
    if (msg.industry === 'Healthcare' && msg.personalized_message.includes('near me')) {
      console.log('✓ Healthcare-specific content');
    } else if (msg.industry === 'Beauty' && msg.personalized_message.includes('Instagram')) {
      console.log('✓ Beauty-specific content');
    } else if (msg.industry === 'Home Services' && msg.personalized_message.includes('emergency')) {
      console.log('✓ Home Services-specific content');
    }
    
    // Check CTA
    if (msg.personalized_message.includes('SHOW ME')) {
      console.log('✓ Clear call-to-action');
    }
    
    // Check urgency
    if (msg.personalized_message.includes('already talking to')) {
      console.log('✓ Urgency/scarcity included');
    }
    
    if (issues.length > 0) {
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('🎯 Message looks perfect!');
    }
    
    console.log('\n' + '='.repeat(80));
  });
  
  // Get overall stats
  console.log('\n📊 OVERALL STATISTICS\n');
  
  const stats = await sql`
    SELECT 
      COUNT(*) as total_with_messages,
      COUNT(CASE WHEN personalized_message LIKE '%Hi there,%' THEN 1 END) as generic_greetings,
      COUNT(CASE WHEN decision_maker_name IS NOT NULL THEN 1 END) as has_contact_name,
      COUNT(CASE WHEN personalized_message LIKE '%SHOW ME%' THEN 1 END) as has_cta,
      COUNT(CASE WHEN personalized_message LIKE '%30 days%' THEN 1 END) as has_guarantee,
      COUNT(CASE WHEN personalized_message LIKE '%already talking%' THEN 1 END) as has_urgency,
      AVG(LENGTH(personalized_message)) as avg_message_length
    FROM outreach_prospects
    WHERE primary_email IS NOT NULL
    AND personalized_message IS NOT NULL
  `;
  
  const s = stats[0];
  console.log(`Total messages generated: ${s.total_with_messages}`);
  console.log(`Messages with personal names: ${s.has_contact_name} (${Math.round(s.has_contact_name/s.total_with_messages*100)}%)`);
  console.log(`Generic greetings: ${s.generic_greetings} (${Math.round(s.generic_greetings/s.total_with_messages*100)}%)`);
  console.log(`Has CTA: ${s.has_cta} (${Math.round(s.has_cta/s.total_with_messages*100)}%)`);
  console.log(`Has guarantee: ${s.has_guarantee} (${Math.round(s.has_guarantee/s.total_with_messages*100)}%)`);
  console.log(`Has urgency: ${s.has_urgency} (${Math.round(s.has_urgency/s.total_with_messages*100)}%)`);
  console.log(`Average message length: ${Math.round(s.avg_message_length)} characters`);
  
  // Check for common issues
  console.log('\n⚠️  POTENTIAL ISSUES TO CHECK\n');
  
  const issues = await sql`
    SELECT 
      business_name,
      city,
      primary_email,
      google_rating,
      review_count,
      'Message too short' as issue
    FROM outreach_prospects
    WHERE LENGTH(personalized_message) < 500
    AND primary_email IS NOT NULL
    LIMIT 5
  `;
  
  if (issues.length > 0) {
    console.log('Found some messages that might be too short:');
    issues.forEach(i => {
      console.log(`  - ${i.business_name} (${i.city}): Message might be too short`);
    });
  } else {
    console.log('✅ No major issues found!');
  }
  
  console.log('\n✨ Spot check complete!');
}

spotCheck();