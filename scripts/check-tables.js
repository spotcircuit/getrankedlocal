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

async function checkTables() {
  try {
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('Tables in database:');
    tables.forEach(t => console.log('  -', t.table_name));
    
    // Check for competitor-related tables
    const competitorTables = tables.filter(t => 
      t.table_name.includes('competitor')
    );
    
    console.log('\nCompetitor-related tables:');
    competitorTables.forEach(t => console.log('  -', t.table_name));
    
    // Check structure of competitor_results if it exists
    if (competitorTables.some(t => t.table_name === 'competitor_results')) {
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'competitor_results'
        ORDER BY ordinal_position
      `;
      
      console.log('\ncompetitor_results columns:');
      columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    }
    
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();