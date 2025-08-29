const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

loadEnv();

async function addAIIntelligenceColumn() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  
  try {
    console.log('🚀 Adding AI intelligence column to competitor_searches table...');
    
    // Add ai_intelligence column to competitor_searches table
    await sql`
      ALTER TABLE competitor_searches 
      ADD COLUMN IF NOT EXISTS ai_intelligence JSONB
    `;
    console.log('✅ Added ai_intelligence column');
    
    // Verify the column was added
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'competitor_searches' 
        AND column_name = 'ai_intelligence'
    `;
    
    if (columns.length > 0) {
      console.log('✅ Verified ai_intelligence column exists with type:', columns[0].data_type);
    } else {
      console.error('❌ Column was not added successfully');
      process.exit(1);
    }
    
    console.log('\n✨ Database update complete!');
    console.log('📝 The AI intelligence data for the target business will now be stored as a JSONB blob.');
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
    process.exit(1);
  }
}

// Run the update
addAIIntelligenceColumn();