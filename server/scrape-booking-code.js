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
      
      // Wait longer for betting slip content to fully load
      console.log('⏳ Waiting for page content to load...');
      try {
        // Try multiple selectors that might contain match data
        await page.waitForSelector('.bet-item, .match-item, [class*="bet"], [class*="match"], [class*="slip"], [class*="selection"]', { timeout: 15000 });
        console.log('✅ Found betting slip content');
      } catch (e) {
        console.log('⚠️ Selector not found, waiting additional time for content...');
        // Wait longer if selector not found - content might still be loading
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Additional wait to ensure all dynamic content is loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Scroll down to trigger lazy loading if any
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

  // Get all text content
  const fullText = $('body').text();
  
  // Find the section with the sharing code (contains the slip data)
  const codeIndex = fullText.indexOf(`Sharing Code ${bookingCode}`);
  if (codeIndex === -1) {
    // Try alternative: look in betslip section
    const betslipText = $('.m-betslip-wrapper, [id*="bet"], [class*="betslip"]').text();
    return parseFromBetslipText(betslipText, bookingCode);
  }
  
  // Extract slip section (increase to 5000 chars to catch more matches)
  const slipSection = fullText.substring(codeIndex, codeIndex + 5000);
  
  // Also get betslip display section for accurate odds
  const betslipText = $('.m-betslip-wrapper, [id*="bet"], [class*="betslip"]').text();
  
  console.log(`📊 Slip section length: ${slipSection.length} chars`);
  console.log(`📊 Betslip text length: ${betslipText.length} chars`);
  
  // Pattern: "Team1 - Team2 prematch PredictionOdds"
  // Example: "Alverca Futebol - Porto prematch Away37967"
  // Note: The number after prediction might be an ID, not odds
  const matchPattern = /\b([A-Z][a-zA-Z\s]+?)\s*-\s*([A-Z][a-zA-Z\s]+?)\s+prematch\s+(Home|Away|Draw|Over|Under)(\d+)/g;
  let match;
  
  while ((match = matchPattern.exec(slipSection)) !== null) {
    // Skip if it's part of "Sharing Code" or date
    if (match[0].includes('Sharing Code') || match[0].includes('22/12/2025')) {
      continue;
    }
    
    const homeTeam = cleanTeamName(match[1].trim());
    const awayTeam = cleanTeamName(match[2].trim());
    const predictionText = match[3].trim();
    
    // Skip if team names are too short or invalid
    if (homeTeam.length < 3 || awayTeam.length < 3) {
      continue;
    }
    
    // Try to find actual odds from betslip display
    // The betslip shows: "Alverca Futebol v Porto\n       1X2    1.38 B  Away"
    // Format: Team1 v Team2\n       1X2    <odds> B  <prediction>
    const escapedHome = homeTeam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedAway = awayTeam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern: Find team names, then look for market type (1X2), then odds
    // "Team1 v Team2\n       1X2    1.38"
    const teamPattern = new RegExp(`${escapedHome}\\s+v\\s+${escapedAway}[\\s\\S]{0,200}?1X2[\\s\\S]{0,50}?(\\d+\\.\\d+)`, 'i');
    let oddsMatch = betslipText.match(teamPattern);
    
    // If not found, try simpler pattern: team name followed by odds
    if (!oddsMatch) {
      oddsMatch = betslipText.match(new RegExp(`${escapedHome}\\s+v\\s+${escapedAway}[^\\d]*(\\d+\\.\\d+)`, 'i'));
    }
    
    // Last resort: just team name followed by odds
    if (!oddsMatch) {
      oddsMatch = betslipText.match(new RegExp(`${escapedHome}[^\\d]{0,100}(\\d+\\.\\d+)`, 'i'));
    }
    
    let odds = 1.0;
    if (oddsMatch && oddsMatch[1]) {
      // Found odds in betslip display (e.g., "1.38")
      odds = parseFloat(oddsMatch[1]);
      // Validate odds are reasonable (between 1.01 and 1000)
      if (odds < 1.01 || odds > 1000) {
        odds = 1.0; // Reset if invalid
      }
    } else {
      // Fallback: The number after prediction might be encoded odds
      // "Away37967" - try different interpretations
      const idNumber = parseFloat(match[4]);
      if (idNumber > 100000) {
        odds = idNumber / 100000; // "37967" = 0.37967 (unlikely)
      } else if (idNumber > 10000) {
        odds = idNumber / 10000; // "37967" = 3.7967
      } else if (idNumber > 100) {
        odds = idNumber / 100; // "379" = 3.79
      } else {
        odds = idNumber / 10; // "37" = 3.7
      }
    }
    
    const prediction = normalizePrediction(predictionText);
    
    // Extract market type - default to 'h2h' (which displays as '1X2')
    // Most SportyBet bets are 1X2 (h2h)
    const market = 'h2h';
    
    // Extract match date/time from slip section
    // Pattern: "22/12/2025 18:45" or "22/12/2025 20:00" before/after team names
    const datePattern = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/g;
    let matchDate = null;
    
    // Look for date/time near this match (within 200 chars before/after)
    const matchContext = slipSection.substring(
      Math.max(0, match.index - 200),
      match.index + match[0].length + 200
    );
    const dateMatch = datePattern.exec(matchContext);
    if (dateMatch) {
      try {
        // Parse date: "22/12/2025 18:45" -> Date object
        const [day, month, year] = dateMatch[1].split('/');
        const [hours, minutes] = dateMatch[2].split(':');
        matchDate = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
      } catch (e) {
        console.warn('Failed to parse match date:', dateMatch[0]);
      }
    }
    
    // Avoid duplicates
    const exists = matches.some(m => m.homeTeam === homeTeam && m.awayTeam === awayTeam);
    if (!exists) {
      matches.push({
        homeTeam,
        awayTeam,
        prediction,
        odds: odds || 1.0,
        market: 'h2h',
        matchDate: matchDate || null,
      });
    }
  }
  
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
  
  // Extract total odds - look in the header section near "Booking Code"
  // Pattern: "Odds" followed by a number (usually in the summary section)
  // Try multiple patterns to catch different formats
  let totalOdds = null;
  
  // Pattern 1: Look for "Odds" in the header section (near "Booking Code" and "Max Bonus")
  // Format from screenshot: "Odds" label with value "3.17" in header
  const bookingCodeIndex = fullText.indexOf('Booking Code');
  if (bookingCodeIndex !== -1) {
    // Look in the section around booking code (next 800 chars to catch more context)
    const headerSection = fullText.substring(bookingCodeIndex, bookingCodeIndex + 800);
    
    // Try multiple patterns for "Odds" value
    // Pattern 1a: "Odds" followed by whitespace and number (most common)
    let oddsMatch1 = headerSection.match(/Odds\s+([\d.]+)/i);
    
    // Pattern 1b: "Odds:" or "Odds " followed by number
    if (!oddsMatch1) {
      oddsMatch1 = headerSection.match(/Odds[:\s]+([\d.]+)/i);
    }
    
    // Pattern 1c: Look for number after "Odds" but before "Max Bonus" (summary section)
    if (!oddsMatch1) {
      const oddsMaxBonusSection = headerSection.match(/Odds[^M]*?Max Bonus/i);
      if (oddsMaxBonusSection) {
        const oddsInSection = oddsMaxBonusSection[0].match(/Odds[:\s]*([\d.]+)/i);
        if (oddsInSection) {
          oddsMatch1 = oddsInSection;
        }
      }
    }
    
    if (oddsMatch1) {
      const context = headerSection.substring(
        Math.max(0, oddsMatch1.index - 150),
        Math.min(headerSection.length, oddsMatch1.index + oddsMatch1[0].length + 150)
      );
      
      // Verify it's the total odds (should be in header, not near team names)
      // Check if it's near "Max Bonus", "Booking Code", or "Example Bet"
      const isInHeader = context.match(/Max Bonus|Booking Code|Example Bet|FCN9VA/i);
      const isNearTeam = context.match(/vs\s+[A-Z]|v\s+[A-Z]|-\s+[A-Z]/i);
      
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
  
  // Pattern 2: "Total Odds" anywhere in the text
  if (!totalOdds) {
    const totalOddsMatch = fullText.match(/Total\s+Odds[:\s]*([\d.]+)/i);
    if (totalOddsMatch) {
      totalOdds = parseFloat(totalOddsMatch[1]);
      console.log(`✅ Extracted total odds from "Total Odds": ${totalOdds}`);
    }
  }
  
  // Pattern 3: Look for "Odds" that appears before "Max Bonus" (summary section)
  if (!totalOdds) {
    const maxBonusIndex = fullText.indexOf('Max Bonus');
    if (maxBonusIndex !== -1) {
      const summarySection = fullText.substring(Math.max(0, maxBonusIndex - 200), maxBonusIndex + 100);
      const oddsMatch = summarySection.match(/Odds[:\s]*([\d.]+)/i);
      if (oddsMatch) {
        totalOdds = parseFloat(oddsMatch[1]);
        console.log(`✅ Extracted total odds from summary section: ${totalOdds}`);
      }
    }
  }
  
  // Don't calculate - only use extracted odds from HTML
  if (!totalOdds) {
    console.warn(`⚠️ Total odds not found in HTML for booking code: ${bookingCode}`);
  } else {
    console.log(`✅ Extracted total odds from booking code: ${totalOdds.toFixed(2)}`);
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

