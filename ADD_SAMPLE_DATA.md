# 📊 Adding Sample Data to Firestore

Follow these steps to add sample data to your Firebase Console.

## Step 1: Create Creators Collection (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **sureodds-8f685**
3. Navigate to **Firestore Database**
4. Click **Start collection**
5. Collection ID: `creators`

### Add Creator #1 - Mike Predictions
Click "Add document" → "Auto-ID"

```
name: Mike Predictions
avatar: https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff&size=128
subscribers: 2500
winRate: 82.5
totalSlips: 200
verifiedStatus: verified
description: Professional football analyst. Specializing in Premier League and Champions League predictions.
createdAt: [Click timestamp icon] → [Select "Set to server timestamp"]
```

### Add Creator #2 - Sarah Sports
Click "Add document" → "Auto-ID"

```
name: Sarah Sports
avatar: https://ui-avatars.com/api/?name=Sarah+Sports&background=8B5CF6&color=fff&size=128
subscribers: 1800
winRate: 75.3
totalSlips: 150
verifiedStatus: verified
description: Multi-sport expert covering football, basketball, and tennis.
createdAt: [Server timestamp]
```

### Add Creator #3 - David Odds
Click "Add document" → "Auto-ID"

```
name: David Odds
avatar: https://ui-avatars.com/api/?name=David+Odds&background=EF4444&color=fff&size=128
subscribers: 3200
winRate: 88.2
totalSlips: 300
verifiedStatus: verified
description: Value betting specialist. Focus on finding the best odds in the market.
createdAt: [Server timestamp]
```

### Add Creator #4 - Emma Analytics
Click "Add document" → "Auto-ID"

```
name: Emma Analytics
avatar: https://ui-avatars.com/api/?name=Emma+Analytics&background=F59E0B&color=fff&size=128
subscribers: 980
winRate: 70.1
totalSlips: 95
verifiedStatus: unverified
description: Data-driven predictions using advanced statistics.
createdAt: [Server timestamp]
```

## Step 2: Create Slips Collection (10 minutes)

1. In Firestore Database, click **Start collection**
2. Collection ID: `slips`

### Important: Copy Creator IDs
Before adding slips, **copy one creator's document ID**:
- Click on "Mike Predictions" document
- Copy the document ID (e.g., `xYz123...`)
- Use this as `creatorId` in slips

### Add Slip #1 - Liverpool vs Arsenal
Click "Add document" → "Auto-ID"

```
creatorId: [PASTE_CREATOR_ID_HERE]
creatorName: Mike Predictions
creatorAvatar: https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff&size=128
title: Liverpool vs Arsenal
description: Liverpool to win. They have a strong home record and Arsenal are missing key players.
odds: 2.10
status: pending
matchDate: [Click timestamp] → [Select date/time 2 days from now]
sport: Football
league: Premier League
stake: 100
potentialWin: 210
likes: 45
comments: 12
createdAt: [Server timestamp]
```

### Add Slip #2 - Man City vs Chelsea
Click "Add document" → "Auto-ID"

```
creatorId: [SAME_CREATOR_ID]
creatorName: Mike Predictions
creatorAvatar: https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff&size=128
title: Man City vs Chelsea - Over 2.5 Goals
description: Both teams have high-scoring attacks. Expect goals from both sides.
odds: 1.85
status: won
matchDate: [Yesterday's date]
sport: Football
league: Premier League
stake: 50
potentialWin: 92.50
likes: 67
comments: 23
createdAt: [Server timestamp]
```

### Add Slip #3 - Real Madrid vs Barcelona
Click "Add document" → "Auto-ID"

```
creatorId: [Use David Odds creator ID]
creatorName: David Odds
creatorAvatar: https://ui-avatars.com/api/?name=David+Odds&background=EF4444&color=fff&size=128
title: Real Madrid vs Barcelona - Both Teams to Score
description: El Clasico rarely disappoints. Both teams have strong attacks.
odds: 1.75
status: pending
matchDate: [3 days from now]
sport: Football
league: La Liga
stake: 200
potentialWin: 350
likes: 123
comments: 45
createdAt: [Server timestamp]
```

### Add Slip #4 - Lakers vs Warriors
Click "Add document" → "Auto-ID"

```
creatorId: [Use Sarah Sports creator ID]
creatorName: Sarah Sports
creatorAvatar: https://ui-avatars.com/api/?name=Sarah+Sports&background=8B5CF6&color=fff&size=128
title: Lakers vs Warriors - Over 220.5 Points
description: Both teams have high-scoring offenses. Expect a high-scoring game.
odds: 1.90
status: won
matchDate: [2 days ago]
sport: Basketball
league: NBA
stake: 75
potentialWin: 142.50
likes: 89
comments: 31
createdAt: [Server timestamp]
```

### Add Slip #5 - Bayern Munich vs Dortmund
Click "Add document" → "Auto-ID"

```
creatorId: [Use Mike Predictions creator ID]
creatorName: Mike Predictions
creatorAvatar: https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff&size=128
title: Bayern Munich vs Dortmund - Bayern to Win
description: Bayern's home dominance continues. Strong form and full squad available.
odds: 1.65
status: pending
matchDate: [Tomorrow]
sport: Football
league: Bundesliga
stake: 150
potentialWin: 247.50
likes: 156
comments: 67
createdAt: [Server timestamp]
```

### Add More Slips (Optional)
Add 5-10 more slips using different:
- Sports (Football, Basketball, Tennis, etc.)
- Leagues
- Status (pending, won, lost)
- Creators

## Tips:

### Creating Timestamps:
1. Click the field type dropdown
2. Select "timestamp"
3. Click the calendar icon
4. Select "Use server timestamp" OR pick a specific date/time

### Number Fields:
Make sure to set these as **number** type:
- odds
- winRate
- totalSlips
- subscribers
- stake
- potentialWin
- likes
- comments

### String Fields:
All text fields (name, description, etc.) should be **string** type

## Verify Your Data

After adding data:
1. Check you have 4+ creators
2. Check you have 5+ slips
3. Verify each slip has a valid `creatorId`
4. All timestamps are set

## Next Step

Once data is added, come back and say **"Data added"** and I'll update your screens to fetch this real data! 🚀

