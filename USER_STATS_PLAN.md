# 📊 User Statistics Planning Document

## 🎯 Overview

This document defines all user statistics that will be tracked in the Mmasa betting app. Stats are categorized by user type (Creator vs Regular User) and tracked across different dimensions.

---

## 👤 User Types

### 1. **Regular Users** (Consumers)
Users who browse, purchase slips, and subscribe to creators but don't create content.

### 2. **Creators** (Tipsters)
Users who create and share betting slips. They can have both creator stats AND regular user stats.

---

## 📈 STAT CATEGORIES

### **A. CREATOR STATS** (Tipster Performance)

#### **Performance Metrics**
```typescript
{
  // Core Performance
  totalSlips: number;              // Total slips created (all time)
  totalSlipsChecked: number;        // Slips with verified results
  wins: number;                     // Total won slips
  losses: number;                   // Total lost slips
  pending: number;                  // Slips awaiting results
  winRate: number;                  // (wins / totalSlipsChecked) * 100
  
  // Recent Performance (Last 30 days)
  recentSlips: number;              // Slips created in last 30 days
  recentWins: number;               // Wins in last 30 days
  recentWinRate: number;            // Win rate for last 30 days
  
  // Streaks
  currentWinStreak: number;         // Current consecutive wins
  bestWinStreak: number;            // Best consecutive wins ever
  currentLossStreak: number;        // Current consecutive losses
  worstLossStreak: number;          // Worst consecutive losses ever
  
  // Activity
  averageOdds: number;              // Average odds of all slips
  totalOddsValue: number;           // Sum of all odds
  firstSlipDate: Date;              // Date of first slip creation
  lastSlipDate: Date;               // Date of most recent slip
  daysActive: number;               // Days since first slip
}
```

#### **Engagement Metrics**
```typescript
{
  subscribers: number;               // Total active subscribers
  totalSubscribers: number;          // All-time subscriber count
  likesReceived: number;            // Total likes on all slips
  commentsReceived: number;         // Total comments on all slips
  viewsReceived: number;           // Total views on all slips (if tracking)
  sharesReceived: number;           // Total shares (if tracking)
  
  // Premium Content
  premiumSlips: number;             // Total premium slips created
  freeSlips: number;                // Total free slips created
  totalPurchases: number;           // Total purchases of creator's slips
  averageSlipPrice: number;         // Average price of premium slips
}
```

#### **Financial Metrics** (Creator Earnings)
```typescript
{
  totalEarnings: number;            // Total earnings from slip sales (GH₵)
  availableBalance: number;         // Available for withdrawal (GH₵)
  totalWithdrawn: number;           // Total withdrawn (GH₵)
  pendingEarnings: number;          // Earnings in 5-day hold period (GH₵)
  
  // Breakdown
  earningsThisMonth: number;        // Earnings in current month
  earningsLastMonth: number;        // Earnings in previous month
  bestEarningDay: number;           // Highest single-day earnings
  bestEarningSlip: number;          // Highest earning from single slip
  
  // Platform Fees
  platformFeesPaid: number;         // Total platform fees (10% of earnings)
  netEarnings: number;              // Total earnings - platform fees
}
```

#### **Reputation & Verification**
```typescript
{
  verifiedStatus: 'verified' | 'unverified' | 'pending';
  verificationDate?: Date;          // When verified
  verificationMethod?: 'manual' | 'auto'; // How they got verified
  
  // Trust Score (0-100)
  trustScore: number;               // Calculated from multiple factors
  trustFactors: {
    accountAge: number;             // Days since account creation
    consistencyScore: number;        // Regular posting consistency
    accuracyScore: number;          // Win rate weighted by recency
    engagementScore: number;        // Subscriber engagement
  };
  
  // Badges/Achievements
  badges: string[];                 // e.g., ['verified', 'top_performer', 'consistent']
  rank: number;                     // Current leaderboard rank
  previousRank: number;             // Previous leaderboard rank
  rankChange: number;               // Rank change (negative = improved)
}
```

---

### **B. REGULAR USER STATS** (Consumer Activity)

#### **Activity Metrics**
```typescript
{
  // Account Info
  accountAge: number;               // Days since account creation
  lastActiveDate: Date;            // Last login/activity date
  totalLogins: number;              // Total login count
  
  // Slip Interaction
  slipsPurchased: number;           // Total premium slips purchased
  slipsViewed: number;              // Total slips viewed (if tracking)
  slipsLiked: number;               // Total slips liked
  slipsCommented: number;           // Total comments made
  slipsSaved: number;               // Total slips saved/bookmarked (if feature exists)
  
  // Following/Subscriptions
  creatorsSubscribed: number;       // Active subscriptions
  totalSubscriptions: number;       // All-time subscriptions
  creatorsFollowed: number;         // Creators followed (if follow feature exists)
  
  // Purchasing Behavior
  totalSpent: number;               // Total money spent on slips (GH₵)
  averagePurchasePrice: number;     // Average price per purchase
  lastPurchaseDate?: Date;          // Date of last purchase
  favoriteCreator?: string;         // Creator ID with most purchases
  
  // Engagement
  notificationsEnabled: boolean;   // Push notifications preference
  emailNotificationsEnabled: boolean; // Email notifications preference
}
```

#### **Financial Metrics** (Regular User Spending)
```typescript
{
  totalSpent: number;               // Total spent on premium slips (GH₵)
  totalSpentThisMonth: number;      // Spending in current month
  totalSpentLastMonth: number;     // Spending in previous month
  averageSpendPerMonth: number;     // Average monthly spending
  
  // Transaction History
  totalTransactions: number;       // Total purchase transactions
  successfulPurchases: number;     // Successful purchases
  failedPurchases: number;          // Failed purchase attempts
  
  // Spending Patterns
  preferredPriceRange: {            // Most common price range
    min: number;
    max: number;
  };
  mostActiveDay: string;            // Day of week with most activity
  mostActiveTime: string;           // Time of day with most activity
}
```

#### **Performance Tracking** (If User Bets on Purchased Slips)
```typescript
{
  // If users can track their own betting performance
  slipsFollowed: number;            // Slips purchased and tracked
  slipsWon: number;                 // Purchased slips that won
  slipsLost: number;                // Purchased slips that lost
  personalWinRate: number;         // Win rate on purchased slips
  
  // ROI Tracking
  totalInvested: number;            // Total spent on slips
  totalPotentialWinnings: number;   // Sum of potential winnings (if user bets)
  estimatedROI: number;            // Estimated return on investment
}
```

---

### **C. SHARED STATS** (Both User Types)

#### **Account Stats**
```typescript
{
  // Profile
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date;
  
  // Subscription Status
  subscriptionStatus: 'free' | 'premium'; // User's own subscription tier
  subscriptionExpiryDate?: Date;
  
  // Activity
  lastLoginDate: Date;
  totalSessions: number;
  averageSessionDuration?: number;  // If tracking session time
  
  // Preferences
  favoriteSports: string[];        // Most viewed/interacted sports
  favoriteLeagues: string[];        // Most viewed/interacted leagues
  notificationPreferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}
```

---

## 🗄️ FIRESTORE STRUCTURE

### **Users Collection** (`users`)
```typescript
users/{userId}
{
  // Basic Info
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Timestamp;
  
  // Subscription
  subscriptionStatus: 'free' | 'premium';
  subscribedCreators: string[];
  
  // Regular User Stats
  stats: {
    accountAge: number;
    lastActiveDate: Timestamp;
    totalLogins: number;
    slipsPurchased: number;
    slipsViewed: number;
    slipsLiked: number;
    slipsCommented: number;
    creatorsSubscribed: number;
    totalSubscriptions: number;
    totalSpent: number;
    totalSpentThisMonth: number;
    totalSpentLastMonth: number;
    totalTransactions: number;
    successfulPurchases: number;
    failedPurchases: number;
    lastPurchaseDate?: Timestamp;
    favoriteCreator?: string;
    favoriteSports: string[];
    favoriteLeagues: string[];
  };
  
  // Creator Stats (only if user is a creator)
  creatorStats?: {
    totalSlips: number;
    totalSlipsChecked: number;
    wins: number;
    losses: number;
    pending: number;
    winRate: number;
    recentSlips: number;
    recentWins: number;
    recentWinRate: number;
    currentWinStreak: number;
    bestWinStreak: number;
    currentLossStreak: number;
    worstLossStreak: number;
    averageOdds: number;
    totalOddsValue: number;
    firstSlipDate: Timestamp;
    lastSlipDate: Timestamp;
    daysActive: number;
    subscribers: number;
    totalSubscribers: number;
    likesReceived: number;
    commentsReceived: number;
    viewsReceived: number;
    sharesReceived: number;
    premiumSlips: number;
    freeSlips: number;
    totalPurchases: number;
    averageSlipPrice: number;
    totalEarnings: number;
    availableBalance: number;
    totalWithdrawn: number;
    pendingEarnings: number;
    earningsThisMonth: number;
    earningsLastMonth: number;
    bestEarningDay: number;
    bestEarningSlip: number;
    platformFeesPaid: number;
    netEarnings: number;
    verifiedStatus: 'verified' | 'unverified' | 'pending';
    verificationDate?: Timestamp;
    verificationMethod?: 'manual' | 'auto';
    trustScore: number;
    trustFactors: {
      accountAge: number;
      consistencyScore: number;
      accuracyScore: number;
      engagementScore: number;
    };
    badges: string[];
    rank: number;
    previousRank: number;
    rankChange: number;
  };
}
```

### **Creators Collection** (`creators`)
```typescript
creators/{creatorId}
{
  // Basic Info (duplicated from users for quick access)
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  description?: string;
  createdAt: Timestamp;
  
  // All creatorStats from users collection
  // (same structure as above)
}
```

---

## 🔄 STAT CALCULATION & UPDATES

### **When Stats Update**

#### **Creator Stats Updates:**
1. **Slip Created** → Increment `totalSlips`, `pending`, update `lastSlipDate`
2. **Slip Result Updated** → Update `wins`/`losses`, recalculate `winRate`, update streaks
3. **Slip Purchased** → Increment `totalPurchases`, update `totalEarnings`
4. **User Subscribes** → Increment `subscribers`, `totalSubscribers`
5. **Slip Liked** → Increment `likesReceived`
6. **Slip Commented** → Increment `commentsReceived`
7. **Withdrawal Made** → Update `availableBalance`, `totalWithdrawn`
8. **Daily Job** → Recalculate `recentWinRate`, update `rank`, `rankChange`

#### **Regular User Stats Updates:**
1. **Slip Purchased** → Increment `slipsPurchased`, `totalSpent`, `totalTransactions`
2. **User Logs In** → Update `lastActiveDate`, `lastLoginDate`, increment `totalLogins`
3. **User Subscribes** → Increment `creatorsSubscribed`, `totalSubscriptions`
4. **User Likes Slip** → Increment `slipsLiked`
5. **User Comments** → Increment `slipsCommented`
6. **Monthly Reset** → Reset `totalSpentThisMonth`, archive `totalSpentLastMonth`

---

## 📊 STAT DISPLAY LOCATIONS

### **Creator Profile Screen**
- Win Rate (prominent)
- Total Slips
- Subscribers
- Current Win Streak
- Total Earnings (if viewing own profile)
- Trust Score
- Rank

### **Leaderboard Screen**
- Win Rate (primary sort)
- Total Slips
- Subscribers
- Rank

### **User Profile/Settings Screen**
- Account Age
- Slips Purchased
- Total Spent
- Active Subscriptions
- Favorite Creators

### **Wallet Screen** (Creators)
- Available Balance
- Total Earnings
- Pending Earnings
- Earnings This Month
- Total Withdrawn

### **My Slips Screen**
- Created Slips Count
- Purchased Slips Count
- Personal Win Rate (if tracking)

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Core Stats (MVP)**
- ✅ Creator: `winRate`, `totalSlips`, `wins`, `subscribers` (Already implemented)
- ⏳ Regular User: `slipsPurchased`, `totalSpent`, `creatorsSubscribed`
- ⏳ Creator: `totalEarnings`, `availableBalance`

### **Phase 2: Enhanced Stats**
- Creator: Streaks (`currentWinStreak`, `bestWinStreak`)
- Creator: Recent performance (`recentWinRate`, `recentSlips`)
- Regular User: `favoriteCreator`, `lastPurchaseDate`
- Creator: `premiumSlips`, `freeSlips`, `totalPurchases`

### **Phase 3: Advanced Stats**
- Creator: Trust Score calculation
- Creator: Rank tracking (`rank`, `previousRank`, `rankChange`)
- Regular User: Spending patterns (`totalSpentThisMonth`, `averageSpendPerMonth`)
- Creator: Financial breakdown (`earningsThisMonth`, `platformFeesPaid`)

### **Phase 4: Analytics & Insights**
- Creator: `averageOdds`, `daysActive`
- Regular User: `favoriteSports`, `favoriteLeagues`
- Both: Activity patterns (`mostActiveDay`, `mostActiveTime`)
- Creator: Engagement metrics (`likesReceived`, `commentsReceived`)

---

## 🔧 TECHNICAL CONSIDERATIONS

### **Performance**
- Use Firestore aggregation queries where possible
- Cache frequently accessed stats
- Update stats asynchronously (don't block user actions)
- Use Firestore transactions for critical stat updates

### **Data Consistency**
- Use Firestore transactions for financial stats
- Implement retry logic for failed stat updates
- Consider using Cloud Functions for complex calculations
- Validate stats periodically with background jobs

### **Privacy**
- Only show public stats on creator profiles
- Hide financial details from other users
- Allow users to opt-out of certain stat tracking

### **Scalability**
- Consider separate stats collection for heavy queries
- Use composite indexes for leaderboard queries
- Implement pagination for stat-heavy screens
- Cache leaderboard rankings

---

## 📝 NOTES

1. **Stats are calculated in real-time** but can be cached for performance
2. **Financial stats require transaction safety** - use Firestore transactions
3. **Rank calculations** should run periodically (e.g., hourly) not on every update
4. **Trust Score** is a composite metric - define calculation formula separately
5. **Some stats are optional** - implement based on feature availability (e.g., views, shares)

---

## ✅ NEXT STEPS

1. Review and approve this stat structure
2. Update Firestore schema/types
3. Implement stat update functions in `firestore.service.ts`
4. Create stat calculation utilities
5. Update UI components to display new stats
6. Add stat tracking to relevant user actions
7. Implement background jobs for periodic calculations



