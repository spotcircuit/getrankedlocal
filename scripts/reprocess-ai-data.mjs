#!/usr/bin/env node
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

// Function to call Python extraction script
async function extractWithPython(rawText) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      join(__dirname, '../../production/ai_extraction_flexible.py')
    ]);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${error}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      }
    });
    
    // Send the raw text to Python script
    pythonProcess.stdin.write(rawText);
    pythonProcess.stdin.end();
  });
}

async function reprocessAIData() {
  console.log('\n🔄 Reprocessing AI Data with Improved Parser\n');
  console.log('=' .repeat(60));
  
  // Get all leads with AI intelligence data
  const leads = await sql`
    SELECT 
      id,
      place_id,
      business_name,
      owner_name,
      email,
      domain,
      additional_data
    FROM leads
    WHERE additional_data IS NOT NULL
      AND additional_data::text != 'null'
      AND additional_data::text != '{}'
    ORDER BY created_at DESC
  `;
  
  console.log(`\nFound ${leads.length} leads with AI data to reprocess\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const lead of leads) {
    console.log(`\n📍 Processing: ${lead.business_name}`);
    console.log(`   Current owner: ${lead.owner_name || 'Not set'}`);
    
    try {
      let aiData = lead.additional_data;
      
      // Parse if it's a string
      if (typeof aiData === 'string') {
        aiData = JSON.parse(aiData);
      }
      
      // Skip if no raw AI response
      if (!aiData.raw_ai_response) {
        console.log('   ⚠️  No raw AI response found - skipping');
        continue;
      }
      
      // Re-extract using improved parser
      console.log('   🔍 Re-extracting with improved parser...');
      
      // Extract the actual owner from AI data
      let extractedOwner = null;
      let extractedEmail = null;
      let extractedDomain = null;
      
      // Check the already parsed data first
      if (aiData.owner) {
        if (aiData.owner.name) {
          extractedOwner = aiData.owner.name;
        } else if (aiData.owner.names) {
          extractedOwner = aiData.owner.names.join(', ');
        }
        
        if (aiData.owner.email) {
          extractedEmail = aiData.owner.email;
        }
      }
      
      // Get email from contacts if not in owner
      if (!extractedEmail && aiData.contacts?.emails?.length > 0) {
        extractedEmail = aiData.contacts.emails[0];
      }
      
      // Get domain
      if (aiData.domain) {
        extractedDomain = aiData.domain;
      }
      
      // If owner is still "founder name" or similar placeholder, try to extract from raw
      if (!extractedOwner || extractedOwner.toLowerCase().includes('founder name') || 
          extractedOwner.toLowerCase().includes('owner name')) {
        
        const rawText = aiData.raw_ai_response;
        
        // Use regex patterns to find real owner names
        const ownerPatterns = [
          /(?:founded by|co-founded by|owned by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+))?/gi,
          /(?:Owner|Founder|CEO|President)(?:\s+name)?:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:is|are)\s+the\s+(?:owner|founder|co-founder)/gi,
          /(?:brothers?|sisters?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi
        ];
        
        let foundOwners = [];
        for (const pattern of ownerPatterns) {
          const matches = [...rawText.matchAll(pattern)];
          for (const match of matches) {
            // Extract all captured groups
            for (let i = 1; i < match.length; i++) {
              if (match[i] && !match[i].toLowerCase().includes('not') && 
                  !match[i].toLowerCase().includes('available') &&
                  !match[i].toLowerCase().includes('public')) {
                foundOwners.push(match[i]);
              }
            }
          }
        }
        
        // Remove duplicates and join
        foundOwners = [...new Set(foundOwners)];
        if (foundOwners.length > 0) {
          extractedOwner = foundOwners.join(', ');
          console.log(`   ✅ Extracted owner(s): ${extractedOwner}`);
        }
      }
      
      // Update the lead if we found better data
      if (extractedOwner && (!lead.owner_name || lead.owner_name === 'founder name')) {
        console.log(`   📝 Updating owner from "${lead.owner_name}" to "${extractedOwner}"`);
        
        await sql`
          UPDATE leads
          SET 
            owner_name = ${extractedOwner},
            email = COALESCE(${extractedEmail}, email),
            domain = COALESCE(${extractedDomain}, domain),
            updated_at = NOW()
          WHERE id = ${lead.id}
        `;
        
        updated++;
        console.log('   ✅ Updated successfully');
      } else if (!extractedOwner) {
        console.log('   ⚠️  Could not extract owner from AI data');
      } else {
        console.log('   ℹ️  Owner already set correctly');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`\n📊 Reprocessing Complete:`);
  console.log(`   ✅ Updated: ${updated} leads`);
  console.log(`   ❌ Failed: ${failed} leads`);
  console.log(`   ℹ️  Unchanged: ${leads.length - updated - failed} leads\n`);
  
  await sql.end();
  process.exit(0);
}

reprocessAIData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});