/**
 * Booking Code Scraper Service
 * 
 * Extracts match information from betting platform URLs using booking codes.
 * Works by fetching the HTML page and parsing match data.
 * 
 * Note: This should run on a backend server (Node.js) due to CORS restrictions.
 */

import { BettingPlatform } from './deeplink.service';

export interface ScrapedMatch {
  homeTeam: string;
  awayTeam: string;
  prediction: string;
  odds: number;
  market: string;
  matchDate?: Date;
  league?: string;
}

export interface ScrapedSlipData {
  matches: ScrapedMatch[];
  totalOdds?: number;
  stake?: number;
  potentialWin?: number;
  platform: BettingPlatform;
  bookingCode: string;
  earliestMatchDate?: Date | null; // Earliest match date for expiration
}

class BookingCodeScraperService {
  /**
   * Get web URL for platform with booking code
   */
  private getWebURL(platform: BettingPlatform, code: string): string {
    const webUrls: Record<BettingPlatform, string> = {
      SportyBet: `http://www.sportybet.com/gh/?shareCode=${code}`,
      Bet9ja: `https://web.bet9ja.com/share/${code}`,
      '1xBet': `https://1xbet.com/en/share/${code}`, // May need adjustment
      Betway: `https://betway.com.gh/share/${code}`, // May need adjustment
      MozzartBet: `https://www.mozzartbet.com/gh/share/${code}`, // May need adjustment
      Other: `https://betting.com`,
    };

    return webUrls[platform] || `https://${platform.toLowerCase()}.com/share/${code}`;
  }

  /**
   * Scrape match data from booking code URL
   * 
   * Calls backend API to scrape betting platform pages.
   * Backend URL should be configured in your environment.
   */
  async scrapeFromBookingCode(
    platform: BettingPlatform,
    bookingCode: string,
    serverUrl?: string
  ): Promise<ScrapedSlipData> {
    const url = this.getWebURL(platform, bookingCode);
    const apiUrl = serverUrl || process.env.API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${apiUrl}/api/scrape-booking-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, bookingCode, url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusText = errorData.error || errorData.message || response.statusText;
        
        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error('Booking code not found. The code may be invalid or expired.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. The booking code may be private.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(statusText || `Failed to scrape: ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Check if the response indicates success but no matches
      if (!data.success && data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error: any) {
      console.error('Error scraping booking code:', error);
      
      // Re-throw with better error message if it's already our custom error
      if (error.message && !error.message.includes('Failed to scrape booking code')) {
        throw error;
      }
      
      // Handle network errors
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        throw new Error('Cannot connect to server. Make sure the backend server is running on http://localhost:3001');
      }
      
      throw new Error(`Failed to scrape booking code: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Parse HTML content (platform-specific parsers)
   */
  private parseHTML(html: string, platform: BettingPlatform): ScrapedSlipData {
    switch (platform) {
      case 'SportyBet':
        return this.parseSportyBet(html);
      case 'Bet9ja':
        return this.parseBet9ja(html);
      case '1xBet':
        return this.parse1xBet(html);
      case 'Betway':
        return this.parseBetway(html);
      case 'MozzartBet':
        return this.parseMozzartBet(html);
      default:
        return this.parseGeneric(html);
    }
  }

  /**
   * Parse SportyBet HTML
   */
  private parseSportyBet(html: string): ScrapedSlipData {
    const matches: ScrapedMatch[] = [];
    
    // SportyBet structure (example - needs actual HTML inspection)
    // Look for patterns like:
    // - Team names in specific divs/classes
    // - Odds in nearby elements
    // - Predictions (1, X, 2, Over, Under, etc.)
    
    // Example regex patterns (adjust based on actual HTML):
    const teamPattern = /<div[^>]*class="[^"]*team[^"]*"[^>]*>([^<]+)<\/div>/gi;
    const oddsPattern = /<span[^>]*class="[^"]*odds[^"]*"[^>]*>([\d.]+)<\/span>/gi;
    
    // Implementation would parse actual HTML structure
    // This is a placeholder showing the approach
    
    return {
      matches,
      platform: 'SportyBet',
      bookingCode: '',
    };
  }

  /**
   * Parse Bet9ja HTML
   */
  private parseBet9ja(html: string): ScrapedSlipData {
    const matches: ScrapedMatch[] = [];
    // Similar approach for Bet9ja
    return {
      matches,
      platform: 'Bet9ja',
      bookingCode: '',
    };
  }

  /**
   * Parse 1xBet HTML
   */
  private parse1xBet(html: string): ScrapedSlipData {
    const matches: ScrapedMatch[] = [];
    return {
      matches,
      platform: '1xBet',
      bookingCode: '',
    };
  }

  /**
   * Parse Betway HTML
   */
  private parseBetway(html: string): ScrapedSlipData {
    const matches: ScrapedMatch[] = [];
    return {
      matches,
      platform: 'Betway',
      bookingCode: '',
    };
  }

  /**
   * Parse MozzartBet HTML
   */
  private parseMozzartBet(html: string): ScrapedSlipData {
    const matches: ScrapedMatch[] = [];
    return {
      matches,
      platform: 'MozzartBet',
      bookingCode: '',
    };
  }

  /**
   * Generic parser fallback
   */
  private parseGeneric(html: string): ScrapedSlipData {
    const matches: ScrapedMatch[] = [];
    
    // Try to find common patterns across platforms
    // Team names, scores, odds, etc.
    
    return {
      matches,
      platform: 'Other',
      bookingCode: '',
    };
  }
}

export const BookingCodeScraper = new BookingCodeScraperService();

