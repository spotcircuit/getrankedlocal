#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function runSQL() {
  const sql = neon(DATABASE_URL);
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, '..', 'create_outreach_tables.sql'), 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sqlContent
      .split(/;(?=\s*(?:CREATE|INSERT|ALTER|DROP|UPDATE|DELETE|SELECT))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log('🚀 Creating outreach tables in Neon database...\n');
    
    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue;
      
      // Get the type of statement for logging
      const statementType = statement.substring(0, 50).replace(/\n/g, ' ');
      console.log(`Executing: ${statementType}...`);
      
      try {
        await sql(statement + ';');
        console.log('✅ Success\n');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Already exists (skipping)\n');
        } else {
          console.error(`❌ Error: ${error.message}\n`);
        }
      }
    }
    
    // Check if tables were created
    console.log('📊 Checking created tables...\n');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'outreach%'
      ORDER BY table_name;
    `;
    
    console.log('✅ Created tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Count prospects
    const prospects = await sql`SELECT COUNT(*) as count FROM outreach_prospects`;
    console.log(`\n📈 Total prospects in database: ${prospects[0].count}`);
    
    console.log('\n✨ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Failed to run SQL:', error);
    process.exit(1);
  }
}

runSQL();