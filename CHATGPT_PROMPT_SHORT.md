# ChatGPT Prompt (Short Version)

---

I have a React Native betting app with two critical issues:

## Issue 1: Slip Expiration
- Slips have `expiresAt` timestamp (15 min before match)
- Status field: 'pending' | 'active' | 'expired' | 'won' | 'lost'
- Problem: Slips show as expired in UI but database status stays 'active'
- Users can still purchase expired slips
- Need: Auto-update status to 'expired' when `expiresAt` passes, prevent purchases, filter from feed

Current: Using Firestore queries with `where('expiresAt', '>', Timestamp.now())` but status doesn't update.

## Issue 2: Sports API Not Finding Matches
- Scrape team names from booking codes (e.g., "Chelsea FC" vs "Arsenal")
- Call API-Football to find fixture IDs
- Problem: Many matches not found, even popular teams
- Team name matching fails despite normalization (removes FC, special chars, fuzzy matching)

Current: `searchFixtureByTeams()` tries multiple strategies (today, next 14 days, yesterday, no date) with fuzzy matching, but still fails.

**Stack:** React Native/Expo, TypeScript, Firebase Firestore, API-Football

**Questions:**
1. Best way to auto-expire slips? (Cloud Functions vs client-side vs hybrid)
2. How to improve team name matching algorithm?
3. Should slips still be created if API can't find match?

Please provide code solutions and best practices.

---

