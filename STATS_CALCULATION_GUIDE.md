# 📊 Stats Calculation Guide: Win Rate, Accuracy & ROI

## 🎯 Overview

This document explains how we calculate the three core statistics: **Win Rate**, **Accuracy**, and **ROI** for creators in the Mmasa app.

---

## 1️⃣ WIN RATE

### **Definition**
Win Rate is the percentage of verified slips that resulted in a win.

### **Formula**
```
Win Rate = (Total Wins / Total Verified Slips) × 100
```

### **Calculation Details**

#### **Data Source:**
- Query all slips where:
  - `creatorId` == creator's ID
  - `resultChecked` == `true` (only verified slips count)
  - `status` == `'won'` OR `'lost'` (exclude `'pending'`)

#### **Current Implementation:**
```typescript
// From firestore.service.ts (line 277-309)
const slipsQuery = query(
  collection(firebaseFirestore, Collections.SLIPS),
  where('creatorId', '==', creatorId),
  where('resultChecked', '==', true)
);

const slips = snapshot.docs.map(doc => doc.data());
const totalSlips = slips.length;  // Total verified slips
const wins = slips.filter(slip => slip.status === 'won').length;
const winRate = totalSlips > 0 ? (wins / totalSlips) * 100 : 0;
```

#### **Edge Cases:**
- **No verified slips**: Win Rate = `0%` (not `undefined` or `null`)
- **All wins**: Win Rate = `100%`
- **All losses**: Win Rate = `0%`
- **Pending slips**: Excluded from calculation (only count verified results)

#### **Precision:**
- Round to **1 decimal place** (e.g., `72.7%`, not `72.73%`)
- Display format: `"72.7%"` or `72.7` (depending on UI)

#### **When Updated:**
- ✅ When a slip result is updated (`resultChecked` becomes `true`)
- ✅ When a slip status changes from `pending` → `won` or `lost`
- ✅ Manually recalculated via `updateCreatorStats()` function

---

## 2️⃣ ACCURACY

### **Definition**
Accuracy is a **weighted performance metric** that considers both win rate AND the difficulty of predictions (odds). Higher odds wins count more than lower odds wins.

### **Formula**
```
Accuracy = (Weighted Wins / Weighted Total) × 100

Where:
- Weighted Wins = Sum of (odds × 1) for won slips
- Weighted Total = Sum of (odds × 1) for all verified slips
```

### **Alternative Calculation (Recommended):**
```
Accuracy = (Sum of Odds for Won Slips / Sum of Odds for All Verified Slips) × 100
```

### **Why This Matters:**
- A win at **odds 5.0** is more impressive than a win at **odds 1.5**
- This rewards creators who consistently win difficult predictions
- More accurate representation of skill vs luck

### **Calculation Details**

#### **Data Source:**
- Same query as Win Rate (verified slips only)
- Include `odds` field from each slip

#### **Implementation:**
```typescript
const verifiedSlips = slips.filter(slip => slip.resultChecked === true);
const wonSlips = verifiedSlips.filter(slip => slip.status === 'won');

// Sum of odds for won slips
const weightedWins = wonSlips.reduce((sum, slip) => {
  return sum + (slip.odds || 1.0); // Default to 1.0 if odds missing
}, 0);

// Sum of odds for all verified slips
const weightedTotal = verifiedSlips.reduce((sum, slip) => {
  return sum + (slip.odds || 1.0);
}, 0);

const accuracy = weightedTotal > 0 
  ? (weightedWins / weightedTotal) * 100 
  : 0;
```

#### **Example:**
```
Creator has 3 verified slips:
- Slip 1: Won, Odds 2.0
- Slip 2: Lost, Odds 3.5
- Slip 3: Won, Odds 5.0

Win Rate = (2/3) × 100 = 66.7%
Accuracy = (2.0 + 5.0) / (2.0 + 3.5 + 5.0) × 100
         = 7.0 / 10.5 × 100
         = 66.7%

But if Slip 3 was lost instead:
Win Rate = (1/3) × 100 = 33.3%
Accuracy = 2.0 / (2.0 + 3.5 + 5.0) × 100
         = 2.0 / 10.5 × 100
         = 19.0%

This shows accuracy penalizes losing high-odds bets more!
```

#### **Edge Cases:**
- **Missing odds**: Default to `1.0` (neutral weight)
- **Zero odds**: Treat as `1.0` to avoid division errors
- **No verified slips**: Accuracy = `0%`
- **All wins**: Accuracy = `100%` (same as win rate)
- **All losses**: Accuracy = `0%`

#### **Precision:**
- Round to **1 decimal place** (e.g., `66.7%`)

#### **When Updated:**
- ✅ Same triggers as Win Rate
- ✅ Recalculated whenever win rate is updated

---

## 3️⃣ ROI (Return on Investment)

### **Definition**
ROI measures the **financial return** creators get from their premium slips. It's calculated as earnings per slip created.

### **Formula (Creator ROI)**
```
ROI = (Total Earnings / Total Premium Slips Created) × 100

OR more accurately:

ROI = ((Total Earnings - Platform Fees) / Total Premium Slips) × 100
```

### **Alternative: Earnings Per Slip**
```
Average Earnings Per Slip = Total Earnings / Total Premium Slips
```

### **Calculation Details**

#### **Data Source:**
1. **Total Earnings**: Sum from `transactions` collection
   - Query: `type == 'earning'` AND `status == 'completed'`
   - Sum: `amount` field

2. **Total Premium Slips**: Count from `slips` collection
   - Query: `creatorId == creatorId` AND `isPremium == true`
   - Count: Total documents

3. **Platform Fees**: 10% of total earnings
   - `platformFeesPaid = totalEarnings × 0.10`
   - `netEarnings = totalEarnings - platformFeesPaid`

#### **Implementation:**
```typescript
// Get total earnings from transactions
const earningsQuery = query(
  collection(firebaseFirestore, Collections.TRANSACTIONS),
  where('userId', '==', creatorId), // Assuming transactions have userId
  where('type', '==', 'earning'),
  where('status', '==', 'completed')
);
const earningsSnapshot = await getDocs(earningsQuery);
const totalEarnings = earningsSnapshot.docs.reduce((sum, doc) => {
  return sum + (doc.data().amount || 0);
}, 0);

// Get total premium slips
const premiumSlipsQuery = query(
  collection(firebaseFirestore, Collections.SLIPS),
  where('creatorId', '==', creatorId),
  where('isPremium', '==', true)
);
const premiumSlipsSnapshot = await getDocs(premiumSlipsQuery);
const totalPremiumSlips = premiumSlipsSnapshot.docs.length;

// Calculate ROI
const platformFees = totalEarnings * 0.10; // 10% platform fee
const netEarnings = totalEarnings - platformFees;
const roi = totalPremiumSlips > 0 
  ? (netEarnings / totalPremiumSlips) * 100 
  : 0;

// Or simpler: Average earnings per slip
const avgEarningsPerSlip = totalPremiumSlips > 0 
  ? netEarnings / totalPremiumSlips 
  : 0;
```

#### **Example:**
```
Creator has:
- 10 premium slips created
- Total earnings: GH₵ 100.00
- Platform fees (10%): GH₵ 10.00
- Net earnings: GH₵ 90.00

ROI = (90.00 / 10) × 100 = 900%
Average Earnings Per Slip = GH₵ 9.00

This means on average, each premium slip earns GH₵ 9.00
```

#### **Edge Cases:**
- **No premium slips**: ROI = `0%` or `undefined` (show "N/A")
- **No earnings yet**: ROI = `0%`
- **Negative earnings**: Shouldn't happen, but handle gracefully
- **Free slips only**: ROI = `N/A` (not applicable)

#### **Precision:**
- Round to **2 decimal places** for currency (GH₵ 9.00)
- Round to **1 decimal place** for percentage (900.0%)

#### **When Updated:**
- ✅ When a premium slip is purchased (earnings transaction created)
- ✅ When a premium slip is created (denominator changes)
- ✅ When a withdrawal is made (doesn't affect ROI, but affects available balance)

---

## 📊 COMPARISON TABLE

| Metric | Formula | What It Measures | Best For |
|--------|---------|-------------------|----------|
| **Win Rate** | `(Wins / Verified Slips) × 100` | Simple success rate | Quick comparison, easy to understand |
| **Accuracy** | `(Weighted Wins / Weighted Total) × 100` | Skill-adjusted performance | Finding skilled tipsters |
| **ROI** | `(Net Earnings / Premium Slips) × 100` | Financial performance | Monetization success |

---

## 🔄 UPDATE TRIGGERS

### **When Slip Result is Updated:**
1. ✅ Update `winRate`
2. ✅ Update `accuracy`
3. ❌ ROI (not affected by result, only by purchases)

### **When Premium Slip is Purchased:**
1. ❌ Win Rate (not affected)
2. ❌ Accuracy (not affected)
3. ✅ Update `roi` (earnings increased)

### **When Premium Slip is Created:**
1. ❌ Win Rate (not affected until verified)
2. ❌ Accuracy (not affected until verified)
3. ✅ Update `roi` (denominator increased, but no earnings yet)

---

## 🎯 RECOMMENDED DISPLAY

### **Creator Profile Screen:**
```
┌─────────────────────────────┐
│  Win Rate: 72.7%            │
│  Accuracy: 68.3%            │
│  ROI: GH₵ 9.50/slip         │
└─────────────────────────────┘
```

### **Leaderboard Screen:**
- Primary sort: **Win Rate** (current)
- Secondary sort: **Accuracy** (new)
- Display: Both metrics side-by-side

### **Tooltips/Help Text:**
- **Win Rate**: "Percentage of verified slips that won"
- **Accuracy**: "Performance weighted by odds difficulty"
- **ROI**: "Average earnings per premium slip (after fees)"

---

## ✅ IMPLEMENTATION CHECKLIST

### **Phase 1: Win Rate** ✅ (Already Done)
- [x] Query verified slips
- [x] Count wins vs total
- [x] Calculate percentage
- [x] Round to 1 decimal
- [x] Update on slip result change

### **Phase 2: Accuracy** ⏳ (To Implement)
- [ ] Add `accuracy` field to Creator interface
- [ ] Query verified slips with odds
- [ ] Calculate weighted wins/total
- [ ] Round to 1 decimal
- [ ] Update alongside win rate

### **Phase 3: ROI** ⏳ (To Implement)
- [ ] Add `roi` and `avgEarningsPerSlip` fields to Creator interface
- [ ] Query earnings transactions
- [ ] Query premium slips count
- [ ] Calculate ROI
- [ ] Update on purchase/slip creation
- [ ] Handle edge cases (no premium slips, etc.)

---

## 🚨 IMPORTANT NOTES

1. **Win Rate vs Accuracy**: 
   - Win Rate is simpler and easier to understand
   - Accuracy is more sophisticated and rewards difficult wins
   - Consider showing both!

2. **ROI Calculation**:
   - Only applies to creators with premium slips
   - Should show "N/A" for creators with only free slips
   - Consider showing "Average Earnings Per Slip" instead of percentage

3. **Performance**:
   - These calculations can be expensive (multiple queries)
   - Consider caching results
   - Update incrementally when possible (don't recalculate everything)

4. **Data Integrity**:
   - Ensure `odds` field is always present and valid
   - Handle missing data gracefully (defaults)
   - Validate calculations (no division by zero)

---

## 📝 NEXT STEPS

1. ✅ Review and approve calculation formulas
2. ⏳ Implement Accuracy calculation
3. ⏳ Implement ROI calculation
4. ⏳ Update Creator interface/types
5. ⏳ Update UI components to display new stats
6. ⏳ Add unit tests for calculations
7. ⏳ Update documentation



