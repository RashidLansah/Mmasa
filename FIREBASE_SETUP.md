# Firebase Setup Guide

This document explains the Firebase configuration for the Mmasa app.

## Firebase Services Enabled

1. **Authentication** - Email/Password
2. **Cloud Firestore** - Database

## Firestore Collections Structure

### 1. Users Collection (`users`)
```
users/{userId}
  - uid: string
  - email: string
  - displayName: string
  - phoneNumber: string | null
  - photoURL: string | null
  - createdAt: timestamp
  - subscriptionStatus: 'free' | 'premium'
  - subscribedCreators: string[]
```

### 2. Creators Collection (`creators`)
```
creators/{creatorId}
  - name: string
  - avatar: string (URL)
  - subscribers: number
  - winRate: number (0-100)
  - totalSlips: number
  - verifiedStatus: 'verified' | 'unverified'
  - description: string
  - createdAt: timestamp
```

### 3. Slips Collection (`slips`)
```
slips/{slipId}
  - creatorId: string
  - creatorName: string
  - creatorAvatar: string
  - title: string
  - description: string
  - odds: number
  - status: 'pending' | 'won' | 'lost'
  - matchDate: timestamp
  - sport: string
  - league: string
  - stake: number (optional)
  - potentialWin: number (optional)
  - imageUrl: string (optional)
  - createdAt: timestamp
  - likes: number
  - comments: number
```

### 4. Subscriptions Collection (`subscriptions`)
```
subscriptions/{subscriptionId}
  - userId: string
  - creatorId: string
  - status: 'active' | 'cancelled' | 'expired'
  - startDate: timestamp
  - endDate: timestamp
  - amount: number
  - createdAt: timestamp
```

### 5. Notifications Collection (`notifications`)
```
notifications/{notificationId}
  - userId: string
  - type: 'slip_update' | 'new_slip' | 'subscription' | 'general'
  - title: string
  - message: string
  - read: boolean
  - createdAt: timestamp
  - relatedId: string (optional - slip ID, creator ID, etc.)
```

### 6. Transactions Collection (`transactions`)
```
transactions/{transactionId}
  - userId: string
  - type: 'subscription' | 'payment'
  - amount: number
  - status: 'pending' | 'completed' | 'failed'
  - createdAt: timestamp
  - details: object
```

## Firestore Security Rules

Add these rules in the Firebase Console (Firestore -> Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone authenticated can read creators
    match /creators/{creatorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // In production, restrict to admin
    }
    
    // Anyone authenticated can read slips
    match /slips/{slipId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.creatorId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.creatorId == request.auth.uid;
    }
    
    // Users can read their own subscriptions
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Users can read/update their own notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null; // Backend creates, user updates (read status)
    }
    
    // Users can read their own transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Firestore Indexes

You may need to create these composite indexes in Firebase Console:

1. **Slips by creator and date**
   - Collection: `slips`
   - Fields: `creatorId` (Ascending), `createdAt` (Descending)

2. **Notifications by user and date**
   - Collection: `notifications`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

3. **Unread notifications**
   - Collection: `notifications`
   - Fields: `userId` (Ascending), `read` (Ascending)

## Sample Data Creation

To populate your Firestore with sample data:

1. Go to Firebase Console -> Firestore Database
2. Create the collections mentioned above
3. Add sample creators:

```javascript
{
  name: "John Tipster",
  avatar: "https://via.placeholder.com/150",
  subscribers: 1234,
  winRate: 78.5,
  totalSlips: 150,
  verifiedStatus: "verified",
  description: "Professional sports analyst with 5+ years experience",
  createdAt: [SERVER_TIMESTAMP]
}
```

4. Add sample slips:

```javascript
{
  creatorId: "[CREATOR_ID]",
  creatorName: "John Tipster",
  creatorAvatar: "https://via.placeholder.com/150",
  title: "Manchester United vs Chelsea",
  description: "United to win with both teams scoring",
  odds: 3.50,
  status: "pending",
  matchDate: [FUTURE_TIMESTAMP],
  sport: "Football",
  league: "Premier League",
  createdAt: [SERVER_TIMESTAMP],
  likes: 45,
  comments: 12
}
```

## Environment Setup

The app uses GoogleService-Info.plist for iOS configuration which contains:
- Project ID: `sureodds-8f685`
- Bundle ID: `com.pesewabrands.sureodds`

## Authentication Setup

1. In Firebase Console, go to Authentication
2. Enable Email/Password sign-in method
3. (Optional) Customize email templates for password reset
4. (Optional) Set up email verification

## Next Steps

1. ✅ Firebase Authentication (Email/Password) - Enabled
2. ✅ Firestore Database - Create collections
3. Add Firestore Security Rules
4. Create Firestore Indexes
5. Add sample data for testing
6. (Optional) Set up Firebase Storage for slip images
7. (Optional) Set up Firebase Cloud Functions for backend logic
8. (Optional) Set up Firebase Cloud Messaging for push notifications

