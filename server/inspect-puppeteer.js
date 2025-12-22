/**
 * Inspect rendered HTML from SportyBet using Puppeteer
 */

const puppeteer = require('puppeteer');

const bookingCode = process.argv[2] || 'A6PD49';
const url = `http://www.sportybet.com/gh/?shareCode=${bookingCode}`;

console.log(`🔍 Inspecting rendered HTML: ${url}\n`);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('📡 Loading page...');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait a bit for content to render
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('✅ Page loaded, extracting content...\n');
  
  // Get all text content
  const pageText = await page.evaluate(() => document.body.innerText);
  
  // Look for team names, odds, etc.
  console.log('📊 Page Text (first 2000 chars):');
  console.log(pageText.substring(0, 2000));
  console.log('\n...\n');
  
  // Get all class names
  const classNames = await page.evaluate(() => {
    const classes = new Set();
    document.querySelectorAll('*').forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(' ').forEach(c => classes.add(c));
      }
    });
    return Array.from(classes).filter(c => c.length > 0);
  });
  
  console.log('\n🔍 Relevant Class Names (bet/slip/match related):');
  classNames
    .filter(c => /bet|slip|match|game|event|team|odds|code/i.test(c))
    .forEach(c => console.log(`  .${c}`));
  
  // Try to find betting slip content
  const slipContent = await page.evaluate(() => {
    const selectors = [
      '[class*="bet"]',
      '[class*="slip"]',
      '[class*="match"]',
      '[class*="share"]',
      '[id*="bet"]',
      '[id*="slip"]'
    ];
    
    const results = {};
    selectors.forEach(sel => {
      const elements = document.querySelectorAll(sel);
      if (elements.length > 0) {
        results[sel] = Array.from(elements).slice(0, 3).map(el => ({
          text: el.innerText.substring(0, 100),
          html: el.outerHTML.substring(0, 200),
          classes: el.className
        }));
      }
    });
    return results;
  });
  
  console.log('\n📋 Found Elements:');
  Object.keys(slipContent).forEach(sel => {
    console.log(`\n${sel}:`);
    slipContent[sel].forEach((item, i) => {
      console.log(`  [${i}] Classes: ${item.classes}`);
      console.log(`      Text: ${item.text}`);
    });
  });
  
  // Save full HTML
  const html = await page.content();
  require('fs').writeFileSync('sportybet-rendered.html', html);
  console.log('\n✅ Full HTML saved to sportybet-rendered.html');
  
  await browser.close();
})();

