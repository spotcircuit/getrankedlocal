#!/usr/bin/env node
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function testParser() {
  console.log('\n🧪 Testing AI Parser with Database Raw Responses\n');
  console.log('=' .repeat(80));
  
  // Get all leads with raw AI responses
  const leads = await sql`
    SELECT 
      id,
      business_name,
      owner_name,
      additional_data
    FROM leads
    WHERE additional_data IS NOT NULL
      AND additional_data::text != 'null'
      AND additional_data::text != '{}'
      AND additional_data::text LIKE '%raw_ai_response%'
    ORDER BY created_at DESC
    LIMIT 20
  `;
  
  console.log(`Found ${leads.length} leads with raw AI responses\n`);
  
  for (const lead of leads) {
    let aiData = lead.additional_data;
    
    // Parse if it's a string
    if (typeof aiData === 'string') {
      aiData = JSON.parse(aiData);
    }
    
    if (!aiData.raw_ai_response) continue;
    
    console.log('\n' + '=' .repeat(80));
    console.log(`\n📍 Testing: ${lead.business_name}`);
    console.log(`   Current DB owner: ${lead.owner_name || 'Not set'}`);
    
    // Write raw response to temp file
    const tempFile = join(__dirname, 'temp_ai_response.txt');
    await fs.writeFile(tempFile, aiData.raw_ai_response);
    
    // Run Python parser
    try {
      const { stdout, stderr } = await execAsync(
        `cd ${join(__dirname, '../../production')} && python -c "
import json
from ai_extraction_flexible import extract_intelligence_flexible

with open('${tempFile}', 'r') as f:
    text = f.read()

result = extract_intelligence_flexible(text)

# Print key fields
print('EXTRACTION RESULTS:')
if 'owner' in result:
    if 'name' in result['owner']:
        print(f'  Owner (single): {result[\\"owner\\"][\\"name\\"]}')
    elif 'names' in result['owner']:
        print(f'  Owners (multiple): {\\", \\".join(result[\\"owner\\"][\\"names\\"])}')
    else:
        print('  Owner: No name found in owner structure')
else:
    print('  Owner: Not extracted')

if result.get('contacts', {}).get('emails'):
    print(f'  Emails: {\\", \\".join(result[\\"contacts\\"][\\"emails\\"])}')
    
if result.get('contacts', {}).get('phones'):
    print(f'  Phones: {\\", \\".join(result[\\"contacts\\"][\\"phones\\"])}')

if result.get('competitors'):
    print(f'  Competitors: {\\", \\".join(result[\\"competitors\\"][:3])}')

if result.get('social_media'):
    for platform, data in result['social_media'].items():
        print(f'  {platform}: @{data[\\"handle\\"]}')

if result.get('business_intel', {}).get('expanding'):
    print('  Expanding: Yes')
if result.get('business_intel', {}).get('hiring'):
    print('  Hiring: Yes')
"`
      );
      
      console.log('\n' + stdout);
      
      // Check for specific issues
      console.log('\n⚠️  VALIDATION:');
      
      // Check if raw mentions owner but parser missed it
      const rawLower = aiData.raw_ai_response.toLowerCase();
      const hasOwnerMention = rawLower.includes('owner') || rawLower.includes('founder') || 
                              rawLower.includes('founded by') || rawLower.includes('co-founded');
      
      if (hasOwnerMention && !stdout.includes('Owner (single)') && !stdout.includes('Owners (multiple)')) {
        console.log('  ❌ Raw text mentions owner/founder but parser did not extract');
        
        // Show the context where owner is mentioned
        const sentences = aiData.raw_ai_response.split('.');
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('owner') || sentence.toLowerCase().includes('founder')) {
            console.log(`     Context: "${sentence.trim()}"`);
            break;
          }
        }
      } else if (!hasOwnerMention) {
        console.log('  ℹ️  No owner/founder mentioned in raw text');
      } else {
        console.log('  ✅ Owner extraction looks correct');
      }
      
    } catch (error) {
      console.log(`\n❌ Parser error: ${error.message}`);
    }
    
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
  }
  
  await sql.end();
  process.exit(0);
}

testParser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});