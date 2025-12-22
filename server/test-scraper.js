/**
 * Test script for booking code scraper
 * 
 * Usage: node test-scraper.js <platform> <bookingCode>
 * Example: node test-scraper.js SportyBet ABC123XYZ
 */

const axios = require('axios');

const platform = process.argv[2] || 'SportyBet';
const bookingCode = process.argv[3] || 'TEST123';

// Get web URL based on platform
function getWebURL(platform, code) {
  const webUrls = {
    SportyBet: `http://www.sportybet.com/gh/?shareCode=${code}`,
    Bet9ja: `https://web.bet9ja.com/share/${code}`,
    '1xBet': `https://1xbet.com/en/share/${code}`,
    Betway: `https://betway.com.gh/share/${code}`,
    MozzartBet: `https://www.mozzartbet.com/gh/share/${code}`,
  };
  return webUrls[platform] || `https://${platform.toLowerCase()}.com/share/${code}`;
}

const url = getWebURL(platform, bookingCode);

console.log('🧪 Testing Booking Code Scraper');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Platform: ${platform}`);
console.log(`Booking Code: ${bookingCode}`);
console.log(`URL: ${url}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testData = {
  platform,
  bookingCode,
  url,
};

axios.post('http://localhost:3001/api/scrape-booking-code', testData)
  .then(response => {
    console.log('✅ Success!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    if (error.response) {
      console.error('❌ Error Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ No response received');
      console.error('Make sure the server is running: npm start');
      console.error('Error:', error.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  });

