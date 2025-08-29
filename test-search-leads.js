// Test the search_leads API
async function testSearchLeadsAPI() {
  const baseUrl = 'http://localhost:3001';
  const query = 'The Fix Clinic, 43490 Yukon Dr Suite 103, Ashburn, VA 20147, USA';
  const limit = 5;

  try {
    console.log('🔍 Testing search_leads API...');
    console.log(`📍 URL: ${baseUrl}/api/search_leads?query=${encodeURIComponent(query)}&limit=${limit}`);

    const response = await fetch(`${baseUrl}/api/search_leads?query=${encodeURIComponent(query)}&limit=${limit}`);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.text();

    if (response.headers.get('content-type')?.includes('application/json')) {
      const jsonData = JSON.parse(data);
      console.log('✅ JSON Response:');
      console.log(JSON.stringify(jsonData, null, 2));
    } else {
      console.log('📄 HTML Response (404 page):');
      console.log(data.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSearchLeadsAPI();
