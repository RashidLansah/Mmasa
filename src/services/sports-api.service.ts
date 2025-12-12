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

// The Odds API (for odds and markets)
const THE_ODDS_API_KEY = '063346656bae78faf608f5f6fed231e6'; // ✅ Connected
const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4';

// API-Football (for scores and results)
const API_FOOTBALL_KEY = 'c2cff9ab4ef7ae228a2dc5dae9cebbab'; // ✅ Connected
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
   * Search for live fixtures by team names
   */
  async searchFixtureByTeams(homeTeam: string, awayTeam: string, date?: Date): Promise<number | null> {
    try {
      const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `${this.footballBaseUrl}/fixtures?date=${dateStr}&team=${homeTeam}`,
        {
          headers: {
            'x-rapidapi-key': this.footballApiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Find match with both teams
      if (data.response && data.response.length > 0) {
        const match = data.response.find((f: any) => 
          f.teams.home.name.toLowerCase().includes(homeTeam.toLowerCase()) &&
          f.teams.away.name.toLowerCase().includes(awayTeam.toLowerCase())
        );
        
        return match ? match.fixture.id : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching fixture:', error);
      return null;
    }
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

