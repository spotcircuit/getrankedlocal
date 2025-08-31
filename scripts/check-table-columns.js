#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) {
      connectionString = match[1].trim();
    }
  } catch (e) {
    console.error('Could not read .env file');
  }
}

if (!connectionString) {
  throw new Error('DATABASE_URL not found in environment or .env file');
}

const sql = neon(connectionString);

async function checkColumns() {
  try {
    // Get columns for leads table
    const leadColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `;
    
    console.log('LEADS TABLE COLUMNS:');
    console.log('====================');
    leadColumns.forEach(c => {
      console.log(`  ${c.column_name} (${c.data_type})`);
    });
    
    // Get columns for prospects table
    const prospectColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prospects'
      ORDER BY ordinal_position
    `;
    
    console.log('\nPROSPECTS TABLE COLUMNS:');
    console.log('========================');
    prospectColumns.forEach(c => {
      console.log(`  ${c.column_name} (${c.data_type})`);
    });
    
    // Check for search-related columns
    console.log('\n🔍 SEARCH-RELATED COLUMNS IN LEADS:');
    const searchCols = leadColumns.filter(c => 
      c.column_name.includes('search') || 
      c.column_name.includes('state') ||
      c.column_name.includes('city')
    );
    searchCols.forEach(c => {
      console.log(`  ✅ ${c.column_name}`);
    });
    
    console.log('\n🔍 SEARCH-RELATED COLUMNS IN PROSPECTS:');
    const prospectSearchCols = prospectColumns.filter(c => 
      c.column_name.includes('search') || 
      c.column_name.includes('state') ||
      c.column_name.includes('city')
    );
    prospectSearchCols.forEach(c => {
      console.log(`  ✅ ${c.column_name}`);
    });
    
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();