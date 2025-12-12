/**
 * Betting Slip Parser
 * 
 * Parses OCR text from betting slips to extract:
 * - Matches
 * - Odds
 * - Predictions
 * - Booking codes
 * - Stake amounts
 */

import { Match, SportsAPI } from './sports-api.service';

export interface ParsedMatch {
  homeTeam: string;
  awayTeam: string;
  prediction: string;
  odds: number;
  market: string;
}

export interface ParsedSlip {
  matches: ParsedMatch[];
  bookingCode?: string;
  totalOdds?: number;
  stake?: number;
  potentialWin?: number;
  platform?: 'SportyBet' | 'Bet9ja' | '1xBet' | 'Betway' | 'MozzartBet' | 'Other';
}

class SlipParserService {
  /**
   * Parse OCR text to extract slip information
   */
  parseSlipText(text: string): ParsedSlip {
    const parsed: ParsedSlip = {
      matches: [],
    };

    try {
      // Normalize text
      const normalizedText = text.toUpperCase().replace(/\s+/g, ' ').trim();

      // Detect platform
      parsed.platform = this.detectPlatform(normalizedText);

      // Extract booking code
      parsed.bookingCode = this.extractBookingCode(normalizedText);

      // Extract total odds
      parsed.totalOdds = this.extractTotalOdds(normalizedText);

      // Extract stake
      parsed.stake = this.extractStake(normalizedText);

      // Extract potential win
      parsed.potentialWin = this.extractPotentialWin(normalizedText);

      // Extract matches
      parsed.matches = this.extractMatches(normalizedText);

      return parsed;
    } catch (error) {
      console.error('Error parsing slip text:', error);
      return parsed;
    }
  }

  /**
   * Detect betting platform from text
   */
  private detectPlatform(text: string): ParsedSlip['platform'] {
    if (text.includes('SPORTYBET')) return 'SportyBet';
    if (text.includes('BET9JA')) return 'Bet9ja';
    if (text.includes('1XBET')) return '1xBet';
    if (text.includes('BETWAY')) return 'Betway';
    if (text.includes('MOZZART')) return 'MozzartBet';
    return 'Other';
  }

  /**
   * Extract booking code from text
   */
  private extractBookingCode(text: string): string | undefined {
    // Common patterns for booking codes
    const patterns = [
      /BOOKING CODE[:\s]*([A-Z0-9]{6,12})/i,
      /CODE[:\s]*([A-Z0-9]{6,12})/i,
      /SLIP CODE[:\s]*([A-Z0-9]{6,12})/i,
      /BET ID[:\s]*([A-Z0-9]{6,12})/i,
      /\b([A-Z0-9]{8,12})\b/i, // Generic alphanumeric code
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract total odds from text
   */
  private extractTotalOdds(text: string): number | undefined {
    const patterns = [
      /TOTAL ODDS[:\s]*([\d.]+)/i,
      /ODDS[:\s]*([\d.]+)/i,
      /TOTAL[:\s]*([\d.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const odds = parseFloat(match[1]);
        if (!isNaN(odds) && odds > 1 && odds < 10000) {
          return odds;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract stake amount from text
   */
  private extractStake(text: string): number | undefined {
    const patterns = [
      /STAKE[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
      /AMOUNT[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
      /BET AMOUNT[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const stake = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(stake) && stake > 0) {
          return stake;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract potential win from text
   */
  private extractPotentialWin(text: string): number | undefined {
    const patterns = [
      /POTENTIAL WIN[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
      /POSSIBLE WIN[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
      /TO WIN[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
      /PAYOUT[:\s]*(?:GHS|GH₵|₵)?\s*([\d,.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const win = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(win) && win > 0) {
          return win;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract individual matches from text
   */
  private extractMatches(text: string): ParsedMatch[] {
    const matches: ParsedMatch[] = [];

    // Split text into lines
    const lines = text.split(/\n|\\n/).map(l => l.trim()).filter(l => l.length > 0);

    // Common team name patterns
    const vsPatterns = [
      /(.+?)\s+VS\.?\s+(.+)/i,
      /(.+?)\s+V\s+(.+)/i,
      /(.+?)\s+-\s+(.+)/i,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Try to find team names
      for (const pattern of vsPatterns) {
        const match = line.match(pattern);
        if (match) {
          const homeTeam = this.cleanTeamName(match[1]);
          const awayTeam = this.cleanTeamName(match[2]);

          // Look for odds in nearby lines
          const odds = this.findOddsNearLine(lines, i);
          const prediction = this.findPredictionNearLine(lines, i);

          if (homeTeam && awayTeam && odds) {
            matches.push({
              homeTeam,
              awayTeam,
              prediction: prediction || 'Unknown',
              odds,
              market: 'h2h',
            });
          }
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Clean team name
   */
  private cleanTeamName(name: string): string {
    return name
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/\([^)]*\)/g, '') // Remove parentheses
      .trim();
  }

  /**
   * Find odds near a line
   */
  private findOddsNearLine(lines: string[], lineIndex: number): number | undefined {
    // Check current and next 2 lines for odds pattern
    for (let i = lineIndex; i < Math.min(lineIndex + 3, lines.length); i++) {
      const match = lines[i].match(/([\d.]+)/);
      if (match) {
        const odds = parseFloat(match[1]);
        if (!isNaN(odds) && odds >= 1.01 && odds <= 1000) {
          return odds;
        }
      }
    }
    return undefined;
  }

  /**
   * Find prediction/market near a line
   */
  private findPredictionNearLine(lines: string[], lineIndex: number): string | undefined {
    const predictions = [
      'HOME WIN', '1', 'HOME',
      'DRAW', 'X',
      'AWAY WIN', '2', 'AWAY',
      'OVER', 'UNDER',
      'BOTH TEAMS TO SCORE', 'BTTS', 'GG',
      'DOUBLE CHANCE',
    ];

    for (let i = lineIndex; i < Math.min(lineIndex + 3, lines.length); i++) {
      const line = lines[i].toUpperCase();
      for (const pred of predictions) {
        if (line.includes(pred)) {
          return pred;
        }
      }
    }
    return undefined;
  }

  /**
   * Match parsed teams to Sports API matches
   */
  async matchToSportsAPI(parsedMatch: ParsedMatch): Promise<Match | null> {
    try {
      // Get upcoming matches
      const matches = await SportsAPI.getAllUpcomingMatches();

      // Find best match using fuzzy matching
      let bestMatch: Match | null = null;
      let bestScore = 0;

      for (const match of matches) {
        const score = this.calculateMatchScore(
          parsedMatch.homeTeam,
          parsedMatch.awayTeam,
          match.home_team,
          match.away_team
        );

        if (score > bestScore && score > 0.6) { // 60% threshold
          bestScore = score;
          bestMatch = match;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Error matching to Sports API:', error);
      return null;
    }
  }

  /**
   * Calculate similarity score between parsed and API match
   */
  private calculateMatchScore(
    parsedHome: string,
    parsedAway: string,
    apiHome: string,
    apiAway: string
  ): number {
    const homeScore = this.stringSimilarity(parsedHome.toLowerCase(), apiHome.toLowerCase());
    const awayScore = this.stringSimilarity(parsedAway.toLowerCase(), apiAway.toLowerCase());
    return (homeScore + awayScore) / 2;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

export const SlipParser = new SlipParserService();

