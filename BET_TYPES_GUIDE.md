# 🎯 Complete Bet Types Guide

## Overview

Your app now supports **5+ bet types** that are commonly used in sports betting. All types are automatically verified using API-Football!

---

## ✅ Fully Supported Bet Types

### 1. **H2H (Home/Away/Draw)** ⚽

**Description:** Traditional match winner betting - predict which team wins or if it's a draw.

**Examples:**
```
Match: Arsenal vs Chelsea

Options:
✅ Arsenal to win (Home)
✅ Draw
✅ Chelsea to win (Away)
```

**How It's Verified:**
```typescript
if (homeScore > awayScore) → Home wins ✅
if (homeScore === awayScore) → Draw ✅
if (awayScore > homeScore) → Away wins ✅

Example:
Arsenal 2-1 Chelsea
→ Home win ✅
```

**In Your App:**
```typescript
{
  betType: 'h2h',
  prediction: 'home', // or 'away', 'draw'
  odds: 2.50
}
```

---

### 2. **Totals (Over/Under)** 🎯

**Description:** Predict if total goals will be over or under a specific line.

**Common Lines:**
- Over/Under 0.5 goals
- Over/Under 1.5 goals
- Over/Under 2.5 goals ⭐ Most popular
- Over/Under 3.5 goals
- Over/Under 4.5 goals

**Examples:**
```
Match: Man City vs Liverpool
Line: 2.5 goals

Options:
✅ Over 2.5 goals (3+ goals in match)
✅ Under 2.5 goals (0-2 goals in match)
```

**How It's Verified:**
```typescript
totalGoals = homeScore + awayScore

if (totalGoals > line) → Over wins ✅
if (totalGoals < line) → Under wins ✅

Example 1:
Man City 3-1 Liverpool (4 goals total)
Line: Over 2.5
→ 4 > 2.5 = Over wins ✅

Example 2:
Arsenal 1-0 Chelsea (1 goal total)
Line: Under 2.5
→ 1 < 2.5 = Under wins ✅
```

**In Your App:**
```typescript
{
  betType: 'totals',
  prediction: 'over', // or 'under'
  line: 2.5,
  odds: 1.85
}
```

---

### 3. **Spreads/Handicap** ⚖️

**Description:** One team gets a virtual head start. Predict the winner after applying the handicap.

**Common Lines:**
- -0.5, -1.0, -1.5, -2.0 (favorites)
- +0.5, +1.0, +1.5, +2.0 (underdogs)

**Examples:**
```
Match: Bayern Munich vs Hertha Berlin
Line: Bayern -1.5 (Bayern must win by 2+ goals)

Options:
✅ Bayern -1.5 (Bayern to win by 2+ goals)
✅ Hertha +1.5 (Hertha to lose by max 1 goal or win)
```

**How It's Verified:**
```typescript
if (prediction === 'home') {
  homeWithSpread = homeScore + line
  if (homeWithSpread > awayScore) → Home wins ✅
}

Example 1:
Bayern 3-0 Hertha
Line: Bayern -1.5
→ 3 + (-1.5) = 1.5 > 0 = Bayern -1.5 wins ✅

Example 2:
Bayern 1-0 Hertha
Line: Bayern -1.5
→ 1 + (-1.5) = -0.5 < 0 = Bayern -1.5 loses ❌

Example 3:
Leicester 0-2 Man City
Line: Leicester +1.5
→ 0 + 1.5 = 1.5 < 2 = Leicester +1.5 loses ❌
```

**In Your App:**
```typescript
{
  betType: 'spreads',
  prediction: 'home', // or 'away'
  line: -1.5, // negative for favorites, positive for underdogs
  odds: 1.95
}
```

---

### 4. **BTTS (Both Teams To Score)** ⚽⚽

**Description:** Will both teams score at least one goal?

**Examples:**
```
Match: Liverpool vs Tottenham

Options:
✅ BTTS Yes (both teams score)
✅ BTTS No (one or both teams don't score)
```

**How It's Verified:**
```typescript
bothScored = (homeScore > 0 && awayScore > 0)

if (prediction === 'yes' && bothScored) → Yes wins ✅
if (prediction === 'no' && !bothScored) → No wins ✅

Example 1:
Liverpool 2-1 Tottenham
→ Both scored = BTTS Yes wins ✅

Example 2:
Liverpool 3-0 Tottenham
→ Only Liverpool scored = BTTS No wins ✅

Example 3:
Liverpool 0-0 Tottenham
→ Neither scored = BTTS No wins ✅
```

**In Your App:**
```typescript
{
  betType: 'btts',
  prediction: 'yes', // or 'no'
  odds: 1.70
}
```

---

### 5. **Double Chance** 🎲

**Description:** Bet on two out of three possible match outcomes.

**Options:**
- **1X** = Home win OR Draw
- **X2** = Draw OR Away win
- **12** = Home win OR Away win (no draw)

**Examples:**
```
Match: Everton vs Newcastle

Options:
✅ 1X (Everton wins or draw)
✅ X2 (Draw or Newcastle wins)
✅ 12 (Either team wins, no draw)
```

**How It's Verified:**
```typescript
if (prediction === '1X') {
  if (homeScore >= awayScore) → 1X wins ✅
}

if (prediction === 'X2') {
  if (homeScore <= awayScore) → X2 wins ✅
}

if (prediction === '12') {
  if (homeScore !== awayScore) → 12 wins ✅
}

Examples:
Everton 2-1 Newcastle
→ 1X wins ✅ (home won)
→ X2 loses ❌
→ 12 wins ✅ (no draw)

Everton 1-1 Newcastle
→ 1X wins ✅ (draw)
→ X2 wins ✅ (draw)
→ 12 loses ❌ (was a draw)

Everton 0-2 Newcastle
→ 1X loses ❌
→ X2 wins ✅ (away won)
→ 12 wins ✅ (no draw)
```

**In Your App:**
```typescript
{
  betType: 'double_chance',
  prediction: '1X', // or 'X2', '12'
  odds: 1.30
}
```

---

## 📊 Bet Type Comparison Table

| Bet Type | Complexity | Popularity | Win Rate | Best For |
|----------|-----------|------------|----------|----------|
| **H2H** | ⭐ Simple | ⭐⭐⭐⭐⭐ | 33% | Beginners |
| **Totals** | ⭐⭐ Easy | ⭐⭐⭐⭐⭐ | 50% | Goal prediction |
| **Spreads** | ⭐⭐⭐ Medium | ⭐⭐⭐ | 50% | Favorites |
| **BTTS** | ⭐⭐ Easy | ⭐⭐⭐⭐ | 50% | High-scoring |
| **Double Chance** | ⭐⭐ Easy | ⭐⭐⭐ | 66% | Safe bets |

---

## 🎯 Real-World Examples

### Example 1: Premier League Match

**Match:** Manchester City vs Brighton
**Odds Available:**

```typescript
// H2H
{ betType: 'h2h', prediction: 'home', odds: 1.30 }  // Man City win
{ betType: 'h2h', prediction: 'draw', odds: 6.50 }  // Draw
{ betType: 'h2h', prediction: 'away', odds: 11.00 } // Brighton win

// Totals
{ betType: 'totals', prediction: 'over', line: 2.5, odds: 1.85 }
{ betType: 'totals', prediction: 'under', line: 2.5, odds: 1.95 }
{ betType: 'totals', prediction: 'over', line: 3.5, odds: 2.75 }

// Spreads
{ betType: 'spreads', prediction: 'home', line: -1.5, odds: 1.75 } // Man City -1.5
{ betType: 'spreads', prediction: 'away', line: +2.5, odds: 1.65 } // Brighton +2.5

// BTTS
{ betType: 'btts', prediction: 'yes', odds: 1.90 }
{ betType: 'btts', prediction: 'no', odds: 1.85 }

// Double Chance
{ betType: 'double_chance', prediction: '1X', odds: 1.12 } // Man City or Draw
{ betType: 'double_chance', prediction: '12', odds: 1.08 } // Man City or Brighton
```

**Final Score:** Man City 4-1 Brighton

**Results:**
```
✅ H2H Home - WON (Man City won)
❌ H2H Draw - LOST
❌ H2H Away - LOST

✅ Over 2.5 - WON (5 goals total)
❌ Under 2.5 - LOST
✅ Over 3.5 - WON (5 goals total)

✅ Man City -1.5 - WON (4-1.5 = 2.5 > 1)
✅ Brighton +2.5 - LOST (1+2.5 = 3.5 < 4)

✅ BTTS Yes - WON (both scored)
❌ BTTS No - LOST

✅ 1X - WON (home won)
✅ 12 - WON (no draw)
```

---

## 🎮 How To Create Slips with Different Bet Types

### **In SlipUploadScreen:**

Add bet type selector:

```typescript
// State
const [betType, setBetType] = useState<'h2h' | 'totals' | 'spreads' | 'btts' | 'double_chance'>('h2h');
const [prediction, setPrediction] = useState('home');
const [line, setLine] = useState<number>();

// UI
<Picker
  selectedValue={betType}
  onValueChange={setBetType}
>
  <Picker.Item label="Match Winner (H2H)" value="h2h" />
  <Picker.Item label="Over/Under (Totals)" value="totals" />
  <Picker.Item label="Handicap (Spreads)" value="spreads" />
  <Picker.Item label="Both Teams Score (BTTS)" value="btts" />
  <Picker.Item label="Double Chance" value="double_chance" />
</Picker>

// Conditional inputs based on bet type
{betType === 'totals' && (
  <TextInput
    placeholder="Line (e.g., 2.5)"
    keyboardType="decimal-pad"
    onChangeText={(text) => setLine(parseFloat(text))}
  />
)}

// Save slip
await FirestoreService.createSlip({
  ...otherData,
  betType,
  prediction,
  line,
});
```

---

## 📱 UI Display Examples

### **Slip Card Display:**

```typescript
// H2H
"Arsenal to win @ 2.50"

// Totals
"Over 2.5 goals @ 1.85"

// Spreads
"Man City -1.5 @ 1.75"

// BTTS
"Both teams to score (Yes) @ 1.90"

// Double Chance
"Home or Draw (1X) @ 1.30"
```

---

## 🏆 Pro Tips for Each Bet Type

### **H2H:**
- ✅ Best for strong favorites
- ✅ Research head-to-head history
- ❌ Avoid evenly matched teams (low odds)

### **Totals:**
- ✅ Check teams' scoring averages
- ✅ Over 2.5 most popular
- ✅ Weather affects total goals

### **Spreads:**
- ✅ Great for heavy favorites
- ✅ Check goal difference stats
- ❌ Risky for close matches

### **BTTS:**
- ✅ Best for offensive teams
- ✅ Check defensive records
- ✅ High in derbies

### **Double Chance:**
- ✅ Safer, lower odds
- ✅ Good for parlays
- ✅ Great for underdogs

---

## ✅ Summary

**Supported Bet Types:** 5+
- ✅ H2H (Home/Away/Draw)
- ✅ Totals (Over/Under)
- ✅ Spreads (Handicap)
- ✅ BTTS (Both Teams To Score)
- ✅ Double Chance

**All automatically verified with API-Football!** 🎉

**For Creators:**
- Create slips with any bet type
- Auto-verified after match
- Stats update automatically

**For Users:**
- See variety of bet types
- Trust API-verified results
- Follow creators with best accuracy per type

---

**🚀 YOUR APP NOW SUPPORTS PROFESSIONAL BETTING MARKETS!**

