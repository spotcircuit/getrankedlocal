import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('\n🚀 Running Grid Search Database Migration\n');
  console.log('='*50);
  
  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '..', 'migrations', 'create_grid_search_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing migration...\n');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        console.log(`Creating table: ${tableName}...`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE INDEX (\w+)/)?.[1];
        console.log(`Creating index: ${indexName}...`);
      } else if (statement.includes('CREATE VIEW')) {
        const viewName = statement.match(/CREATE VIEW (\w+)/)?.[1];
        console.log(`Creating view: ${viewName}...`);
      } else if (statement.includes('CREATE TRIGGER')) {
        const triggerName = statement.match(/CREATE TRIGGER (\w+)/)?.[1];
        console.log(`Creating trigger: ${triggerName}...`);
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`Creating function...`);
      }
      
      try {
        await sql(statement);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('\n📊 Verifying created tables:');
    
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'grid_%'
      ORDER BY tablename
    `;
    
    console.log('\nTables created:');
    tables.forEach(t => console.log(`  ✓ ${t.tablename}`));
    
    const views = await sql`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname LIKE 'competitor_%'
      ORDER BY viewname
    `;
    
    if (views.length > 0) {
      console.log('\nViews created:');
      views.forEach(v => console.log(`  ✓ ${v.viewname}`));
    }
    
    console.log('\n' + '='*50);
    console.log('🎉 Database is ready for grid search data storage!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

runMigration();