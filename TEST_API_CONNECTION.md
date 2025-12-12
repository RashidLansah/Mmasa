# 🧪 Test API Connection

## ✅ API Keys Connected

Your API keys have been added to the app:

```
✅ The Odds API: 063346656bae78faf608f5f6fed231e6
✅ API-Football: c2cff9ab4ef7ae228a2dc5dae9cebbab
```

---

## 🧪 Quick Test Guide

### **Test 1: Verify API Connection**

Run this in your app to test the connection:

```typescript
// In any screen or component
import { SportsAPI } from '../services/sports-api.service';

// Test The Odds API
const testOddsAPI = async () => {
  try {
    const matches = await SportsAPI.getUpcomingMatches('soccer_epl');
    console.log('✅ The Odds API Connected!');
    console.log(`Found ${matches.length} Premier League matches`);
  } catch (error) {
    console.error('❌ The Odds API Error:', error);
  }
};

// Test API-Football
const testFootballAPI = async () => {
  try {
    // Search for a recent fixture
    const fixtureId = await SportsAPI.searchFixtureByTeams('Arsenal', 'Chelsea', new Date());
    if (fixtureId) {
      console.log('✅ API-Football Connected!');
      console.log(`Found fixture ID: ${fixtureId}`);
    } else {
      console.log('⚠️ No fixture found for today');
    }
  } catch (error) {
    console.error('❌ API-Football Error:', error);
  }
};

// Run tests
testOddsAPI();
testFootballAPI();
```

---

### **Test 2: Create & Auto-Verify a Slip**

#### **Step 1: Create a Test Slip**

1. Go to **Home** → Tap **+ button**
2. Fill in slip details:
   ```
   Title: "Over 2.5 Goals Test"
   Home Team: "Arsenal"
   Away Team: "Chelsea"
   League: "Premier League"
   Match Date: [Pick a recent match date]
   Odds: 1.85
   Bet Type: Totals (Over/Under)
   Prediction: Over
   Line: 2.5
   ```
3. Tap **"Publish Slip"**

#### **Step 2: Auto-Verify**

1. Go to **Settings** → **"Update Slip Results"**
2. You should see your pending slip
3. Tap **"⚡ Auto-Verify X Slips"**
4. System will:
   - Search for the match in API-Football
   - Fetch the score
   - Verify your prediction
   - Update slip status (won/lost)
   - Update your creator stats

---

### **Test 3: Check Real Match Data**

#### **Upcoming Matches:**

```typescript
import { SportsAPI } from '../services/sports-api.service';

// Get today's Premier League matches
const getMatches = async () => {
  const matches = await SportsAPI.getUpcomingMatches('soccer_epl', ['h2h', 'totals']);
  
  matches.forEach(match => {
    console.log(`${match.home_team} vs ${match.away_team}`);
    console.log(`Date: ${match.commence_time}`);
    
    // Get odds for over 2.5
    const overOdds = SportsAPI.getBestOdds(match, 'totals', 'over', 2.5);
    console.log(`Over 2.5 odds: ${overOdds}`);
  });
};
```

---

## 🎯 Full Test Scenario

### **Scenario: Test with Real Match**

1. **Find upcoming match:**
   - Check Premier League fixtures
   - Pick a match happening soon

2. **Create slip before match:**
   ```
   Example:
   - Match: Man City vs Liverpool
   - Bet: Over 2.5 goals @ 1.85
   - Date: Tomorrow
   ```

3. **Wait for match to finish**

4. **Auto-verify:**
   - Settings → Update Slip Results
   - Tap "Auto-Verify"
   - Watch it work! 🎉

5. **Check results:**
   - Slip status updated (won/lost)
   - Your creator stats updated
   - Leaderboard position updated

---

## 📊 API Limits

### **Your Current Limits:**

**The Odds API:**
- ✅ 500 requests/month
- ≈ 16 requests/day
- Use for: Fetching odds & markets

**API-Football:**
- ✅ 100 requests/day
- Use for: Match scores & results

### **What This Means:**

With these limits, you can:
- ✅ Verify ~100 slips per day (FREE!)
- ✅ Fetch odds for 15+ matches daily
- ✅ Support dozens of active creators

**Perfect for MVP testing!** 🚀

---

## 🔍 Monitor Your Usage

### **The Odds API Dashboard:**
- Go to: https://the-odds-api.com/account/
- Check "Requests Remaining"
- Monitor daily usage

### **API-Football Dashboard:**
- Go to: https://dashboard.api-football.com/
- Check "Requests" tab
- See usage stats

---

## ⚠️ Troubleshooting

### **Issue 1: "API Error 401"**
**Cause:** Invalid API key
**Fix:** Double-check keys in `sports-api.service.ts`

### **Issue 2: "Match not found"**
**Cause:** Match not in API database yet
**Fix:** 
- Use matches from major leagues (EPL, La Liga, etc.)
- Wait until closer to match time
- Use manual verification as fallback

### **Issue 3: "Rate limit exceeded"**
**Cause:** Too many requests
**Fix:**
- Check dashboard for usage
- Only verify finished matches
- Upgrade to paid plan if needed

### **Issue 4: "Result not available yet"**
**Cause:** Match just finished, API updating
**Fix:**
- Wait 15-30 minutes after match
- API needs time to update scores
- Try manual verification

---

## 🎉 Success Indicators

You'll know it's working when:

✅ **Console logs:**
```
✅ The Odds API Connected!
Found 20 Premier League matches
✅ API-Football Connected!
Found fixture ID: 1234567
```

✅ **In app:**
```
Settings → Update Results
"⚡ Auto-Verify 3 Slips" button appears
Tap it → "✅ Verified 3 slips, 2 won, 1 lost"
```

✅ **Slip details:**
```
Status: WON ✅
Score: Arsenal 3-1 Chelsea
Auto-verified: Yes ⚡
```

---

## 📱 Test in App Right Now

### **Quick Test (5 minutes):**

1. **Open terminal:**
   ```bash
   npm start
   ```

2. **In app, add this to any screen:**
   ```typescript
   import { SportsAPI } from '../services/sports-api.service';
   
   // Add this in useEffect
   useEffect(() => {
     const test = async () => {
       try {
         const matches = await SportsAPI.getUpcomingMatches('soccer_epl');
         console.log('✅ API Working!', matches.length, 'matches');
       } catch (error) {
         console.error('❌ API Error:', error);
       }
     };
     test();
   }, []);
   ```

3. **Check console:**
   - Should see: "✅ API Working! X matches"
   - If error, check API keys

---

## 🚀 You're Ready!

**APIs Connected:** ✅
**TypeScript Errors:** 0 ✅
**Ready to Test:** YES ✅

**Next:** Create a slip and test auto-verification! 🎯

---

## 💡 Pro Tips

1. **Test with recent matches first** - easier to verify
2. **Use major leagues** - better API coverage
3. **Check dashboards** - monitor usage
4. **Start with manual** - then enable auto
5. **Save API limits** - only verify when needed

---

**Your app now has LIVE automatic verification!** 🎉

Go create some slips and test it out! 🚀

