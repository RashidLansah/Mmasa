/**
 * Sports API Service
 * 
 * Integrates with:
 * 1. The Odds API - For odds and markets (h2h, totals, spreads)
 * 2. API-Football - For match scores and results
 * 
 * Free tiers:
 * - The Odds API: 500 requests/month
 * - API-Football: 100 requests/day (free plan)
 * 
 * Get API keys:
 * - https://the-odds-api.com/
 * - https://www.api-football.com/
 */

import { TeamAliasService } from './team-alias.service';

// The Odds API (for odds and markets)
// SECURITY: Use environment variables in production
// For React Native, use expo-constants or react-native-config
const THE_ODDS_API_KEY = process.env.ODDS_API_KEY || '063346656bae78faf608f5f6fed231e6'; // ⚠️ TODO: Move to .env
const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4';

// API-Football (for scores and results)
// SECURITY: Use environment variables in production
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || 'c2cff9ab4ef7ae228a2dc5dae9cebbab'; // ⚠️ TODO: Move to .env
const FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

export type Sport = 
  | 'soccer_epl' // English Premier League
  | 'soccer_spain_la_liga' // La Liga
  | 'soccer_italy_serie_a' // Serie A
  | 'soccer_germany_bundesliga' // Bundesliga
  | 'soccer_uefa_champs_league' // Champions League
  | 'soccer_uefa_europa_league' // Europa League
  | 'basketball_nba' // NBA
  | 'americanfootball_nfl'; // NFL

export interface Match {
  id: string;
  sport_key: Sport;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

export interface Market {
  key: string; // 'h2h', 'spreads', 'totals'
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number; // Decimal odds
  point?: number; // For spreads/totals
}

export interface MatchResult {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  completed: boolean;
  status: string; // 'FT', 'HT', 'LIVE', etc.
}

export type BetType = 
  | 'h2h'           // Home/Away/Draw
  | 'totals'        // Over/Under
  | 'spreads'       // Handicap
  | 'btts'          // Both Teams To Score
  | 'double_chance' // 1X, X2, 12
  | 'correct_score'; // Exact score

export interface BetSelection {
  match: Match;
  betType: BetType;
  prediction: string; // 'home', 'away', 'draw', 'over_2.5', 'under_2.5', etc.
  odds: number;
  market: string;
  line?: number; // For totals (e.g., 2.5) or spreads (e.g., -1.5)
}

class SportsAPIService {
  private oddsApiKey: string;
  private footballApiKey: string;
  private oddsBaseUrl: string;
  private footballBaseUrl: string;

  constructor() {
    this.oddsApiKey = THE_ODDS_API_KEY;
    this.footballApiKey = API_FOOTBALL_KEY;
    this.oddsBaseUrl = ODDS_BASE_URL;
    this.footballBaseUrl = FOOTBALL_BASE_URL;
  }

  /**
   * Fetch upcoming matches for a specific sport with multiple markets
   */
  async getUpcomingMatches(sport: Sport, markets: BetType[] = ['h2h', 'totals', 'spreads']): Promise<Match[]> {
    try {
      const marketString = markets.join(',');
      const response = await fetch(
        `${this.oddsBaseUrl}/sports/${sport}/odds/?apiKey=${this.oddsApiKey}&regions=uk,us&markets=${marketString}&oddsFormat=decimal`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Fetch matches for multiple sports
   */
  async getAllUpcomingMatches(): Promise<Match[]> {
    const sports: Sport[] = [
      'soccer_epl',
      'soccer_spain_la_liga',
      'soccer_italy_serie_a',
      'soccer_germany_bundesliga',
      'soccer_uefa_champs_league',
    ];

    try {
      const matchPromises = sports.map(sport => 
        this.getUpcomingMatches(sport).catch(err => {
          console.warn(`Failed to fetch ${sport}:`, err);
          return [];
        })
      );

      const results = await Promise.all(matchPromises);
      return results.flat();
    } catch (error) {
      console.error('Error fetching all matches:', error);
      return [];
    }
  }

  /**
   * Get match by ID
   */
  async getMatchById(sport: Sport, matchId: string): Promise<Match | null> {
    try {
      const matches = await this.getUpcomingMatches(sport);
      return matches.find(m => m.id === matchId) || null;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  }

  /**
   * Get match result/score from API-Football
   */
  async getMatchResult(fixtureId: number): Promise<MatchResult | null> {
    try {
      const response = await fetch(
        `${this.footballBaseUrl}/fixtures?id=${fixtureId}`,
        {
          headers: {
            'x-rapidapi-key': this.footballApiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response && data.response.length > 0) {
        const fixture = data.response[0];
        const isCompleted = fixture.fixture.status.short === 'FT';
        
        return {
          id: fixture.fixture.id.toString(),
          home_team: fixture.teams.home.name,
          away_team: fixture.teams.away.name,
          home_score: fixture.goals.home || 0,
          away_score: fixture.goals.away || 0,
          completed: isCompleted,
          status: fixture.fixture.status.short
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching match result:', error);
      return null;
    }
  }

  /**
   * Search for live fixtures by team names and return fixture ID with match date
   * Tries multiple strategies: with date, without date, and with team name variations
   * Uses TeamAliasService for caching and improved matching
   */
  async searchFixtureByTeams(homeTeam: string, awayTeam: string, date?: Date): Promise<{ fixtureId: number; matchDate: Date | null } | null> {
    try {
      const homeTeamLower = homeTeam.toLowerCase().trim();
      const awayTeamLower = awayTeam.toLowerCase().trim();
      
      // Check team alias cache first (reduces API calls)
      const homeAlias = await TeamAliasService.getTeamAlias(homeTeam, 'SportyBet');
      const awayAlias = await TeamAliasService.getTeamAlias(awayTeam, 'SportyBet');
      
      // If we have team IDs from cache, try searching by IDs first (more reliable)
      if (homeAlias?.apiFootballTeamId && awayAlias?.apiFootballTeamId) {
        console.log(`📦 Using cached team IDs: ${homeAlias.apiFootballTeamId} vs ${awayAlias.apiFootballTeamId}`);
        const result = await this.searchFixtureByTeamIds(
          homeAlias.apiFootballTeamId,
          awayAlias.apiFootballTeamId,
          date
        );
        if (result) {
          return result;
        }
        // If ID search fails, fall through to name-based search
      }
      
      // Strategy 1: Search with date if provided
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        const result = await this.searchFixtureByDateAndTeams(dateStr, homeTeamLower, awayTeamLower);
        if (result) {
          return result;
        }
      }
      
      // Strategy 2: Search today's fixtures
      const todayStr = new Date().toISOString().split('T')[0];
      const resultToday = await this.searchFixtureByDateAndTeams(todayStr, homeTeamLower, awayTeamLower);
      if (resultToday) {
        return resultToday;
      }
      
      // Strategy 3: Search next 14 days for future matches
      // This is important because matches might be scheduled days or weeks in advance
      for (let daysAhead = 1; daysAhead <= 14; daysAhead++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        const result = await this.searchFixtureByDateAndTeams(futureDateStr, homeTeamLower, awayTeamLower);
        if (result) {
          console.log(`✅ Found match ${daysAhead} day(s) in the future`);
          return result;
        }
      }
      
      // Strategy 4: Search yesterday's fixtures (in case date is off by one)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const resultYesterday = await this.searchFixtureByDateAndTeams(yesterdayStr, homeTeamLower, awayTeamLower);
      if (resultYesterday) {
        return resultYesterday;
      }
      
      // Strategy 5: Try searching for next matches (future matches) without date
      try {
        const response = await fetch(
          `${this.footballBaseUrl}/fixtures?team=${encodeURIComponent(homeTeam)}&next=10`,
          {
            headers: {
              'x-rapidapi-key': this.footballApiKey,
              'x-rapidapi-host': 'v3.football.api-sports.io'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.response && data.response.length > 0) {
            const match = this.findMatchInResponse(data.response, homeTeamLower, awayTeamLower);
            if (match) {
              // Extract match date from API response
              // API-Football returns dates in ISO 8601 format (UTC)
              let matchDate: Date | null = null;
              if (match.fixture.date) {
                matchDate = new Date(match.fixture.date);
                // Log for debugging
                const now = new Date();
                const diffMinutes = (matchDate.getTime() - now.getTime()) / (1000 * 60);
                console.log(`📅 API match date (next matches search):`, {
                  raw: match.fixture.date,
                  parsed: matchDate.toISOString(),
                  diffMinutes: Math.round(diffMinutes),
                  isFuture: matchDate.getTime() > now.getTime()
                });
              }
              // Save successful match to team alias cache (for future use)
              TeamAliasService.saveTeamAlias(
                homeTeam,
                'SportyBet',
                match.teams.home.id,
                match.teams.home.name
              ).catch(err => console.warn('Failed to save home team alias:', err));
              
              TeamAliasService.saveTeamAlias(
                awayTeam,
                'SportyBet',
                match.teams.away.id,
                match.teams.away.name
              ).catch(err => console.warn('Failed to save away team alias:', err));
              
              return { fixtureId: match.fixture.id, matchDate };
            }
          }
        }
      } catch (e) {
        // Ignore errors for this fallback
        console.warn('Error in next matches search:', e);
      }
      
      return null;
    } catch (error) {
      console.error('Error searching fixture:', error);
      return null;
    }
  }

  /**
   * Search fixtures by team IDs (more reliable than name matching)
   * Uses API-Football team IDs from cache
   */
  private async searchFixtureByTeamIds(
    homeTeamId: number,
    awayTeamId: number,
    date?: Date
  ): Promise<{ fixtureId: number; matchDate: Date | null } | null> {
    try {
      // Try with date if provided
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        const result = await this.searchFixtureByDateAndTeamIds(dateStr, homeTeamId, awayTeamId);
        if (result) return result;
      }
      
      // Try today
      const todayStr = new Date().toISOString().split('T')[0];
      const resultToday = await this.searchFixtureByDateAndTeamIds(todayStr, homeTeamId, awayTeamId);
      if (resultToday) return resultToday;
      
      // Try next 7 days
      for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        const result = await this.searchFixtureByDateAndTeamIds(futureDateStr, homeTeamId, awayTeamId);
        if (result) return result;
      }
      
      return null;
    } catch (error) {
      console.warn('Error searching by team IDs:', error);
      return null;
    }
  }

  /**
   * Search fixtures for a specific date using team IDs
   */
  private async searchFixtureByDateAndTeamIds(
    dateStr: string,
    homeTeamId: number,
    awayTeamId: number
  ): Promise<{ fixtureId: number; matchDate: Date | null } | null> {
    try {
      // Search fixtures for home team on this date
      const response = await fetch(
        `${this.footballBaseUrl}/fixtures?date=${dateStr}&team=${homeTeamId}`,
        {
          headers: {
            'x-rapidapi-key': this.footballApiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.length > 0) {
          // Find fixture where opponent is awayTeamId
          const match = data.response.find((f: any) => 
            (f.teams.home.id === homeTeamId && f.teams.away.id === awayTeamId) ||
            (f.teams.home.id === awayTeamId && f.teams.away.id === homeTeamId)
          );
          
          if (match) {
            console.log(`✅ Found match by team IDs: ${match.teams.home.name} vs ${match.teams.away.name}`);
            return this.extractMatchData(match, '', ''); // Names not needed for ID-based search
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error searching by team IDs and date:', error);
      return null;
    }
  }

  /**
   * Helper: Search fixtures for a specific date and return fixture ID with match date
   */
  private async searchFixtureByDateAndTeams(dateStr: string, homeTeamLower: string, awayTeamLower: string): Promise<{ fixtureId: number; matchDate: Date | null } | null> {
    try {
      // Try multiple search strategies
      // Strategy 1: Search with home team
      let response = await fetch(
        `${this.footballBaseUrl}/fixtures?date=${dateStr}&team=${encodeURIComponent(homeTeamLower)}`,
        {
          headers: {
            'x-rapidapi-key': this.footballApiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
          }
        }
      );

      let data: any = null;
      if (response.ok) {
        data = await response.json();
        if (data.response && data.response.length > 0) {
          console.log(`🔍 Found ${data.response.length} fixture(s) for date ${dateStr} with team "${homeTeamLower}"`);
          const match = this.findMatchInResponse(data.response, homeTeamLower, awayTeamLower);
          if (match) {
            // Save to cache for future use
            TeamAliasService.saveTeamAlias(
              homeTeamLower,
              'SportyBet',
              match.teams.home.id,
              match.teams.home.name
            ).catch(err => console.warn('Failed to save home team alias:', err));
            
            TeamAliasService.saveTeamAlias(
              awayTeamLower,
              'SportyBet',
              match.teams.away.id,
              match.teams.away.name
            ).catch(err => console.warn('Failed to save away team alias:', err));
            
            return this.extractMatchData(match, homeTeamLower, awayTeamLower);
          } else {
            // Log what teams were found for debugging
            const foundTeams = data.response.slice(0, 3).map((f: any) => 
              `${f.teams.home.name} vs ${f.teams.away.name}`
            );
            console.log(`⚠️ Match not found in results. Found teams: ${foundTeams.join(', ')}...`);
          }
        }
      }

      // Strategy 2: Search with away team
      response = await fetch(
        `${this.footballBaseUrl}/fixtures?date=${dateStr}&team=${encodeURIComponent(awayTeamLower)}`,
        {
          headers: {
            'x-rapidapi-key': this.footballApiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
          }
        }
      );

      if (response.ok) {
        data = await response.json();
        if (data.response && data.response.length > 0) {
          console.log(`🔍 Found ${data.response.length} fixture(s) for date ${dateStr} with team "${awayTeamLower}"`);
          const match = this.findMatchInResponse(data.response, homeTeamLower, awayTeamLower);
          if (match) {
            // Save to cache
            TeamAliasService.saveTeamAlias(
              awayTeamLower,
              'SportyBet',
              match.teams.away.id,
              match.teams.away.name
            ).catch(err => console.warn('Failed to save team alias:', err));
            
            return this.extractMatchData(match, homeTeamLower, awayTeamLower);
          }
        }
      }

      // Strategy 3: Search without team filter (get all fixtures for date, then filter)
      // This is more expensive but might find matches if team names don't match
      response = await fetch(
        `${this.footballBaseUrl}/fixtures?date=${dateStr}`,
        {
          headers: {
            'x-rapidapi-key': this.footballApiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
          }
        }
      );

      if (response.ok) {
        data = await response.json();
        if (data.response && data.response.length > 0) {
          console.log(`🔍 Found ${data.response.length} total fixture(s) for date ${dateStr}, searching for match...`);
          const match = this.findMatchInResponse(data.response, homeTeamLower, awayTeamLower);
          if (match) {
            // Save to cache
            TeamAliasService.saveTeamAlias(
              homeTeamLower,
              'SportyBet',
              match.teams.home.id,
              match.teams.home.name
            ).catch(err => console.warn('Failed to save team alias:', err));
            
            TeamAliasService.saveTeamAlias(
              awayTeamLower,
              'SportyBet',
              match.teams.away.id,
              match.teams.away.name
            ).catch(err => console.warn('Failed to save team alias:', err));
            
            return this.extractMatchData(match, homeTeamLower, awayTeamLower);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Error searching fixtures for ${homeTeamLower} vs ${awayTeamLower} on ${dateStr}:`, error);
      return null;
    }
  }

  /**
   * Extract match data from API response
   */
  private extractMatchData(match: any, homeTeamLower: string, awayTeamLower: string): { fixtureId: number; matchDate: Date | null } {
    let matchDate: Date | null = null;
    if (match.fixture.date) {
      const rawDate = match.fixture.date;
      matchDate = new Date(rawDate);
      const now = new Date();
      const matchTimestamp = matchDate.getTime();
      const nowTimestamp = now.getTime();
      const diffMinutes = (matchTimestamp - nowTimestamp) / (1000 * 60);
      
      // Log for debugging with full details
      console.log(`✅ Found match: ${match.teams.home.name} vs ${match.teams.away.name}`, {
        fixtureId: match.fixture.id,
        rawFromAPI: rawDate,
        parsedUTC: matchDate.toISOString(),
        parsedLocal: matchDate.toLocaleString(),
        diffMinutes: Math.round(diffMinutes),
        diffHours: (diffMinutes / 60).toFixed(2),
        isFuture: matchTimestamp > nowTimestamp
      });
    }
    return { fixtureId: match.fixture.id, matchDate };
  }

  /**
   * Normalize team names - IMPROVED: Don't remove identity words like "united", "city"
   * Only remove common suffixes like "FC", "CF", etc.
   */
  private normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Normalize unicode (remove accents)
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/[^\w\s]/g, ' ') // Replace special chars with space
      .replace(/\b(fc|cf|sc|fk|afc|cfc)\b/g, '') // Remove only FC/CF suffixes (not "united", "city")
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  /**
   * Team alias mapping - maps common abbreviations to full names
   * This helps match "Man Utd" -> "Manchester United"
   */
  private getTeamAlias(normalizedName: string): string {
    const aliases: Record<string, string> = {
      'man utd': 'manchester united',
      'man united': 'manchester united',
      'man city': 'manchester city',
      'manchester city': 'manchester city',
      'spurs': 'tottenham',
      'tottenham hotspur': 'tottenham',
      'inter': 'internazionale',
      'inter milan': 'internazionale',
      'ac milan': 'milan',
      'atletico': 'atletico madrid',
      'athletico': 'atletico madrid',
      'athletic': 'athletic bilbao',
      'real': 'real madrid',
      'psg': 'paris saint germain',
      'bayern': 'bayern munich',
      'barca': 'barcelona',
      'arsenal': 'arsenal',
      'chelsea': 'chelsea',
      'liverpool': 'liverpool',
    };
    
    return aliases[normalizedName] || normalizedName;
  }

  /**
   * Helper: Find match in API response using improved fuzzy matching
   */
  private findMatchInResponse(response: any[], homeTeamLower: string, awayTeamLower: string): any | null {
    // Normalize and get aliases
    const normalizedHome = this.normalizeTeamName(homeTeamLower);
    const normalizedAway = this.normalizeTeamName(awayTeamLower);
    const aliasedHome = this.getTeamAlias(normalizedHome);
    const aliasedAway = this.getTeamAlias(normalizedAway);
    
    // Try to find match with multiple strategies
    for (const fixture of response) {
      const apiHome = this.normalizeTeamName(fixture.teams.home.name);
      const apiAway = this.normalizeTeamName(fixture.teams.away.name);
      const apiHomeAliased = this.getTeamAlias(apiHome);
      const apiAwayAliased = this.getTeamAlias(apiAway);
      
      // Strategy 1: Exact match (normalized)
      if (apiHome === normalizedHome && apiAway === normalizedAway) {
        console.log(`✅ Exact match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
        return fixture;
      }
      
      // Strategy 2: Exact match with aliases
      if (apiHomeAliased === aliasedHome && apiAwayAliased === aliasedAway) {
        console.log(`✅ Alias match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
        return fixture;
      }
      
      // Strategy 3: Reversed exact match
      if (apiHome === normalizedAway && apiAway === normalizedHome) {
        console.log(`✅ Reversed exact match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
        return fixture;
      }
      
      // Strategy 4: Reversed alias match
      if (apiHomeAliased === aliasedAway && apiAwayAliased === aliasedHome) {
        console.log(`✅ Reversed alias match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
        return fixture;
      }
      
      // Strategy 5: Contains match
      const homeContains = apiHome.includes(normalizedHome) || normalizedHome.includes(apiHome) ||
                          apiHome.includes(aliasedHome) || aliasedHome.includes(apiHome);
      const awayContains = apiAway.includes(normalizedAway) || normalizedAway.includes(apiAway) ||
                          apiAway.includes(aliasedAway) || aliasedAway.includes(apiAway);
      if (homeContains && awayContains) {
        console.log(`✅ Contains match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
        return fixture;
      }
      
      // Strategy 6: Reversed contains
      const homeContainsReversed = apiHome.includes(normalizedAway) || normalizedAway.includes(apiHome) ||
                                   apiHome.includes(aliasedAway) || aliasedAway.includes(apiHome);
      const awayContainsReversed = apiAway.includes(normalizedHome) || normalizedHome.includes(apiAway) ||
                                   apiAway.includes(aliasedHome) || aliasedHome.includes(apiAway);
      if (homeContainsReversed && awayContainsReversed) {
        console.log(`✅ Reversed contains match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
        return fixture;
      }
      
      // Strategy 7: Word-based matching (e.g., "Man Utd" matches "Manchester United")
      const homeWords = normalizedHome.split(/\s+/).filter(w => w.length > 2);
      const awayWords = normalizedAway.split(/\s+/).filter(w => w.length > 2);
      const apiHomeWords = apiHome.split(/\s+/).filter(w => w.length > 2);
      const apiAwayWords = apiAway.split(/\s+/).filter(w => w.length > 2);
      
      if (homeWords.length > 0 && awayWords.length > 0) {
        const homeWordMatch = homeWords.every(w => 
          apiHomeWords.some(aw => aw.includes(w) || w.includes(aw))
        );
        const awayWordMatch = awayWords.every(w => 
          apiAwayWords.some(aw => aw.includes(w) || w.includes(aw))
        );
        
        if (homeWordMatch && awayWordMatch) {
          console.log(`✅ Word-based match: "${fixture.teams.home.name}" vs "${fixture.teams.away.name}"`);
          return fixture;
        }
      }
    }
    
    // Log what we searched for vs what was available
    if (response.length > 0) {
      const sampleTeams = response.slice(0, 5).map((f: any) => 
        `${f.teams.home.name} vs ${f.teams.away.name}`
      );
      console.log(`⚠️ No match found. Searched: "${homeTeamLower}" vs "${awayTeamLower}"`);
      console.log(`⚠️ Available matches (sample): ${sampleTeams.join(', ')}${response.length > 5 ? '...' : ''}`);
    }
    
    return null;
  }

  /**
   * Format match for display
   */
  formatMatch(match: Match): string {
    return `${match.home_team} vs ${match.away_team}`;
  }

  /**
   * Get best odds for a match outcome (supports multiple bet types)
   */
  getBestOdds(match: Match, betType: BetType, outcome: string, line?: number): number | null {
    if (!match.bookmakers || match.bookmakers.length === 0) {
      return null;
    }

    let bestOdds: number | null = null;

    for (const bookmaker of match.bookmakers) {
      const market = bookmaker.markets.find(m => m.key === betType);
      if (!market) continue;

      for (const outcomeData of market.outcomes) {
        let matches = false;

        switch (betType) {
          case 'h2h':
            matches = 
              (outcome === 'home' && outcomeData.name === match.home_team) ||
              (outcome === 'away' && outcomeData.name === match.away_team) ||
              (outcome === 'draw' && outcomeData.name === 'Draw');
            break;

          case 'totals':
            // Check if line matches (e.g., over 2.5, under 2.5)
            if (line && outcomeData.point === line) {
              matches = outcomeData.name.toLowerCase() === outcome.toLowerCase();
            }
            break;

          case 'spreads':
            // Check if line matches and outcome is correct
            if (line && outcomeData.point === line) {
              matches = 
                (outcome === 'home' && outcomeData.name === match.home_team) ||
                (outcome === 'away' && outcomeData.name === match.away_team);
            }
            break;

          default:
            matches = outcomeData.name.toLowerCase() === outcome.toLowerCase();
        }

        if (matches) {
          if (bestOdds === null || outcomeData.price > bestOdds) {
            bestOdds = outcomeData.price;
          }
        }
      }
    }

    return bestOdds;
  }

  /**
   * Get available markets for a match
   */
  getAvailableMarkets(match: Match): BetType[] {
    if (!match.bookmakers || match.bookmakers.length === 0) {
      return [];
    }

    const markets = new Set<BetType>();
    for (const bookmaker of match.bookmakers) {
      for (const market of bookmaker.markets) {
        markets.add(market.key as BetType);
      }
    }

    return Array.from(markets);
  }

  /**
   * Verify bet result based on bet type
   */
  verifyBetResult(
    betType: BetType,
    prediction: string,
    homeScore: number,
    awayScore: number,
    line?: number
  ): 'won' | 'lost' {
    switch (betType) {
      case 'h2h':
        if (prediction === 'home' && homeScore > awayScore) return 'won';
        if (prediction === 'away' && awayScore > homeScore) return 'won';
        if (prediction === 'draw' && homeScore === awayScore) return 'won';
        return 'lost';

      case 'totals':
        const totalGoals = homeScore + awayScore;
        if (!line) return 'lost';
        
        if (prediction === 'over' && totalGoals > line) return 'won';
        if (prediction === 'under' && totalGoals < line) return 'won';
        return 'lost';

      case 'spreads':
        if (!line) return 'lost';
        
        if (prediction === 'home') {
          const homeWithSpread = homeScore + line;
          return homeWithSpread > awayScore ? 'won' : 'lost';
        }
        if (prediction === 'away') {
          const awayWithSpread = awayScore + line;
          return awayWithSpread > homeScore ? 'won' : 'lost';
        }
        return 'lost';

      case 'btts':
        const bothScored = homeScore > 0 && awayScore > 0;
        if (prediction === 'yes' && bothScored) return 'won';
        if (prediction === 'no' && !bothScored) return 'won';
        return 'lost';

      default:
        return 'lost';
    }
  }

  /**
   * Get match league/competition name
   */
  getLeagueName(sportKey: Sport): string {
    const leagueMap: Record<Sport, string> = {
      'soccer_epl': 'Premier League',
      'soccer_spain_la_liga': 'La Liga',
      'soccer_italy_serie_a': 'Serie A',
      'soccer_germany_bundesliga': 'Bundesliga',
      'soccer_uefa_champs_league': 'Champions League',
      'soccer_uefa_europa_league': 'Europa League',
      'basketball_nba': 'NBA',
      'americanfootball_nfl': 'NFL',
    };

    return leagueMap[sportKey] || sportKey;
  }

  /**
   * Get sport name
   */
  getSportName(sportKey: Sport): string {
    if (sportKey.startsWith('soccer_')) return 'Football';
    if (sportKey.startsWith('basketball_')) return 'Basketball';
    if (sportKey.startsWith('americanfootball_')) return 'American Football';
    return 'Other';
  }
}

export const SportsAPI = new SportsAPIService();

