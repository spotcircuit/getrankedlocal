#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
  console.log('Checking leads table columns...');
  const leadsCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    ORDER BY ordinal_position
  `;
  console.log('Leads columns:', leadsCols.map(c => c.column_name).join(', '));
  
  console.log('\nChecking lead_collections columns...');
  const lcCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'lead_collections' 
    ORDER BY ordinal_position
  `;
  console.log('Lead_collections columns:', lcCols.map(c => c.column_name).join(', '));
  
  console.log('\nChecking prospects columns...');
  const prospectsCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'prospects' 
    ORDER BY ordinal_position
  `;
  console.log('Prospects columns:', prospectsCols.map(c => c.column_name).join(', '));
  
  console.log('\nSample lead with email/phone:');
  const sample = await sql`
    SELECT l.*, lc.contact_email, lc.contact_phone 
    FROM leads l 
    LEFT JOIN lead_collections lc ON l.id = lc.lead_id
    WHERE (l.email IS NOT NULL OR lc.contact_email IS NOT NULL)
    LIMIT 1
  `;
  console.log(sample[0]);
}

checkTables();