/**
 * Backend API Endpoint: Scrape Booking Code
 * 
 * This runs on your Node.js server to scrape betting platform pages.
 * 
 * Setup:
 * 1. Install: npm install cheerio axios
 * 2. Add this route to your Express server
 * 3. Call from mobile app: POST /api/scrape-booking-code
 */

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const router = express.Router();

/**
 * POST /api/scrape-booking-code
 * Body: { platform, bookingCode, url }
 */
router.post('/scrape-booking-code', async (req, res) => {
  const { platform, bookingCode, url } = req.body;

  if (!platform || !bookingCode || !url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let html;
    
    // For SportyBet, use Puppeteer (JavaScript-rendered page)
    if (platform === 'SportyBet') {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate to URL and wait for content with longer timeout
      console.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      
      // Wait longer for betting slip content to fully load (increased for large accumulator slips)
      console.log('⏳ Waiting for page content to load (up to 30 seconds for large slips)...');
      try {
        // Try multiple selectors that might contain match data
        await page.waitForSelector('.bet-item, .match-item, [class*="bet"], [class*="match"], [class*="slip"], [class*="selection"]', { timeout: 30000 });
        console.log('✅ Found betting slip content');
      } catch (e) {
        console.log('⚠️ Selector not found, waiting additional time for content...');
        // Wait longer if selector not found - content might still be loading
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // Additional wait to ensure all dynamic content is loaded (increased for large slips)
      console.log('⏳ Waiting for all matches to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scroll down multiple times to trigger lazy loading for large accumulator slips (20+ matches)
      console.log('📜 Scrolling to load all matches (may take 30+ seconds for large slips)...');
      // Scroll more times for very large accumulator slips
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Also try scrolling incrementally
        if (i % 2 === 0) {
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final wait to ensure everything is loaded
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      html = await page.content();
      console.log(`📄 Page HTML retrieved (${html.length} characters)`);
      await browser.close();
    } else {
      // For other platforms, use axios (static HTML)
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });
      html = response.data;
    }

    const $ = cheerio.load(html);

    // Parse based on platform
    const scrapedData = parsePlatformHTML($, platform, bookingCode);

    res.json(scrapedData);
  } catch (error) {
    console.error('Error scraping booking code:', error.message);
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        return res.status(404).json({ 
          error: 'Booking code not found',
          message: 'The booking code URL returned 404. The code may be invalid or expired.',
          status: 404
        });
      } else if (status === 403) {
        return res.status(403).json({ 
          error: 'Access forbidden',
          message: 'The booking code may be private or require authentication.',
          status: 403
        });
      }
    }
    
    // Check if it's a Puppeteer error
    if (error.message?.includes('net::ERR') || error.message?.includes('Navigation')) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking code not found',
        message: 'The booking code URL could not be accessed. The code may be invalid, expired, or the page failed to load.',
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to scrape booking code',
      message: error.message || 'An unexpected error occurred while scraping the booking code'
    });
  }
});

/**
 * Parse HTML based on platform
 */
function parsePlatformHTML($, platform, bookingCode) {
  const matches = [];

  switch (platform) {
    case 'SportyBet':
      return parseSportyBet($, bookingCode);
    case 'Bet9ja':
      return parseBet9ja($, bookingCode);
    case '1xBet':
      return parse1xBet($, bookingCode);
    case 'Betway':
      return parseBetway($, bookingCode);
    case 'MozzartBet':
      return parseMozzartBet($, bookingCode);
    default:
      return parseGeneric($, bookingCode);
  }
}

/**
 * Parse SportyBet HTML
 * URL format: http://www.sportybet.com/gh/?shareCode={code}
 */
function parseSportyBet($, bookingCode) {
  const matches = [];

  // Strategy 1: Try to find structured HTML elements first
  // Look for common SportyBet selectors that might contain match data
  const structuredSelectors = [
    '[class*="bet-item"]',
    '[class*="match-item"]',
    '[class*="selection"]',
    '[class*="bet-selection"]',
    '[data-match]',
    '[data-team]',
    '[data-odds]',
    '.bet-row',
    '.match-row',
    '.selection-row'
  ];
  
  let foundStructuredData = false;
  for (const selector of structuredSelectors) {
    try {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        // Try to extract from structured HTML
        elements.each((i, elem) => {
          const $elem = $(elem);
          const text = $elem.text();
          // Look for team names pattern
          const teamMatch = text.match(/([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s*[-v]\s*([A-Z][a-zA-Z0-9\s\-&'\.]+?)/);
          if (teamMatch) {
            const homeTeam = cleanTeamName(teamMatch[1].trim());
            const awayTeam = cleanTeamName(teamMatch[2].trim());
            // Try to find odds in this element
            const oddsMatch = text.match(/(\d+\.\d{1,2})/);
            const odds = oddsMatch ? parseFloat(oddsMatch[1]) : 1.0;
            
            if (homeTeam.length >= 3 && awayTeam.length >= 3) {
              matches.push({
                homeTeam,
                awayTeam,
                prediction: 'home', // Default, will be refined
                odds: odds >= 1.01 && odds <= 1000 ? odds : 1.0,
                market: 'h2h',
                matchDate: null,
              });
              foundStructuredData = true;
            }
          }
        });
        if (foundStructuredData && matches.length > 0) {
          console.log(`✅ Extracted ${matches.length} matches from structured HTML`);
          break;
        }
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  // Get all text content for fallback text-based parsing
  const fullText = $('body').text();
  
  // Also get HTML for better structure analysis
  const html = $.html();
  
  // Find the section with the sharing code (contains the slip data)
  const codeIndex = fullText.indexOf(`Sharing Code ${bookingCode}`);
  if (codeIndex === -1) {
    // Try alternative: look in betslip section
    const betslipText = $('.m-betslip-wrapper, [id*="bet"], [class*="betslip"], [class*="share"]').text();
    if (betslipText.length > 0) {
      return parseFromBetslipText(betslipText, bookingCode);
    }
  }
  
  // Extract slip section (increase to 100000 chars to catch all matches, including very large accumulator slips with 20+ matches)
  // For 20 matches, we need roughly: 20 matches * ~200 chars per match = 4000 chars minimum
  // But with dates, odds, and spacing, we use 100k to be safe
  const slipSection = codeIndex !== -1 ? fullText.substring(codeIndex, codeIndex + 100000) : fullText;
  
  // Also get betslip display section for accurate odds (try multiple selectors)
  const betslipSelectors = [
    '.m-betslip-wrapper',
    '[id*="bet"]',
    '[class*="betslip"]',
    '[class*="share"]',
    '[class*="slip"]',
    '[data-betslip]'
  ];
  
  let betslipText = '';
  for (const selector of betslipSelectors) {
    try {
      const text = $(selector).text();
      if (text.length > 100) { // Only use if substantial content
        betslipText = text;
        console.log(`✅ Found betslip content with selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Continue
    }
  }
  
  console.log(`📊 Slip section length: ${slipSection.length} chars`);
  console.log(`📊 Betslip text length: ${betslipText.length} chars`);
  
  // Multiple patterns to catch different formats
  // Pattern 1: "Team1 - Team2 prematch PredictionOdds" (most common)
  const matchPattern1 = /\b([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s*-\s*([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s+prematch\s+(Home|Away|Draw|Over|Under)(\d+)/g;
  
  // Pattern 2: "Team1 - Team2 prematch Prediction" (without number)
  const matchPattern2 = /\b([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s*-\s*([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s+prematch\s+(Home|Away|Draw|Over|Under)\b/gi;
  
  // Pattern 3: "Team1 v Team2" format (alternative separator)
  const matchPattern3 = /\b([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s+v\s+([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s+prematch\s+(Home|Away|Draw|Over|Under)(\d+)/gi;
  
  // Pattern 4: More flexible - any team separator
  const matchPattern4 = /\b([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s*[-v]\s*([A-Z][a-zA-Z0-9\s\-&'\.]+?)\s+prematch\s+(Home|Away|Draw|Over|Under)(\d+)/gi;
  
  let match;
  
  let matchCount = 0;
  const allMatches = [];
  const seenMatches = new Set(); // Track seen matches to avoid duplicates
  
  // Try all patterns
  const patterns = [matchPattern1, matchPattern2, matchPattern3, matchPattern4];
  
  for (let p = 0; p < patterns.length; p++) {
    const pattern = patterns[p];
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(slipSection)) !== null) {
      const homeTeam = cleanTeamName(match[1].trim());
      const awayTeam = cleanTeamName(match[2].trim());
      const matchKey = `${homeTeam}|${awayTeam}`.toLowerCase();
      
      // Check if we've seen this match before
      if (!seenMatches.has(matchKey)) {
        seenMatches.add(matchKey);
        allMatches.push({ match, index: match.index, pattern: p });
      }
    }
  }
  
  // Sort by position in text
  allMatches.sort((a, b) => a.index - b.index);
  
  console.log(`🔍 Found ${allMatches.length} unique potential matches in slip section (tried ${patterns.length} patterns)`);
  
  for (const { match } of allMatches) {
    matchCount++;
    // Skip if it's part of "Sharing Code" or date
    if (match[0].includes('Sharing Code') || match[0].match(/\d{2}\/\d{2}\/\d{4}/)) {
      console.log(`⏭️ Skipping match ${matchCount}: contains Sharing Code or date`);
      continue;
    }
    
    const homeTeam = cleanTeamName(match[1].trim());
    const awayTeam = cleanTeamName(match[2].trim());
    const predictionText = match[3].trim();
    
    console.log(`🔍 Found potential match ${matchCount}: ${homeTeam} vs ${awayTeam} (${predictionText})`);
    
    // Skip if team names are too short or invalid
    if (homeTeam.length < 3 || awayTeam.length < 3) {
      console.log(`⏭️ Skipping match ${matchCount}: team names too short`);
      continue;
    }
    
    // Try to find actual odds from betslip display
    // The betslip shows: "Alverca Futebol v Porto\n       1X2    1.38 B  Away"
    // Format: Team1 v Team2\n       1X2    <odds> B  <prediction>
    const escapedHome = homeTeam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedAway = awayTeam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    let odds = 1.0;
    let oddsMatch = null;
    
    // Strategy 1: Look in HTML structure for odds near team names
    // Try to find HTML elements containing both team names and odds
    try {
      const teamNamePattern = new RegExp(`${escapedHome}|${escapedAway}`, 'i');
      $('*').each((i, elem) => {
        const $elem = $(elem);
        const elemText = $elem.text();
        if (teamNamePattern.test(elemText)) {
          // Found element with team name, check for odds
          const oddsInElem = elemText.match(/(\d+\.\d{1,2})/);
          if (oddsInElem) {
            const oddsValue = parseFloat(oddsInElem[1]);
            if (oddsValue >= 1.01 && oddsValue <= 1000) {
              odds = oddsValue;
              console.log(`✅ Found odds ${odds} in HTML element for ${homeTeam} vs ${awayTeam}`);
              return false; // Break loop
            }
          }
        }
      });
    } catch (e) {
      // Continue to text-based strategies
    }
    
    // Strategy 2: Look in betslip text for team names followed by odds
    // Pattern: "Team1 v Team2" followed by market and odds
    if (odds === 1.0 && betslipText.length > 0) {
      const teamPattern1 = new RegExp(`${escapedHome}\\s+v\\s+${escapedAway}[\\s\\S]{0,300}?(\\d+\\.\\d{1,2})`, 'i');
      oddsMatch = betslipText.match(teamPattern1);
    }
    
    // Strategy 3: Look for team names in full text near odds
    if (!oddsMatch && odds === 1.0) {
      const teamPattern2 = new RegExp(`${escapedHome}[\\s\\S]{0,200}?${escapedAway}[\\s\\S]{0,200}?(\\d+\\.\\d{1,2})`, 'i');
      oddsMatch = fullText.match(teamPattern2);
    }
    
    // Strategy 4: Look in slip section near this match for odds
    if (odds === 1.0) {
      const matchContext = slipSection.substring(
        Math.max(0, match.index - 400),
        match.index + match[0].length + 400
      );
      // Look for decimal odds near the match
      const oddsPattern = /(\d+\.\d{1,2})/g;
      const allOdds = [];
      let oddsInContext;
      while ((oddsInContext = oddsPattern.exec(matchContext)) !== null) {
        const oddsValue = parseFloat(oddsInContext[1]);
        // Validate odds are reasonable
        if (oddsValue >= 1.01 && oddsValue <= 1000) {
          allOdds.push({ value: oddsValue, index: oddsInContext.index });
        }
      }
      // Use the odds closest to the match
      if (allOdds.length > 0) {
        const matchPosition = match.index - Math.max(0, match.index - 400);
        const closestOdds = allOdds.reduce((prev, curr) => {
          const prevDist = Math.abs(prev.index - matchPosition);
          const currDist = Math.abs(curr.index - matchPosition);
          return currDist < prevDist ? curr : prev;
        });
        odds = closestOdds.value;
        console.log(`✅ Found odds ${odds} near match in slip section`);
      }
    }
    
    // Strategy 5: Extract from betslip with market type
    if (odds === 1.0 && betslipText.length > 0) {
      const teamPattern3 = new RegExp(`${escapedHome}\\s+v\\s+${escapedAway}[\\s\\S]{0,200}?(?:1X2|Over|Under|BTTS)[\\s\\S]{0,100}?(\\d+\\.\\d{1,2})`, 'i');
      oddsMatch = betslipText.match(teamPattern3);
    }
    
    // Strategy 6: Look for data attributes in HTML
    if (odds === 1.0) {
      try {
        $('[data-odds], [data-odd], [data-value]').each((i, elem) => {
          const $elem = $(elem);
          const elemText = $elem.text();
          if (new RegExp(`${escapedHome}|${escapedAway}`, 'i').test(elemText)) {
            const dataOdds = $elem.attr('data-odds') || $elem.attr('data-odd') || $elem.attr('data-value');
            if (dataOdds) {
              const oddsValue = parseFloat(dataOdds);
              if (oddsValue >= 1.01 && oddsValue <= 1000) {
                odds = oddsValue;
                console.log(`✅ Found odds ${odds} from data attribute for ${homeTeam} vs ${awayTeam}`);
                return false; // Break loop
              }
            }
          }
        });
      } catch (e) {
        // Continue
      }
    }
    
    if (oddsMatch && oddsMatch[1]) {
      // Found odds in betslip display (e.g., "1.38")
      const extractedOdds = parseFloat(oddsMatch[1]);
      // Validate odds are reasonable (between 1.01 and 1000)
      if (extractedOdds >= 1.01 && extractedOdds <= 1000) {
        odds = extractedOdds;
        console.log(`✅ Extracted odds ${odds} from betslip for ${homeTeam} vs ${awayTeam}`);
      }
    }
    
    // If still no odds found, log warning but don't use fallback calculation
    if (odds === 1.0) {
      console.warn(`⚠️ Could not extract odds for ${homeTeam} vs ${awayTeam}, using default 1.0`);
    }
    
    const prediction = normalizePrediction(predictionText);
    
    // Extract market type - default to 'h2h' (which displays as '1X2')
    // Most SportyBet bets are 1X2 (h2h)
    const market = 'h2h';
    
    // Extract match date/time from slip section
    // Pattern: "22/12/2025 18:45" or "22/12/2025 20:00" before/after team names
    const datePattern = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/g;
    let matchDate = null;
    
    // Look for date/time near this match (within 400 chars before/after for better coverage)
    const matchContext = slipSection.substring(
      Math.max(0, match.index - 400),
      match.index + match[0].length + 400
    );
    
    // Try multiple date patterns
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/g,  // DD/MM/YYYY HH:MM
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/g,  // D/M/YYYY H:MM
      /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/g,  // YYYY-MM-DD HH:MM
      /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})/g,  // DD.MM.YYYY HH:MM
    ];
    
    let dateMatch = null;
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0;
      dateMatch = pattern.exec(matchContext);
      if (dateMatch) break;
    }
    if (dateMatch) {
      try {
        // Parse date: "22/12/2025 18:45" -> Date object
        // Note: SportyBet uses DD/MM/YYYY format
        const [day, month, year] = dateMatch[1].split('/');
        const [hours, minutes] = dateMatch[2].split(':');
        
        // Create date in UTC to avoid timezone issues
        // Then convert to local time for display
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const hoursNum = parseInt(hours);
        const minutesNum = parseInt(minutes);
        
        // Validate date values
        if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) || 
            isNaN(hoursNum) || isNaN(minutesNum) ||
            dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
          console.warn('Invalid date values:', { day: dayNum, month: monthNum, year: yearNum, hours: hoursNum, minutes: minutesNum });
        } else {
        // Create date object - SportyBet shows times in GMT+0 (Ghana time)
        // Parse as if it's in UTC (GMT+0), which matches Ghana time
        // This ensures consistent comparison regardless of server timezone
        matchDate = new Date(Date.UTC(
          yearNum,
          monthNum - 1, // Month is 0-indexed
          dayNum,
          hoursNum,
          minutesNum
        ));
        
        // Log for debugging
        const now = new Date();
        const nowTimestamp = now.getTime();
        const matchTimestamp = matchDate.getTime();
        const isFuture = matchTimestamp > nowTimestamp;
        const hoursFromNow = (matchTimestamp - nowTimestamp) / (1000 * 60 * 60);
        
        console.log(`📅 Parsed match date: ${dateMatch[0]} (DD/MM/YYYY HH:MM)`);
        console.log(`📅 Parsed as UTC: ${matchDate.toISOString()}`);
        console.log(`📅 Current time: ${now.toISOString()}`);
        console.log(`📅 Match timestamp: ${matchTimestamp}, Now: ${nowTimestamp}`);
        console.log(`📅 Is future: ${isFuture}, Hours from now: ${hoursFromNow.toFixed(2)}`);
        
        // Validate the date makes sense (not too far in past or future)
        // Allow up to 2 hours in the past to account for timezone differences
        if (hoursFromNow < -2) {
          console.warn(`⚠️ Match date is more than 2 hours in the past - might be timezone issue or past match`);
          // Don't set matchDate if it's clearly in the past (more than 2 hours)
          // This prevents false expiration
          if (hoursFromNow < -24) {
            matchDate = null;
          }
        } else if (hoursFromNow > 365 * 24) {
          console.warn(`⚠️ Match date is more than 1 year in the future - might be parsing error`);
        }
        
        // If date seems wrong (e.g., year is way in the future), it might be a parsing error
        if (yearNum > 2030 || yearNum < 2020) {
          console.warn(`⚠️ Suspicious year: ${yearNum}, date might be parsed incorrectly`);
        }
        }
      } catch (e) {
        console.warn('Failed to parse match date:', dateMatch[0], e.message);
      }
    }
    
    // Avoid duplicates - but allow same teams if they have different dates or odds (different matches)
    // Use a more specific key that includes date and odds to distinguish between different matches
    const matchKey = `${homeTeam}|${awayTeam}|${matchDate ? matchDate.getTime() : 'nodate'}|${odds}`;
    const exists = matches.some(m => {
      const mKey = `${m.homeTeam}|${m.awayTeam}|${m.matchDate ? new Date(m.matchDate).getTime() : 'nodate'}|${m.odds}`;
      return mKey === matchKey;
    });
    
    if (!exists) {
      matches.push({
        homeTeam,
        awayTeam,
        prediction,
        odds: odds || 1.0,
        market: 'h2h',
        matchDate: matchDate || null,
      });
      console.log(`✅ Added match: ${homeTeam} vs ${awayTeam} (odds: ${odds}, prediction: ${prediction}, date: ${matchDate ? matchDate.toISOString() : 'none'})`);
    } else {
      console.log(`⏭️ Skipping duplicate match: ${homeTeam} vs ${awayTeam} (same date and odds)`);
    }
  }
  
  console.log(`📊 Total matches extracted: ${matches.length} (from ${matchCount} potential matches found)`);
  
  // If no matches found, try betslip format
  if (matches.length === 0) {
    const betslipText = $('.m-betslip-wrapper, [id*="bet"], [class*="betslip"]').text();
    return parseFromBetslipText(betslipText, bookingCode);
  }
  
  return extractSlipMetadata($, matches, bookingCode);
}

/**
 * Parse from betslip display format
 * Format: "Team1 v Team2\n       1X2    1.38 B  Away"
 */
function parseFromBetslipText(betslipText, bookingCode) {
  const matches = [];
  
  // Pattern: "Team1 v Team2" followed by odds and prediction
  const vsPattern = /([A-Za-z][^v]+?)\s+v\s+([A-Za-z][^\n]+?)(?:\n|$)/gi;
  let vsMatch;
  
  while ((vsMatch = vsPattern.exec(betslipText)) !== null) {
    const homeTeam = cleanTeamName(vsMatch[1].trim());
    const awayTeam = cleanTeamName(vsMatch[2].trim());
    
    // Find odds and prediction after the match (within next 300 chars)
    const afterMatch = betslipText.substring(
      vsMatch.index + vsMatch[0].length, 
      vsMatch.index + vsMatch[0].length + 300
    );
    
    // Look for market type first (e.g., "1X2")
    const marketMatch = afterMatch.match(/\b(1X2|Over|Under|BTTS|Handicap|Double Chance)\b/i);
    const market = marketMatch ? (marketMatch[1].toUpperCase() === '1X2' ? 'h2h' : 
                                  marketMatch[1].toUpperCase().includes('OVER') || marketMatch[1].toUpperCase().includes('UNDER') ? 'totals' :
                                  marketMatch[1].toUpperCase().includes('BTTS') ? 'btts' :
                                  marketMatch[1].toUpperCase().includes('HANDICAP') ? 'spreads' :
                                  'h2h') : 'h2h';
    
    // Look for odds: "1.38", "1.50", etc. (should be after market type)
    const oddsMatch = afterMatch.match(/(\d+\.\d+)/);
    // Look for prediction: "Away", "Home", "Draw"
    const predMatch = afterMatch.match(/\b(Home|Away|Draw|Over|Under)\b/i);
    
    if (oddsMatch && predMatch) {
      const odds = parseFloat(oddsMatch[1]);
      const prediction = normalizePrediction(predMatch[1]);
      
      // Avoid duplicates
      const exists = matches.some(m => m.homeTeam === homeTeam && m.awayTeam === awayTeam);
      if (!exists) {
        matches.push({
          homeTeam,
          awayTeam,
          prediction,
          odds: odds || 1.0,
          market: market,
          matchDate: null, // Date extraction from betslip display is harder, leave null
        });
      }
    }
  }
  
  // Don't calculate - total odds should be extracted from HTML
  // This function is only called if matches weren't found in main parseSportyBet
  // Total odds will be extracted in extractSlipMetadata
  return {
    matches,
    totalOdds: null, // Will be extracted from HTML, not calculated
    stake: null,
    potentialWin: null,
    platform: 'SportyBet',
    bookingCode,
    earliestMatchDate: null,
  };
}

/**
 * Extract metadata (odds, stake, potential win) and return final result
 */
function extractSlipMetadata($, matches, bookingCode) {
  const fullText = $('body').text();
  const html = $.html();
  
  // Extract total odds - try multiple strategies
  let totalOdds = null;
  
  // Strategy 1: Look in HTML structure for odds elements
  // SportyBet often stores odds in specific divs/classes
  const oddsSelectors = [
    '.odds-value',
    '.total-odds',
    '[class*="odds"]',
    '[class*="Odds"]',
    '[data-odds]',
    '[id*="odds"]',
    '[id*="Odds"]'
  ];
  
  for (const selector of oddsSelectors) {
    try {
      const oddsElements = $(selector);
      oddsElements.each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        const oddsMatch = text.match(/([\d]+\.[\d]{1,2})/);
        if (oddsMatch) {
          const oddsValue = parseFloat(oddsMatch[1]);
          // Check if it's a reasonable total odds value (usually > 1.0 and < 10000)
          if (oddsValue >= 1.0 && oddsValue <= 10000) {
            // Check context - should not be near team names
            const parentText = $elem.parent().text();
            const isNearTeam = parentText.match(/vs|v\s+[A-Z]|-\s+[A-Z]/i);
            if (!isNearTeam) {
              totalOdds = oddsValue;
              console.log(`✅ Extracted total odds from HTML element (${selector}): ${totalOdds}`);
              return false; // Break loop
            }
          }
        }
      });
      if (totalOdds) break;
    } catch (e) {
      // Continue to next selector
    }
  }
  
  // Strategy 2: Look for "Odds" in the header section (near "Booking Code" and "Max Bonus")
  if (!totalOdds) {
    const bookingCodeIndex = fullText.indexOf('Booking Code');
    if (bookingCodeIndex !== -1) {
      // Look in the section around booking code (next 3000 chars to catch more context)
      const headerSection = fullText.substring(bookingCodeIndex, bookingCodeIndex + 3000);
      
      // Try multiple patterns for "Odds" value
      // Pattern 2a: "Odds" followed by whitespace and number (most common)
      let oddsMatch1 = headerSection.match(/Odds\s+([\d.]+)/i);
      
      // Pattern 2b: "Odds:" or "Odds " followed by number
      if (!oddsMatch1) {
        oddsMatch1 = headerSection.match(/Odds[:\s]+([\d.]+)/i);
      }
      
      // Pattern 2c: Look for number after "Odds" but before "Max Bonus" (summary section)
      if (!oddsMatch1) {
        const oddsMaxBonusSection = headerSection.match(/Odds[^M]*?Max Bonus/i);
        if (oddsMaxBonusSection) {
          const oddsInSection = oddsMaxBonusSection[0].match(/Odds[:\s]*([\d.]+)/i);
          if (oddsInSection) {
            oddsMatch1 = oddsInSection;
          }
        }
      }
      
      // Pattern 2d: Look for "Odds" followed by any text and then a decimal number
      if (!oddsMatch1) {
        oddsMatch1 = headerSection.match(/Odds[^0-9]*?([\d]+\.[\d]{1,2})/i);
      }
      
      // Pattern 2e: Look for decimal numbers near "Odds" (within 200 chars)
      if (!oddsMatch1) {
        const oddsIndex = headerSection.toLowerCase().indexOf('odds');
        if (oddsIndex !== -1) {
          const oddsContext = headerSection.substring(oddsIndex, oddsIndex + 200);
          // Find all decimal numbers in context
          const decimalMatches = oddsContext.matchAll(/([\d]+\.[\d]{1,2})/g);
          for (const decimalMatch of decimalMatches) {
            const oddsValue = parseFloat(decimalMatch[1]);
            // Total odds are usually > 1.0 and reasonable (not too high)
            if (oddsValue >= 1.0 && oddsValue <= 10000) {
              // Check if it's not near team names
              const contextBefore = oddsContext.substring(0, decimalMatch.index);
              const isNearTeam = contextBefore.match(/vs|v\s+[A-Z]|-\s+[A-Z]/i);
              if (!isNearTeam) {
                oddsMatch1 = { 1: decimalMatch[1], index: oddsIndex + decimalMatch.index };
                break;
              }
            }
          }
        }
      }
      
      if (oddsMatch1) {
        const context = headerSection.substring(
          Math.max(0, (oddsMatch1.index || 0) - 200),
          Math.min(headerSection.length, (oddsMatch1.index || 0) + oddsMatch1[0].length + 200)
        );
        
        // Verify it's the total odds (should be in header, not near team names)
        // Check if it's near "Max Bonus", "Booking Code", or "Example Bet"
        const isInHeader = context.match(/Max Bonus|Booking Code|Example Bet|Sharing Code/i);
        const isNearTeam = context.match(/vs\s+[A-Z]|v\s+[A-Z]|-\s+[A-Z]|prematch/i);
        
        if (isInHeader && !isNearTeam) {
          totalOdds = parseFloat(oddsMatch1[1]);
          console.log(`✅ Extracted total odds from header: ${totalOdds}`);
        } else if (!isNearTeam && oddsMatch1[1]) {
          // If not near teams, it's likely the total odds
          totalOdds = parseFloat(oddsMatch1[1]);
          console.log(`✅ Extracted total odds (no team context): ${totalOdds}`);
        }
      }
    }
  }
  
  // Strategy 3: "Total Odds" anywhere in the text (case insensitive, flexible spacing)
  if (!totalOdds) {
    // Try multiple patterns for "Total Odds"
    const patterns = [
      /Total\s+Odds[:\s]*([\d.]+)/i,
      /Total\s*Odds[:\s]*([\d.]+)/i,
      /Odds[:\s]*([\d.]+)\s*Total/i,
      /Combined\s+Odds[:\s]*([\d.]+)/i,
      /Accumulator\s+Odds[:\s]*([\d.]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match) {
        totalOdds = parseFloat(match[1]);
        console.log(`✅ Extracted total odds from pattern "${pattern}": ${totalOdds}`);
        break;
      }
    }
  }
  
  // Strategy 4: Look for "Odds" that appears before "Max Bonus" (summary section)
  if (!totalOdds) {
    const maxBonusIndex = fullText.indexOf('Max Bonus');
    if (maxBonusIndex !== -1) {
      const summarySection = fullText.substring(Math.max(0, maxBonusIndex - 300), maxBonusIndex + 100);
      const oddsMatch = summarySection.match(/Odds[:\s]*([\d.]+)/i);
      if (oddsMatch) {
        totalOdds = parseFloat(oddsMatch[1]);
        console.log(`✅ Extracted total odds from summary section: ${totalOdds}`);
      }
    }
  }
  
  // Strategy 5: Look for odds in the slip summary area (near "Stake" or "Potential Win")
  if (!totalOdds) {
    const stakeIndex = fullText.indexOf('Stake');
    const potentialWinIndex = fullText.indexOf('Potential Win');
    const winIndex = fullText.indexOf('To Win');
    
    const summaryStart = Math.min(
      stakeIndex !== -1 ? stakeIndex : Infinity,
      potentialWinIndex !== -1 ? potentialWinIndex : Infinity,
      winIndex !== -1 ? winIndex : Infinity
    );
    
    if (summaryStart !== Infinity) {
      const summarySection = fullText.substring(Math.max(0, summaryStart - 500), summaryStart + 500);
      // Look for decimal numbers that could be total odds
      const allOdds = summarySection.matchAll(/([\d]+\.[\d]{1,2})/g);
      for (const oddsMatch of allOdds) {
        const oddsValue = parseFloat(oddsMatch[1]);
        // Total odds are usually > 1.0 and reasonable
        if (oddsValue >= 1.0 && oddsValue <= 10000) {
          const context = summarySection.substring(
            Math.max(0, oddsMatch.index - 50),
            Math.min(summarySection.length, oddsMatch.index + oddsMatch[0].length + 50)
          );
          // Check if it's near "Odds" or in summary context
          if (context.match(/Odds|Summary|Total/i) && !context.match(/vs|v\s+[A-Z]|prematch/i)) {
            totalOdds = oddsValue;
            console.log(`✅ Extracted total odds from summary area: ${totalOdds}`);
            break;
          }
        }
      }
    }
  }
  
  // Strategy 6: Look for any large decimal number in the header area (could be total odds)
  if (!totalOdds) {
    const bookingCodeIndex = fullText.indexOf('Booking Code');
    if (bookingCodeIndex !== -1) {
      const headerArea = fullText.substring(bookingCodeIndex, bookingCodeIndex + 1500);
      // Find all decimal numbers in header area
      const allDecimals = headerArea.matchAll(/([\d]+\.[\d]{1,2})/g);
      const candidates = [];
      for (const match of allDecimals) {
        const value = parseFloat(match[1]);
        if (value >= 1.0 && value <= 10000) {
          const context = headerArea.substring(Math.max(0, match.index - 50), Math.min(headerArea.length, match.index + match[0].length + 50));
          // Skip if near team names or individual match odds
          if (!context.match(/vs|v\s+[A-Z]|-\s+[A-Z]|prematch|home|away|draw/i)) {
            candidates.push({ value, index: match.index });
          }
        }
      }
      // If we have candidates, pick the one that appears first (likely total odds)
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.index - b.index);
        totalOdds = candidates[0].value;
        console.log(`✅ Extracted total odds from header area candidates: ${totalOdds}`);
      }
    }
  }
  
  // Strategy 7: Calculate from individual match odds as last resort (if we have matches)
  if (!totalOdds && matches.length > 0) {
    const calculatedOdds = matches.reduce((acc, m) => acc * (m.odds || 1.0), 1);
    // Only use calculated if it seems reasonable
    if (calculatedOdds >= 1.0 && calculatedOdds <= 10000) {
      totalOdds = calculatedOdds;
      console.log(`📊 Total odds calculated from matches: ${totalOdds.toFixed(2)}`);
    }
  }
  
  if (!totalOdds) {
    console.warn(`⚠️ Total odds not found in HTML for booking code: ${bookingCode}`);
    console.warn(`⚠️ Tried HTML selectors, header section, summary section, and calculation`);
    console.warn(`⚠️ Full text length: ${fullText.length}, Matches found: ${matches.length}`);
  } else {
    console.log(`✅ Final extracted total odds: ${totalOdds.toFixed(2)}`);
  }
  
  // Extract stake
  const stakeMatch = fullText.match(/Stake[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i);
  const stake = stakeMatch ? parseFloat(stakeMatch[1].replace(/,/g, '')) : null;
  
  // Extract potential win
  const winMatch = fullText.match(/(?:Potential|Possible)\s+Win[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i) ||
                   fullText.match(/To\s+Win[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i) ||
                   fullText.match(/(\d+\.\d+)\s*~\s*(\d+\.\d+)/); // "1.36 ~ 6.15" format
  
  let potentialWin = null;
  if (winMatch) {
    if (winMatch[2]) {
      // Range format: use the higher value
      potentialWin = parseFloat(winMatch[2]);
    } else {
      potentialWin = parseFloat(winMatch[1].replace(/,/g, ''));
    }
  }
  
  // Find earliest match date for expiration calculation
  let earliestMatchDate = null;
  if (matches.length > 0) {
    const datesWithMatches = matches
      .map(m => m.matchDate)
      .filter(d => d !== null && d !== undefined)
      .sort((a, b) => a - b);
    
    if (datesWithMatches.length > 0) {
      earliestMatchDate = datesWithMatches[0];
    }
  }
  
  // Ensure total odds is calculated if still null
  if (!totalOdds && matches.length > 0) {
    totalOdds = matches.reduce((acc, m) => acc * (m.odds || 1.0), 1);
    console.log(`📊 Total odds calculated from matches: ${totalOdds.toFixed(2)}`);
  }
  
  return {
    matches,
    totalOdds,
    stake,
    potentialWin,
    platform: 'SportyBet',
    bookingCode,
    earliestMatchDate: earliestMatchDate || null,
  };
}

/**
 * Parse Bet9ja HTML
 * URL format: https://web.bet9ja.com/share/{code}
 */
function parseBet9ja($, bookingCode) {
  const matches = [];
  
  // Similar structure, adjust selectors for Bet9ja
  $('.bet-row, .match-row, [data-match]').each((i, elem) => {
    const $elem = $(elem);
    
    const homeTeam = $elem.find('.team-home, .home').text().trim();
    const awayTeam = $elem.find('.team-away, .away').text().trim();
    const prediction = normalizePrediction($elem.find('.selection').text().trim());
    const odds = parseFloat($elem.find('.odd-value, .odds').text().trim()) || 1.0;
    
    if (homeTeam && awayTeam) {
      matches.push({
        homeTeam: cleanTeamName(homeTeam),
        awayTeam: cleanTeamName(awayTeam),
        prediction,
        odds,
        market: 'h2h',
      });
    }
  });

  return {
    matches,
    platform: 'Bet9ja',
    bookingCode,
  };
}

/**
 * Parse 1xBet HTML
 */
function parse1xBet($, bookingCode) {
  const matches = [];
  // Implement 1xBet parsing
  return {
    matches,
    platform: '1xBet',
    bookingCode,
  };
}

/**
 * Parse Betway HTML
 */
function parseBetway($, bookingCode) {
  const matches = [];
  // Implement Betway parsing
  return {
    matches,
    platform: 'Betway',
    bookingCode,
  };
}

/**
 * Parse MozzartBet HTML
 */
function parseMozzartBet($, bookingCode) {
  const matches = [];
  // Implement MozzartBet parsing
  return {
    matches,
    platform: 'MozzartBet',
    bookingCode,
  };
}

/**
 * Generic parser (fallback)
 */
function parseGeneric($, bookingCode) {
  const matches = [];
  
  // Try common patterns
  $('div, li, tr').each((i, elem) => {
    const text = $(elem).text();
    
    // Look for "Team1 vs Team2" patterns
    const vsMatch = text.match(/(.+?)\s+(?:vs|v|VS|V)\s+(.+)/i);
    if (vsMatch) {
      const homeTeam = cleanTeamName(vsMatch[1]);
      const awayTeam = cleanTeamName(vsMatch[2]);
      
      // Try to find odds nearby
      const oddsMatch = text.match(/(\d+\.\d+)/);
      const odds = oddsMatch ? parseFloat(oddsMatch[1]) : 1.0;
      
      matches.push({
        homeTeam,
        awayTeam,
        prediction: 'home',
        odds,
        market: 'h2h',
      });
    }
  });

  return {
    matches,
    platform: 'Other',
    bookingCode,
  };
}

/**
 * Helper: Clean team name
 */
function cleanTeamName(name) {
  return name
    .replace(/^\d+\.\s*/, '') // Remove leading numbers
    .replace(/\([^)]*\)/g, '') // Remove parentheses
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Helper: Normalize prediction text
 */
function normalizePrediction(text) {
  const upper = text.toUpperCase();
  
  if (upper.includes('HOME') || upper.includes('1') || upper === '1') return 'home';
  if (upper.includes('AWAY') || upper.includes('2') || upper === '2') return 'away';
  if (upper.includes('DRAW') || upper.includes('X') || upper === 'X') return 'draw';
  if (upper.includes('OVER')) return 'over';
  if (upper.includes('UNDER')) return 'under';
  if (upper.includes('YES') || upper.includes('BTTS')) return 'yes';
  if (upper.includes('NO')) return 'no';
  
  return 'home'; // Default
}

/**
 * Helper: Normalize market type
 */
function normalizeMarket(market) {
  const upper = market.toUpperCase();
  
  if (upper.includes('TOTAL') || upper.includes('OVER/UNDER')) return 'totals';
  if (upper.includes('BTTS') || upper.includes('BOTH TEAMS')) return 'btts';
  if (upper.includes('HANDICAP') || upper.includes('SPREAD')) return 'spreads';
  if (upper.includes('DOUBLE CHANCE')) return 'double_chance';
  
  return 'h2h'; // Default
}

module.exports = router;

