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
  throw new Error('DATABASE_URL not found');
}

const sql = neon(connectionString);

async function checkColumns() {
  try {
    // Get column information
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'prospects'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📊 PROSPECTS TABLE COLUMNS:');
    console.log('=' .repeat(50));
    
    columns.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Total columns:', columns.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkColumns();