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
  
  console.log('🔍 Fetching from Google Places API...');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Google API Response:', data.status);
    
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

async function fixKMHairLounge() {
  const placeId = 'ChIJt5aQN3o_tokRGBA8Ql77l1M';
  console.log(`\n🎯 Fixing K&M HAIR LOUNGE (${placeId})\n`);
  
  // Check current status
  const current = await sql`
    SELECT 
      place_id,
      business_name,
      rating,
      review_count,
      street_address,
      phone,
      website
    FROM leads
    WHERE place_id = ${placeId}
  `;
  
  if (current.length === 0) {
    console.log('❌ Not found in leads table');
    await sql.end();
    return;
  }
  
  console.log('Current data:', {
    name: current[0].business_name,
    rating: current[0].rating,
    review_count: current[0].review_count
  });
  
  // Fetch from Google
  const details = await getGooglePlaceDetails(placeId);
  
  if (details) {
    console.log('\n✅ Found on Google:', {
      name: details.name,
      rating: details.rating,
      review_count: details.review_count,
      address: details.address,
      phone: details.phone
    });
    
    // Update the database
    await sql`
      UPDATE leads
      SET 
        rating = ${details.rating},
        review_count = ${details.review_count},
        street_address = COALESCE(street_address, ${details.address}),
        phone = COALESCE(phone, ${details.phone}),
        website = COALESCE(website, ${details.website}),
        updated_at = CURRENT_TIMESTAMP
      WHERE place_id = ${placeId}
    `;
    
    console.log('\n✅ Updated in database');
    
    // Also check if it's in prospects table and update there too
    const prospectUpdate = await sql`
      UPDATE prospects
      SET 
        rating = ${details.rating},
        review_count = ${details.review_count},
        updated_at = CURRENT_TIMESTAMP
      WHERE place_id = ${placeId}
      RETURNING place_id
    `;
    
    if (prospectUpdate.length > 0) {
      console.log('✅ Also updated in prospects table');
    }
    
  } else {
    console.log('❌ Could not fetch details from Google');
  }
  
  // Verify the update
  const updated = await sql`
    SELECT 
      business_name,
      rating,
      review_count
    FROM leads
    WHERE place_id = ${placeId}
  `;
  
  console.log('\n📊 Final data:', {
    name: updated[0].business_name,
    rating: updated[0].rating,
    review_count: updated[0].review_count
  });
  
  await sql.end();
  process.exit(0);
}

fixKMHairLounge().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});