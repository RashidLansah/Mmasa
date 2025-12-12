# 🚀 API Setup Guide - Automatic Verification

## 🎯 Overview

Your app now supports **automatic verification** of slip results using:
1. **The Odds API** - For odds and markets
2. **API-Football** - For match scores and results

This enables:
- ✅ Automatic slip verification
- ✅ Multiple bet types (h2h, over/under, spreads, etc.)
- ✅ Real-time odds tracking
- ✅ Credible leaderboards

---

## 📋 What Bet Types Are Supported?

### ✅ **YES - Fully Supported:**

#### 1. **H2H (Home/Away/Draw)** ⚽
```
Traditional match winner betting
Examples:
- Arsenal to win
- Draw
- Chelsea to win
```

#### 2. **Totals (Over/Under)** 🎯
```
Total goals in the match
Examples:
- Over 2.5 goals
- Under 2.5 goals
- Over 1.5 goals
- Under 3.5 goals
```

#### 3. **Spreads (Handicap)** ⚖️
```
Win with goal handicap
Examples:
- Arsenal -1.5 (must win by 2+ goals)
- Chelsea +1.5 (can lose by 1 goal)
```

#### 4. **BTTS (Both Teams To Score)** ⚽⚽
```
Will both teams score?
Examples:
- BTTS Yes
- BTTS No
```

#### 5. **Double Chance** 🎲
```
Two outcomes combined
Examples:
- 1X (Home or Draw)
- X2 (Draw or Away)
- 12 (Home or Away)
```

---

## 🔑 API Key Setup

### **Step 1: Get The Odds API Key**

1. **Go to:** https://the-odds-api.com/
2. **Sign up** for free account
3. **Get API key** from dashboard
4. **Free tier:** 500 requests/month

**What you get:**
- ✅ Live odds for matches
- ✅ Multiple bookmakers
- ✅ All major leagues
- ✅ Over/Under, Spreads, H2H markets

---

### **Step 2: Get API-Football Key**

1. **Go to:** https://www.api-football.com/
2. **Sign up** for free account
3. **Subscribe to free plan**
4. **Get API key** from dashboard
5. **Free tier:** 100 requests/day

**What you get:**
- ✅ Live scores
- ✅ Match results
- ✅ Fixtures
- ✅ All major leagues worldwide

---

### **Step 3: Add API Keys to Your App**

**Option A: Direct in Code (For Testing)**

Edit `src/services/sports-api.service.ts`:

```typescript
// Line 13-14
const THE_ODDS_API_KEY = 'your_odds_api_key_here';

// Line 17-18
const API_FOOTBALL_KEY = 'your_api_football_key_here';
```

**Option B: Environment Variables (Recommended for Production)**

Create `.env` file:
```env
ODDS_API_KEY=your_odds_api_key_here
API_FOOTBALL_KEY=your_api_football_key_here
```

Install `react-native-dotenv`:
```bash
npm install react-native-dotenv
```

Update `sports-api.service.ts`:
```typescript
import { ODDS_API_KEY, API_FOOTBALL_KEY } from '@env';

const THE_ODDS_API_KEY = ODDS_API_KEY;
const API_FOOTBALL_KEY = API_FOOTBALL_KEY;
```

---

## 🎮 How It Works

### **Creator Creates Slip:**

```typescript
{
  homeTeam: "Arsenal",
  awayTeam: "Chelsea",
  betType: "totals",      // Type of bet
  prediction: "over",     // What you predict
  line: 2.5,              // Line (for totals/spreads)
  odds: 1.85,
  matchDate: "2024-12-15"
}
```

### **System Auto-Verifies After Match:**

1. **Waits 2 hours after match time** (ensures match is finished)
2. **Searches API-Football** for the fixture
3. **Fetches final score** (e.g., Arsenal 3-1 Chelsea)
4. **Verifies bet:**
   ```typescript
   Total goals = 3 + 1 = 4
   Prediction = Over 2.5
   Result = 4 > 2.5 = ✅ WON
   ```
5. **Updates slip status** (won/lost)
6. **Recalculates creator stats**
7. **Updates leaderboard**

---

## 🎯 Bet Type Examples

### **Example 1: Over/Under**

```typescript
// Creator's Slip
{
  betType: "totals",
  prediction: "over",
  line: 2.5,
  matchResult: Arsenal 3-1 Chelsea
}

// Verification
totalGoals = 3 + 1 = 4
4 > 2.5 = ✅ WON
```

### **Example 2: Handicap/Spread**

```typescript
// Creator's Slip
{
  betType: "spreads",
  prediction: "home",
  line: -1.5,
  matchResult: Arsenal 3-1 Chelsea
}

// Verification
Arsenal score with handicap = 3 + (-1.5) = 1.5
1.5 > 1 (Chelsea) = ✅ WON
```

### **Example 3: BTTS (Both Teams To Score)**

```typescript
// Creator's Slip
{
  betType: "btts",
  prediction: "yes",
  matchResult: Arsenal 3-1 Chelsea
}

// Verification
Arsenal scored = ✅
Chelsea scored = ✅
Both teams scored = ✅ WON
```

---

## 🖥️ UI Integration

### **Update Results Screen** (Settings → Update Slip Results)

**New Features:**
1. **Auto-Verify Button** - One-click verification
2. **Stats Summary** - See pending/verified/ready counts
3. **Manual Override** - Still can manually enter scores
4. **Verification Status** - Shows if auto-verified or manual

**UI Preview:**
```
┌─────────────────────────────────┐
│ Update Results                  │
│ ┌─────────────────────────────┐ │
│ │ ⚡ Auto-Verify 5 Slips      │ │
│ └─────────────────────────────┘ │
│                                 │
│ Pending: 8  Verified: 15  Ready: 5│
│                                 │
│ [List of pending slips...]      │
└─────────────────────────────────┘
```

---

## 🔄 Verification Flow

### **Automatic (Recommended):**

```
1. User taps "Auto-Verify X Slips"
   ↓
2. System loops through each slip
   ↓
3. Searches API-Football for fixture
   ↓
4. Gets final score
   ↓
5. Verifies based on bet type
   ↓
6. Updates slip + creator stats
   ↓
7. Shows summary: "✅ 5 verified, 3 won, 2 lost"
```

### **Manual (Fallback):**

```
1. Creator enters scores manually
   ↓
2. System verifies based on bet type
   ↓
3. Updates slip + stats
```

---

## 📊 API Request Limits

### **The Odds API (Free Tier):**
- **500 requests/month**
- ~16 requests/day
- Use for: Fetching odds, markets

### **API-Football (Free Tier):**
- **100 requests/day**
- Use for: Match results, scores

### **Cost for Paid Plans:**
| API | Free | Paid |
|-----|------|------|
| The Odds API | 500/month | $35/month (unlimited) |
| API-Football | 100/day | €15/month (3000/day) |

**Recommendation:**
- Start with free tiers for MVP
- Upgrade when you have 100+ daily active users

---

## 🎯 Testing Guide

### **Test Scenario 1: Over/Under Bet**

```bash
# 1. Create a slip
Bet Type: Totals (Over/Under)
Prediction: Over 2.5
Match: Arsenal vs Chelsea
Match Date: Tomorrow

# 2. After match finishes
Go to Settings → Update Slip Results
Tap "Auto-Verify"

# 3. System will:
- Find the match in API-Football
- Get score (e.g., 3-1)
- Calculate: 3 + 1 = 4 goals
- Verify: 4 > 2.5 = WON ✅
```

### **Test Scenario 2: Handicap Bet**

```bash
# 1. Create a slip
Bet Type: Spreads (Handicap)
Prediction: Home team
Line: -1.5
Match: Man City vs Brighton

# 2. After match
Auto-verify
Score: Man City 4-1 Brighton
Verify: 4 + (-1.5) = 2.5 > 1 = WON ✅
```

---

## 🛠️ Implementation Details

### **Files Created/Updated:**

1. ✅ `src/services/sports-api.service.ts` - API integration
2. ✅ `src/services/auto-verify.service.ts` - Auto-verification logic
3. ✅ `src/services/firestore.service.ts` - Updated Slip interface
4. ✅ `src/screens/settings/UpdateResultsScreen.tsx` - UI updates

### **New Interfaces:**

```typescript
export interface Slip {
  // ... existing fields ...
  betType?: 'h2h' | 'totals' | 'spreads' | 'btts' | 'double_chance';
  prediction?: string; // 'home', 'away', 'over', 'under', etc.
  line?: number; // For totals/spreads
  fixtureId?: number; // API-Football ID
  autoVerified?: boolean; // API vs manual
}
```

---

## 🚨 Troubleshooting

### **Issue: "API Error 401"**
**Solution:** Check your API keys are correct

### **Issue: "Match not found"**
**Solution:** 
- Check team names match exactly
- Match might not be in API yet
- Use manual verification as fallback

### **Issue: "Rate limit exceeded"**
**Solution:**
- Upgrade to paid plan
- Reduce verification frequency
- Only verify finished matches

---

## 🎉 Benefits

### **For Creators:**
✅ **Save time** - No manual entry
✅ **100% accurate** - No human error
✅ **Build trust** - API-verified results
✅ **Auto-updates** - Stats update instantly

### **For Users:**
✅ **Trust** - Know results are real
✅ **Transparency** - See verification method
✅ **Fair rankings** - Leaderboard based on real data

---

## 🔮 Next Steps

1. **Get API keys** (15 minutes)
2. **Add to app** (5 minutes)
3. **Test with one slip** (10 minutes)
4. **Enable for all users** (Done!)

---

## 📞 API Support

**The Odds API:**
- Docs: https://the-odds-api.com/liveapi/guides/v4/
- Support: support@the-odds-api.com

**API-Football:**
- Docs: https://www.api-football.com/documentation-v3
- Support: https://dashboard.api-football.com/support

---

## ✅ Summary

**What You Have Now:**
- ✅ Automatic slip verification
- ✅ Support for 5+ bet types
- ✅ Manual fallback option
- ✅ Real-time stats updates
- ✅ Credible leaderboards

**What You Need:**
- 🔑 2 API keys (free to get)
- ⏱️ 20 minutes to set up
- 🧪 Testing with real matches

**Cost:**
- 💰 FREE for MVP (100+ verifications/day)
- 💰 ~$50/month for scale (1000s/day)

---

**🚀 READY TO AUTO-VERIFY!**

Get your API keys and start building trust with your users! 🎉

