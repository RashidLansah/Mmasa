# ChatGPT Prompt: Fix Slip Expiry & Sports API Match Finding

Copy and paste this entire prompt into ChatGPT:

---

## Context

I'm building a React Native betting app (Expo) with Firebase backend. Users create betting slips by entering booking codes from betting platforms (like SportyBet). The app scrapes match data from these booking codes and matches them against API-Football to get fixture IDs and match dates.

## Problem 1: Slip Expiration Not Working Correctly

**Current Implementation:**
- When creating a slip, we calculate `expiresAt` as 15 minutes before the first match kickoff
- We store `expiresAt` as a Firestore Timestamp
- We filter expired slips in queries using `where('expiresAt', '>', Timestamp.now())`
- We have a `status` field that can be 'pending', 'active', 'expired', 'won', 'lost'

**Issues:**
1. Slips show as "expired" in the UI but status in database still says "active"
2. Expired slips sometimes still appear in feeds
3. Status doesn't automatically update to 'expired' when `expiresAt` passes
4. Users can still purchase expired slips

**Current Code Structure:**
- `SlipUploadScreenV2.tsx`: Creates slips with `expiresAt` field
- `firestore.service.ts`: Has `getSlips()` and `subscribeToSlips()` that filter expired slips
- `SlipDetailsScreen.tsx`: Shows slip details, has a useEffect that checks expiration
- `HomeFeedScreen.tsx`: Displays feed of active slips

**What I Need:**
A reliable way to:
1. Automatically mark slips as 'expired' when `expiresAt` passes
2. Prevent expired slips from appearing in main feed
3. Prevent purchases of expired slips
4. Keep expired slips visible in creator's history (but marked as expired)

**Constraints:**
- Prefer solutions that don't require Firebase Cloud Functions (but can use if necessary)
- Need to work with Firestore real-time listeners
- Should be efficient (not checking every slip on every query)

---

## Problem 2: Sports API Not Finding Matches

**Current Implementation:**
- We scrape team names from booking codes (e.g., "Chelsea FC" vs "Arsenal")
- We call `SportsAPI.searchFixtureByTeams(homeTeam, awayTeam, date)` to find matches
- This function tries multiple strategies:
  1. Search with provided date
  2. Search today's fixtures
  3. Search next 14 days
  4. Search yesterday
  5. Search without date filter (next 10 matches)

**Issues:**
1. Many matches that exist in SportyBet are not found in API-Football
2. Console shows: "⚠️ No match found. Searched: 'X' vs 'Y'"
3. When API can't find match, the slip fails to activate
4. Team name matching seems to fail even for popular teams

**Current Code:**
```typescript
// src/services/sports-api.service.ts
async searchFixtureByTeams(homeTeam: string, awayTeam: string, date?: Date) {
  // Tries multiple date strategies
  // Uses findMatchInResponse() with fuzzy matching
}

private findMatchInResponse(response: any[], homeTeamLower: string, awayTeamLower: string) {
  // Normalizes team names (removes FC, special chars)
  // Tries: exact match, reversed, contains, word-based matching
}
```

**Team Name Normalization:**
```typescript
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+(fc|cf|sc|fk|afc|cfc|united|city|town|rovers|athletic|athletico|atletico)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};
```

**What I Need:**
1. Better team name matching algorithm
2. More robust search strategies
3. Better handling when API doesn't have the match
4. Logging to debug why matches aren't found

**API Details:**
- Using API-Football (v3.football.api-sports.io)
- Free tier: 100 requests/day
- Need to be efficient with API calls

**Example Team Names from SportyBet:**
- "Chelsea FC" → API might have "Chelsea"
- "Manchester United" → API might have "Man United" or "Man Utd"
- "Real Madrid CF" → API might have "Real Madrid"
- African teams might have different naming conventions

---

## Questions for You:

1. **Slip Expiration:**
   - What's the best approach: Cloud Functions scheduled job, client-side checks, or hybrid?
   - How to ensure status updates reliably without expensive queries?
   - Should we use Firestore TTL or manual status updates?

2. **Sports API Matching:**
   - How to improve team name fuzzy matching?
   - Should we use a different API or additional data source?
   - How to handle cases where API doesn't have the match (should slip still be created)?
   - Any libraries or algorithms for better string matching?

3. **General:**
   - Code examples for both solutions
   - Best practices for React Native + Firebase
   - Performance considerations

Please provide:
- Specific code solutions
- Explanation of why each approach works
- Trade-offs and alternatives
- Step-by-step implementation guide

---

## Technical Stack:
- React Native (Expo)
- TypeScript
- Firebase (Firestore, Auth)
- Express.js backend (for scraping)
- API-Football for match data
- Puppeteer for web scraping

---

