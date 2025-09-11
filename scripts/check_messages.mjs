#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function checkMessages() {
  console.log('Checking message data...\n');
  
  // Check how many have each field
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(subject_line) as has_subject,
      COUNT(greeting) as has_greeting,
      COUNT(opening_line) as has_opening,
      COUNT(pain_point_line) as has_pain_point,
      COUNT(solution_bullets) as has_solution,
      COUNT(cta_line) as has_cta,
      COUNT(ps_line) as has_ps
    FROM outreach_prospects
    WHERE primary_email IS NOT NULL
  `;
  
  console.log('Field coverage:');
  console.log(`Total with email: ${stats[0].total}`);
  console.log(`Has subject_line: ${stats[0].has_subject}`);
  console.log(`Has greeting: ${stats[0].has_greeting}`);
  console.log(`Has opening_line: ${stats[0].has_opening}`);
  console.log(`Has solution_bullets: ${stats[0].has_solution}`);
  
  // Get a sample with data
  const sample = await sql`
    SELECT 
      business_name,
      primary_email,
      subject_line,
      greeting,
      opening_line,
      solution_bullets
    FROM outreach_prospects
    WHERE primary_email IS NOT NULL
    AND subject_line IS NOT NULL
    LIMIT 1
  `;
  
  if (sample.length > 0) {
    console.log('\nSample with data:');
    console.log(sample[0]);
  } else {
    console.log('\nNo records have subject lines - need to regenerate messages!');
  }
}

checkMessages();