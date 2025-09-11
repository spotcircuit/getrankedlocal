#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

async function checkDataIntegrity() {
  const sql = neon(DATABASE_URL);
  
  console.log('🔍 DATA INTEGRITY CHECK\n');
  console.log('=' .repeat(80));
  
  const issues = [];
  const warnings = [];
  
  try {
    // 1. CHECK: Duplicate emails
    console.log('\n1. CHECKING FOR DUPLICATE EMAILS...');
    const duplicateEmails = await sql`
      SELECT primary_email, COUNT(*) as count
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      GROUP BY primary_email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;
    
    if (duplicateEmails.length > 0) {
      issues.push(`Found ${duplicateEmails.length} duplicate emails`);
      console.log(`   ❌ Found duplicate emails:`);
      duplicateEmails.forEach(d => {
        console.log(`      - ${d.primary_email}: ${d.count} occurrences`);
      });
    } else {
      console.log('   ✅ No duplicate emails found');
    }
    
    // 2. CHECK: Invalid email formats
    console.log('\n2. CHECKING EMAIL FORMATS...');
    const invalidEmails = await sql`
      SELECT id, business_name, primary_email
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      AND (
        primary_email NOT LIKE '%@%.%'
        OR primary_email LIKE '%@%@%'
        OR primary_email LIKE '% %'
        OR primary_email LIKE '%..%'
        OR primary_email NOT SIMILAR TO '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
      )
      LIMIT 20
    `;
    
    if (invalidEmails.length > 0) {
      issues.push(`Found ${invalidEmails.length} invalid email formats`);
      console.log(`   ❌ Invalid email formats:`);
      invalidEmails.slice(0, 5).forEach(e => {
        console.log(`      - ${e.business_name}: "${e.primary_email}"`);
      });
    } else {
      console.log('   ✅ All emails have valid format');
    }
    
    // 3. CHECK: Missing critical data combinations
    console.log('\n3. CHECKING CRITICAL DATA COMBINATIONS...');
    const missingCritical = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE primary_email IS NOT NULL AND business_name IS NULL) as email_no_name,
        COUNT(*) FILTER (WHERE primary_email IS NOT NULL AND city IS NULL) as email_no_city,
        COUNT(*) FILTER (WHERE primary_email IS NOT NULL AND review_count IS NULL) as email_no_reviews,
        COUNT(*) FILTER (WHERE cold_message IS NOT NULL AND primary_email IS NULL) as message_no_email,
        COUNT(*) FILTER (WHERE greeting LIKE 'Hi %' AND first_name IS NULL) as greeting_no_name
      FROM outreach_prospects
    `;
    
    const critical = missingCritical[0];
    if (critical.email_no_name > 0) {
      issues.push(`${critical.email_no_name} records have email but no business name`);
      console.log(`   ❌ ${critical.email_no_name} records: Email but no business name`);
    }
    if (critical.email_no_city > 0) {
      warnings.push(`${critical.email_no_city} records have email but no city`);
      console.log(`   ⚠️  ${critical.email_no_city} records: Email but no city`);
    }
    if (critical.message_no_email > 0) {
      issues.push(`${critical.message_no_email} records have message but no email`);
      console.log(`   ❌ ${critical.message_no_email} records: Message but no email`);
    }
    if (critical.greeting_no_name > 0) {
      warnings.push(`${critical.greeting_no_name} records have personalized greeting but no first name`);
      console.log(`   ⚠️  ${critical.greeting_no_name} records: Personalized greeting but no name`);
    }
    
    // 4. CHECK: Data inconsistencies
    console.log('\n4. CHECKING DATA INCONSISTENCIES...');
    const inconsistencies = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE google_rating > 5.0 OR google_rating < 0) as invalid_rating,
        COUNT(*) FILTER (WHERE review_count < 0) as negative_reviews,
        COUNT(*) FILTER (WHERE top_competitor_reviews < review_count AND top_competitor_name IS NOT NULL) as competitor_less_reviews,
        COUNT(*) FILTER (WHERE business_name != business_name_clean AND business_name_clean IS NOT NULL) as name_mismatch
      FROM outreach_prospects
    `;
    
    const incon = inconsistencies[0];
    if (incon.invalid_rating > 0) {
      issues.push(`${incon.invalid_rating} records have invalid ratings (outside 0-5 range)`);
      console.log(`   ❌ ${incon.invalid_rating} records: Invalid rating values`);
    }
    if (incon.negative_reviews > 0) {
      issues.push(`${incon.negative_reviews} records have negative review counts`);
      console.log(`   ❌ ${incon.negative_reviews} records: Negative review counts`);
    }
    
    // 5. CHECK: Message quality
    console.log('\n5. CHECKING MESSAGE QUALITY...');
    const messageIssues = await sql`
      SELECT 
        id,
        business_name,
        cold_message,
        cold_subject
      FROM outreach_prospects
      WHERE primary_email IS NOT NULL
      AND (
        cold_message LIKE '%undefined%'
        OR cold_message LIKE '%null%'
        OR cold_message LIKE '%NaN%'
        OR cold_message LIKE '%[object Object]%'
        OR cold_subject LIKE '%undefined%'
        OR cold_subject LIKE '%null%'
        OR LENGTH(cold_message) < 50
        OR LENGTH(cold_message) > 2000
      )
      LIMIT 10
    `;
    
    if (messageIssues.length > 0) {
      issues.push(`Found ${messageIssues.length} messages with quality issues`);
      console.log(`   ❌ Message quality issues found:`);
      messageIssues.slice(0, 3).forEach(m => {
        const issue = m.cold_message?.includes('undefined') ? 'contains undefined' :
                     m.cold_message?.includes('null') ? 'contains null' :
                     m.cold_message?.length < 50 ? 'too short' :
                     m.cold_message?.length > 2000 ? 'too long' : 'other issue';
        console.log(`      - ${m.business_name}: ${issue}`);
      });
    } else {
      console.log('   ✅ Messages pass basic quality checks');
    }
    
    // 6. CHECK: Location data
    console.log('\n6. CHECKING LOCATION DATA...');
    const locationIssues = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE city = 'Ashburn' AND business_name LIKE '%Fix Clinic%') as fix_clinic_wrong_city,
        COUNT(*) FILTER (WHERE state IS NULL AND city IS NOT NULL) as city_no_state,
        COUNT(*) FILTER (WHERE lat IS NOT NULL AND lng IS NULL) as lat_no_lng,
        COUNT(*) FILTER (WHERE address LIKE '%test%' OR address LIKE '%example%') as test_addresses
      FROM outreach_prospects
    `;
    
    const loc = locationIssues[0];
    if (loc.fix_clinic_wrong_city > 0) {
      warnings.push(`Fix Clinic incorrectly listed in Ashburn (should be verified)`);
      console.log(`   ⚠️  Fix Clinic location may be incorrect`);
    }
    if (loc.city_no_state > 0) {
      warnings.push(`${loc.city_no_state} records have city but no state`);
      console.log(`   ⚠️  ${loc.city_no_state} records: City but no state`);
    }
    
    // 7. CHECK: Competitor data integrity
    console.log('\n7. CHECKING COMPETITOR DATA...');
    const competitorIssues = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE top_competitor_name = business_name) as self_competitor,
        COUNT(*) FILTER (WHERE top_competitor_name LIKE '%Sponsored%') as sponsored_competitor,
        COUNT(*) FILTER (WHERE top_competitor_reviews = 0 AND top_competitor_name IS NOT NULL) as competitor_no_reviews
      FROM outreach_prospects
    `;
    
    const comp = competitorIssues[0];
    if (comp.self_competitor > 0) {
      issues.push(`${comp.self_competitor} records list themselves as competitor`);
      console.log(`   ❌ ${comp.self_competitor} records: Business is its own competitor`);
    }
    if (comp.sponsored_competitor > 0) {
      warnings.push(`${comp.sponsored_competitor} records have "Sponsored" as competitor`);
      console.log(`   ⚠️  ${comp.sponsored_competitor} records: "Sponsored" listed as competitor`);
    }
    
    // 8. CHECK: Special characters and encoding
    console.log('\n8. CHECKING CHARACTER ENCODING...');
    const encodingIssues = await sql`
      SELECT 
        id,
        business_name,
        cold_message
      FROM outreach_prospects
      WHERE 
        business_name ~ '[^\x00-\x7F]'
        OR cold_message ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
      LIMIT 10
    `;
    
    if (encodingIssues.length > 0) {
      warnings.push(`Found ${encodingIssues.length} records with special characters`);
      console.log(`   ⚠️  ${encodingIssues.length} records with special/control characters`);
    }
    
    // 9. CHECK: Excluded clients in dataset
    console.log('\n9. CHECKING FOR EXCLUDED CLIENTS...');
    const excludedClients = await sql`
      SELECT business_name, primary_email
      FROM outreach_prospects
      WHERE 
        LOWER(business_name) LIKE '%fix clinic%'
        OR LOWER(business_name) LIKE '%radiance%'
        OR primary_email LIKE '%fixclinic%'
        OR primary_email LIKE '%radiance%'
    `;
    
    if (excludedClients.length > 0) {
      issues.push(`Found ${excludedClients.length} records that should be excluded (existing clients)`);
      console.log(`   ❌ ${excludedClients.length} existing clients found in dataset:`);
      excludedClients.slice(0, 5).forEach(c => {
        console.log(`      - ${c.business_name}: ${c.primary_email || 'no email'}`);
      });
    }
    
    // 10. CHECK: Data freshness
    console.log('\n10. CHECKING DATA FRESHNESS...');
    const freshness = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as updated_week,
        COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '30 days') as updated_month,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days') as older_90_days
      FROM outreach_prospects
    `;
    
    const fresh = freshness[0];
    console.log(`   📊 Total records: ${fresh.total}`);
    console.log(`   📊 Updated last week: ${fresh.updated_week}`);
    console.log(`   📊 Updated last month: ${fresh.updated_month}`);
    console.log(`   📊 Older than 90 days: ${fresh.older_90_days}`);
    
    // SUMMARY REPORT
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 INTEGRITY CHECK SUMMARY\n');
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ ALL CHECKS PASSED - No integrity issues found!');
    } else {
      if (issues.length > 0) {
        console.log(`❌ CRITICAL ISSUES (${issues.length}):`);
        issues.forEach(issue => console.log(`   • ${issue}`));
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
        warnings.forEach(warning => console.log(`   • ${warning}`));
      }
      
      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      if (duplicateEmails.length > 0) {
        console.log('   1. Deduplicate email addresses before sending campaigns');
      }
      if (invalidEmails.length > 0) {
        console.log('   2. Clean or remove invalid email formats');
      }
      if (excludedClients.length > 0) {
        console.log('   3. Remove existing clients from outreach list');
      }
      if (comp.sponsored_competitor > 0) {
        console.log('   4. Fix "Sponsored" competitor entries');
      }
      if (messageIssues.length > 0) {
        console.log('   5. Regenerate messages with quality issues');
      }
    }
    
    // Export problematic records
    if (issues.length > 0) {
      console.log('\n📝 Exporting problematic records for review...');
      
      const problematicRecords = await sql`
        SELECT *
        FROM outreach_prospects
        WHERE 
          -- Duplicate emails
          primary_email IN (
            SELECT primary_email 
            FROM outreach_prospects 
            WHERE primary_email IS NOT NULL
            GROUP BY primary_email 
            HAVING COUNT(*) > 1
          )
          -- Invalid emails
          OR (primary_email IS NOT NULL AND primary_email NOT LIKE '%@%.%')
          -- Excluded clients
          OR LOWER(business_name) LIKE '%fix clinic%'
          OR LOWER(business_name) LIKE '%radiance%'
          -- Self as competitor
          OR top_competitor_name = business_name
          -- Message issues
          OR cold_message LIKE '%undefined%'
          OR cold_message LIKE '%null%'
        ORDER BY priority_score DESC NULLS LAST
        LIMIT 100
      `;
      
      console.log(`   Found ${problematicRecords.length} problematic records to review`);
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('✨ Integrity check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDataIntegrity();