# 🎯 Bet Monitoring System: How We Track If Bets Win

## 📋 Overview

This document explains how the Mmasa app monitors and verifies whether bets in a slip win or lose. The system uses **two methods**: Manual verification (current) and Automatic API verification (available).

---

## 🔄 Current System Flow

```
1. Creator creates slip with prediction
   ↓
2. Match happens (game is played)
   ↓
3. Match finishes (final score determined)
   ↓
4. System monitors for result (manual or auto)
   ↓
5. Result verified → Slip status updated (won/lost)
   ↓
6. Creator stats recalculated automatically
```

---

## 🎮 Method 1: Manual Verification (Current Primary Method)

### **How It Works:**

1. **Creator Action Required:**
   - Creator navigates to **Settings → "Update Slip Results"**
   - Sees list of their pending slips
   - For each slip, enters the final match score
   - Taps "Update Result"

2. **System Verification:**
   ```typescript
   // From results-updater.service.ts
   
   // Get slip data
   const slipData = await getSlip(slipId);
   const prediction = slipData.prediction; // 'home', 'away', or 'draw'
   
   // Creator enters scores
   const homeScore = 2;  // User input
   const awayScore = 1;  // User input
   
   // System compares prediction vs actual result
   let status: 'won' | 'lost' = 'lost';
   
   if (prediction === 'home' && homeScore > awayScore) {
     status = 'won';  ✅
   } else if (prediction === 'away' && awayScore > homeScore) {
     status = 'won';  ✅
   } else if (prediction === 'draw' && homeScore === awayScore) {
     status = 'won';  ✅
   } else {
     status = 'lost'; ❌
   }
   
   // Update slip
   await updateSlip({
     status,
     homeScore,
     awayScore,
     resultChecked: true
   });
   
   // Recalculate creator stats
   await updateCreatorStats(creatorId);
   ```

### **Example Scenarios:**

| Prediction | Final Score | Result | Status |
|------------|-------------|--------|--------|
| Home Win | 2-1 | Home wins | ✅ **WON** |
| Home Win | 1-2 | Away wins | ❌ **LOST** |
| Away Win | 0-3 | Away wins | ✅ **WON** |
| Draw | 1-1 | Tie | ✅ **WON** |
| Draw | 2-1 | Home wins | ❌ **LOST** |

### **UI Location:**
- **Screen:** `src/screens/settings/UpdateResultsScreen.tsx`
- **Navigation:** Settings → Update Slip Results
- **Features:**
  - Shows only creator's own pending slips
  - Displays match info (teams, date, prediction)
  - Score input fields
  - Validation
  - Auto-updates stats after submission

---

## ⚡ Method 2: Automatic API Verification (Available)

### **How It Works:**

1. **System Checks Automatically:**
   - System queries pending slips
   - For slips with `fixtureId` (API match ID)
   - Fetches match result from API-Football
   - Compares prediction vs actual result
   - Updates slip status automatically

2. **Implementation:**
   ```typescript
   // From auto-verify.service.ts
   
   async verifySlip(slipId: string) {
     // 1. Get slip data
     const slipData = await getSlip(slipId);
     
     // 2. Get fixture ID (API match identifier)
     const fixtureId = slipData.fixtureId;
     
     // 3. Fetch match result from API
     const result = await SportsAPI.getMatchResult(fixtureId);
     // Returns: { home_score: 2, away_score: 1, completed: true }
     
     // 4. Verify bet based on type
     const betType = slipData.betType || 'h2h';
     const prediction = slipData.prediction;
     
     const status = SportsAPI.verifyBetResult(
       betType,
       prediction,
       result.home_score,
       result.away_score,
       slipData.line  // For totals/spreads
     );
     
     // 5. Update slip automatically
     await updateSlip({
       status,  // 'won' or 'lost'
       homeScore: result.home_score,
       awayScore: result.away_score,
       resultChecked: true,
       autoVerified: true
     });
     
     // 6. Update creator stats
     await updateCreatorStats(slipData.creatorId);
   }
   ```

### **Bet Type Verification Logic:**

#### **1. Head-to-Head (H2H) - Home/Away/Draw**
```typescript
if (prediction === 'home' && homeScore > awayScore) → WON
if (prediction === 'away' && awayScore > homeScore) → WON
if (prediction === 'draw' && homeScore === awayScore) → WON
else → LOST
```

#### **2. Over/Under (Totals)**
```typescript
const totalGoals = homeScore + awayScore;
const line = slipData.line; // e.g., 2.5

if (prediction === 'over' && totalGoals > line) → WON
if (prediction === 'under' && totalGoals < line) → WON
else → LOST
```

#### **3. Both Teams To Score (BTTS)**
```typescript
if (prediction === 'yes' && homeScore > 0 && awayScore > 0) → WON
if (prediction === 'no' && (homeScore === 0 || awayScore === 0)) → WON
else → LOST
```

#### **4. Handicap (Spreads)**
```typescript
const line = slipData.line; // e.g., -1.5
const adjustedHomeScore = homeScore + line;

if (prediction === 'home' && adjustedHomeScore > awayScore) → WON
if (prediction === 'away' && awayScore > adjustedHomeScore) → WON
else → LOST
```

#### **5. Double Chance**
```typescript
// 1X = Home win or Draw
if (prediction === '1X' && (homeScore >= awayScore)) → WON

// X2 = Draw or Away win
if (prediction === 'X2' && (awayScore >= homeScore)) → WON

// 12 = Home win or Away win (not draw)
if (prediction === '12' && (homeScore !== awayScore)) → WON
else → LOST
```

### **When Auto-Verification Runs:**

**Option A: Scheduled (Recommended)**
```typescript
// Cloud Function or Cron Job
// Runs every hour
cron.schedule('0 * * * *', async () => {
  const pendingSlips = await getPendingSlips();
  
  for (const slip of pendingSlips) {
    // Only verify if match finished (2+ hours after match time)
    if (slip.matchDate < new Date(Date.now() - 2 * 60 * 60 * 1000)) {
      await AutoVerify.verifySlip(slip.id);
    }
  }
});
```

**Option B: Manual Trigger**
```typescript
// In UpdateResultsScreen
const handleAutoVerifyAll = async () => {
  const results = await AutoVerify.verifyCreatorSlips(userId);
  // Updates all verifiable slips automatically
};
```

---

## 📊 Monitoring Process Details

### **Step 1: Identify Pending Slips**

```typescript
// Query Firestore
const pendingSlips = query(
  collection(db, 'slips'),
  where('status', '==', 'pending'),
  where('resultChecked', '==', false),
  where('matchDate', '<', now) // Match has happened
);
```

**Criteria:**
- ✅ `status === 'pending'`
- ✅ `resultChecked === false`
- ✅ `matchDate < currentTime` (match has finished)

### **Step 2: Get Match Result**

**Manual Method:**
- Creator enters scores manually
- System validates input (numbers only)

**Automatic Method:**
- System queries API-Football using `fixtureId`
- API returns: `{ home_score, away_score, completed }`
- System validates match is finished (`completed === true`)

### **Step 3: Verify Prediction**

```typescript
// Core verification logic
function verifyPrediction(
  prediction: string,
  homeScore: number,
  awayScore: number,
  betType: string,
  line?: number
): 'won' | 'lost' {
  
  switch (betType) {
    case 'h2h':
      return verifyH2H(prediction, homeScore, awayScore);
    case 'totals':
      return verifyTotals(prediction, homeScore, awayScore, line);
    case 'btts':
      return verifyBTTS(prediction, homeScore, awayScore);
    case 'spreads':
      return verifySpreads(prediction, homeScore, awayScore, line);
    case 'double_chance':
      return verifyDoubleChance(prediction, homeScore, awayScore);
    default:
      return 'lost';
  }
}
```

### **Step 4: Update Slip Status**

```typescript
await updateDoc(slipRef, {
  status: 'won' | 'lost',
  homeScore: number,
  awayScore: number,
  resultChecked: true,
  autoVerified: boolean, // true if from API, false if manual
  updatedAt: serverTimestamp()
});
```

### **Step 5: Recalculate Creator Stats**

```typescript
// Automatically triggered after slip update
await FirestoreService.updateCreatorStats(creatorId);

// Calculates:
// - Win Rate
// - Accuracy (weighted by odds)
// - ROI (if premium slips)
// - Total wins/losses
```

---

## 🔍 Monitoring Dashboard (Future)

### **Admin View:**
```
┌─────────────────────────────────────┐
│ Bet Monitoring Dashboard            │
├─────────────────────────────────────┤
│                                     │
│ Pending Verification: 45           │
│ Auto-Verified Today: 120            │
│ Manual Updates Today: 8            │
│                                     │
│ Recent Activity:                    │
│ • Arsenal vs Chelsea - WON ✅       │
│ • Man City vs Liverpool - LOST ❌   │
│ • Barcelona vs Real - Pending ⏳    │
│                                     │
│ [Refresh] [Auto-Verify All]        │
└─────────────────────────────────────┘
```

### **Creator View:**
```
┌─────────────────────────────────────┐
│ My Slips Status                     │
├─────────────────────────────────────┤
│                                     │
│ Pending: 3                          │
│ Won: 12                             │
│ Lost: 5                             │
│                                     │
│ Win Rate: 70.6%                     │
│                                     │
│ [Update Results] [Auto-Verify]      │
└─────────────────────────────────────┘
```

---

## 🎯 Key Files & Functions

### **1. Manual Verification**
- **File:** `src/services/results-updater.service.ts`
- **Function:** `updateSlipResult(slipId, homeScore, awayScore)`
- **UI:** `src/screens/settings/UpdateResultsScreen.tsx`

### **2. Automatic Verification**
- **File:** `src/services/auto-verify.service.ts`
- **Function:** `verifySlip(slipId)`
- **API:** `src/services/sports-api.service.ts`
- **Function:** `verifyBetResult(betType, prediction, homeScore, awayScore, line)`

### **3. Stat Updates**
- **File:** `src/services/firestore.service.ts`
- **Function:** `updateCreatorStats(creatorId)`
- **Function:** `calculateCreatorStats(creatorId)`

---

## ✅ Current Status

### **✅ Implemented:**
- ✅ Manual result entry by creators
- ✅ Prediction verification logic (H2H)
- ✅ Automatic stat recalculation
- ✅ Win rate calculation
- ✅ Accuracy calculation
- ✅ ROI calculation
- ✅ Update Results screen UI
- ✅ Auto-verify service (code ready, needs API key)

### **⏳ Needs Setup:**
- ⏳ API-Football API key configuration
- ⏳ Scheduled auto-verification (Cloud Function or Cron)
- ⏳ Advanced bet type verification (totals, spreads, etc.)
- ⏳ Monitoring dashboard

---

## 🚀 How to Enable Auto-Verification

### **Step 1: Get API Key**
1. Sign up at [API-Football](https://www.api-football.com/)
2. Get your API key
3. Add to environment variables

### **Step 2: Configure API**
```typescript
// src/services/sports-api.service.ts
const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
```

### **Step 3: Set Up Scheduled Job**
```typescript
// Option A: Firebase Cloud Function
exports.autoVerifySlips = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    await AutoVerify.verifyPendingSlips();
  });

// Option B: Node.js Cron
cron.schedule('0 * * * *', async () => {
  await AutoVerify.verifyPendingSlips();
});
```

---

## 📝 Summary

### **Current Method (Manual):**
1. Creator creates slip → Match happens → Creator enters score → System verifies → Stats update

### **Available Method (Automatic):**
1. Creator creates slip → Match happens → System checks API → Auto-verifies → Stats update

### **Both Methods:**
- ✅ Verify prediction vs actual result
- ✅ Update slip status (won/lost)
- ✅ Recalculate creator stats automatically
- ✅ Update leaderboard rankings
- ✅ Track accuracy and ROI

---

## 🔗 Related Documentation

- `RESULTS_VERIFICATION_SYSTEM.md` - Detailed verification system
- `AUTO_RESULTS_VERIFICATION.md` - Auto-verification setup guide
- `STATS_CALCULATION_GUIDE.md` - How stats are calculated
- `STATS_IMPLEMENTATION_SUMMARY.md` - Implementation details

---

**✅ The system is ready to monitor bets! Manual verification works now, and automatic verification is available once API is configured.**



