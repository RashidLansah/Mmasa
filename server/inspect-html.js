/**
 * Inspect HTML structure from SportyBet booking code
 * 
 * Usage: node inspect-html.js <bookingCode>
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const bookingCode = process.argv[2] || 'A6PD49';
const url = `http://www.sportybet.com/gh/?shareCode=${bookingCode}`;

console.log(`🔍 Inspecting HTML structure for: ${url}\n`);

axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  timeout: 10000,
})
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Save full HTML for inspection
    fs.writeFileSync('sportybet-html.html', html);
    console.log('✅ HTML saved to sportybet-html.html\n');
    
    // Look for common patterns
    console.log('📊 Analyzing HTML structure...\n');
    
    // Check for team names
    console.log('🔍 Looking for team names:');
    $('*').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.match(/vs|VS|v\s/i) && text.length < 100) {
        console.log(`  Found: "${text}"`);
        console.log(`  Tag: ${elem.name}, Classes: ${$(elem).attr('class') || 'none'}`);
        console.log('');
      }
    });
    
    // Check for odds
    console.log('🔍 Looking for odds:');
    $('*').each((i, elem) => {
      const text = $(elem).text().trim();
      const oddsMatch = text.match(/^\d+\.\d+$/);
      if (oddsMatch && parseFloat(text) >= 1.0 && parseFloat(text) <= 100) {
        console.log(`  Found odds: ${text}`);
        console.log(`  Tag: ${elem.name}, Classes: ${$(elem).attr('class') || 'none'}`);
        console.log('');
      }
    });
    
    // Check for booking code
    console.log('🔍 Looking for booking code:');
    const bookingCodeMatch = html.match(new RegExp(bookingCode, 'i'));
    if (bookingCodeMatch) {
      console.log(`  ✅ Booking code found in HTML`);
    }
    
    // Check for common betting slip classes/ids
    console.log('\n🔍 Common betting slip selectors:');
    const selectors = [
      '.bet', '.slip', '.match', '.game', '.event',
      '[class*="bet"]', '[class*="slip"]', '[class*="match"]',
      '[id*="bet"]', '[id*="slip"]', '[id*="match"]'
    ];
    
    selectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`  ${selector}: ${elements.length} elements found`);
      }
    });
    
    console.log('\n✅ Analysis complete! Check sportybet-html.html for full HTML');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  });

