import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function getGooglePlaceDetails(placeId) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${placeId}&` +
    `fields=name,rating,user_ratings_total,formatted_address,website,formatted_phone_number&` +
    `key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      return {
        name: data.result.name,
        rating: data.result.rating || 0,
        review_count: data.result.user_ratings_total || 0,
        address: data.result.formatted_address,
        website: data.result.website,
        phone: data.result.formatted_phone_number
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

async function fixMissingRatings() {
  console.log('🔧 Fixing missing ratings for businesses...\n');
  
  // Find all leads with null rating or review_count
  const leadsToFix = await sql`
    SELECT 
      place_id,
      business_name,
      rating,
      review_count
    FROM leads
    WHERE (rating IS NULL OR review_count IS NULL)
      AND place_id IS NOT NULL
    LIMIT 10
  `;
  
  console.log(`Found ${leadsToFix.length} leads with missing ratings\n`);
  
  for (const lead of leadsToFix) {
    console.log(`📍 Processing: ${lead.business_name} (${lead.place_id})`);
    
    const details = await getGooglePlaceDetails(lead.place_id);
    
    if (details) {
      console.log(`  ✅ Found: Rating ${details.rating}, Reviews ${details.review_count}`);
      
      // Update the database
      await sql`
        UPDATE leads
        SET 
          rating = ${details.rating},
          review_count = ${details.review_count}
        WHERE place_id = ${lead.place_id}
      `;
      
      console.log(`  ✅ Updated in database\n`);
    } else {
      console.log(`  ❌ Could not fetch details from Google\n`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Also check prospects table
  const prospectsToFix = await sql`
    SELECT 
      place_id,
      business_name,
      rating,
      review_count
    FROM prospects
    WHERE (rating IS NULL OR review_count IS NULL)
      AND place_id IS NOT NULL
      AND place_id IN (
        SELECT DISTINCT prospect_place_id 
        FROM search_prospects 
        WHERE is_target_business = true
      )
    LIMIT 10
  `;
  
  console.log(`Found ${prospectsToFix.length} target prospects with missing ratings\n`);
  
  for (const prospect of prospectsToFix) {
    console.log(`📍 Processing: ${prospect.business_name} (${prospect.place_id})`);
    
    const details = await getGooglePlaceDetails(prospect.place_id);
    
    if (details) {
      console.log(`  ✅ Found: Rating ${details.rating}, Reviews ${details.review_count}`);
      
      // Update the database
      await sql`
        UPDATE prospects
        SET 
          rating = ${details.rating},
          review_count = ${details.review_count}
        WHERE place_id = ${prospect.place_id}
      `;
      
      console.log(`  ✅ Updated in database\n`);
    } else {
      console.log(`  ❌ Could not fetch details from Google\n`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ Done fixing missing ratings');
  
  await sql.end();
  process.exit(0);
}

fixMissingRatings().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});