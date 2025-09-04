#!/usr/bin/env node
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

// Improved extraction patterns
const extractOwnerFromRaw = (rawText) => {
  if (!rawText) return null;
  
  const ownerPatterns = [
    // "co-founded by master stylists Mehmet and Koray Acarsoy"
    /(?:co-)?founded\s+by\s+(?:master\s+\w+\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    
    // "founded by Family Nurse Practitioner Natasha Prymak"
    /founded\s+by\s+(?:Family\s+)?(?:Nurse\s+Practitioner|Doctor|Dr\.?|Attorney|CEO)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    
    // "Owner: Name" or "Founder: Name"
    /(?:Owner|Founder|CEO|President)(?:\s+name)?:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    
    // "Mehmet Acarsoy and Koray Acarsoy are identified as master stylists and co-founders"
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+and\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\s+are\s+(?:identified\s+as\s+)?(?:master\s+\w+\s+and\s+)?(?:the\s+)?(?:co-)?founders?/gi,
    
    // "owned by Name" or "operated by Name"
    /(?:owned|operated|managed|run)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    
    // "Name is the owner/founder"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+is\s+the\s+(?:owner|founder|CEO|president)/gi,
    
    // "brothers Koray Acarsoy and Mehmet Acarsoy"
    /(?:brothers?|sisters?)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\s+and\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    
    // "Founders: Mehmet Acarsoy and Koray Acarsoy"
    /Founders?:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+and\s+([A-Z][a-z]+\s+[A-Z][a-z]+))?/gi
  ];
  
  let foundOwners = new Set();
  
  for (const pattern of ownerPatterns) {
    const matches = [...rawText.matchAll(pattern)];
    for (const match of matches) {
      // Extract all captured groups (skipping the full match at index 0)
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const name = match[i].trim();
          // Filter out invalid names
          if (name && 
              name.length > 3 && 
              !name.toLowerCase().includes('not') &&
              !name.toLowerCase().includes('available') &&
              !name.toLowerCase().includes('public') &&
              !name.toLowerCase().includes('found') &&
              !name.toLowerCase().includes('the business') &&
              !name.toLowerCase().includes('founder name') &&
              !name.toLowerCase().includes('owner name')) {
            foundOwners.add(name);
          }
        }
      }
    }
  }
  
  const owners = Array.from(foundOwners);
  return owners.length > 0 ? owners.join(', ') : null;
};

async function salvageAIData() {
  console.log('\n🔧 Salvaging AI Data - Extracting Owner Information\n');
  console.log('=' .repeat(80));
  
  // Get all leads with AI data but missing or invalid owner names
  const leads = await sql`
    SELECT 
      id,
      place_id,
      business_name,
      owner_name,
      additional_data
    FROM leads
    WHERE additional_data IS NOT NULL
      AND additional_data::text != 'null'
      AND additional_data::text != '{}'
      AND (
        owner_name IS NULL 
        OR owner_name = ''
        OR owner_name = 'founder name'
        OR owner_name = 'owner name'
      )
    ORDER BY created_at DESC
  `;
  
  console.log(`\nFound ${leads.length} leads needing owner extraction\n`);
  
  let updated = 0;
  let noOwnerFound = 0;
  const updates = [];
  
  for (const lead of leads) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📍 ${lead.business_name}`);
    console.log(`   Current owner: "${lead.owner_name || 'NULL'}"`);
    
    try {
      let aiData = lead.additional_data;
      
      // Parse if string
      if (typeof aiData === 'string') {
        aiData = JSON.parse(aiData);
      }
      
      // First check the parsed AI data
      let extractedOwner = null;
      
      if (aiData.owner) {
        if (aiData.owner.name && !aiData.owner.name.toLowerCase().includes('founder name')) {
          extractedOwner = aiData.owner.name;
        } else if (aiData.owner.names && Array.isArray(aiData.owner.names)) {
          extractedOwner = aiData.owner.names.join(', ');
        }
      }
      
      // If no valid owner in parsed data, extract from raw
      if (!extractedOwner && aiData.raw_ai_response) {
        console.log('   🔍 Extracting from raw AI response...');
        extractedOwner = extractOwnerFromRaw(aiData.raw_ai_response);
      }
      
      if (extractedOwner) {
        console.log(`   ✅ Found owner: "${extractedOwner}"`);
        updates.push({ id: lead.id, owner: extractedOwner, business: lead.business_name });
        updated++;
      } else {
        console.log('   ❌ No owner found in AI data');
        noOwnerFound++;
        
        // Show a snippet if raw response exists
        if (aiData.raw_ai_response) {
          const snippet = aiData.raw_ai_response.substring(0, 200);
          console.log(`   📝 Raw snippet: "${snippet}..."`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Apply updates
  if (updates.length > 0) {
    console.log('\n' + '=' .repeat(80));
    console.log('\n📝 Applying Updates...\n');
    
    for (const update of updates) {
      try {
        await sql`
          UPDATE leads
          SET 
            owner_name = ${update.owner},
            updated_at = NOW()
          WHERE id = ${update.id}
        `;
        console.log(`   ✅ Updated ${update.business}: ${update.owner}`);
      } catch (error) {
        console.log(`   ❌ Failed to update ${update.business}: ${error.message}`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 SALVAGE COMPLETE:');
  console.log(`   ✅ Successfully updated: ${updated} leads`);
  console.log(`   ❌ No owner found: ${noOwnerFound} leads`);
  console.log(`   📝 Total processed: ${leads.length} leads\n`);
  
  await sql.end();
  process.exit(0);
}

salvageAIData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});