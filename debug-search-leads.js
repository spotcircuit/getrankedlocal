// Debug script to test search_leads API
const https = require('https');

const url = 'http://localhost:3001/api/search_leads?query=The+Fix+Clinic%2C+43490+Yukon+Dr+Suite+103%2C+Ashburn%2C+VA+20147%2C+USA&limit=5';

console.log('Testing search_leads API...');
console.log('URL:', url);

fetch(url)
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(data => {
    console.log('Raw Response:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
