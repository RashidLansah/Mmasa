# 🚀 Quick Start Guide

## Firebase Console Setup (5 minutes)

### Step 1: Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **sureodds-8f685**
3. Navigate to **Authentication** → **Sign-in method**
4. Click **Email/Password**
5. Toggle **Enable** and click **Save**

### Step 2: Create Firestore Database
1. Navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (rules are already configured)
4. Select your region (e.g., `us-central` or closest to users)
5. Click **Enable**

### Step 3: Deploy Security Rules
In your terminal:
```bash
cd /Users/macbook/Documents/Mmasa
npx firebase deploy --only firestore
```

This deploys:
- Security rules (who can access what)
- Composite indexes (for efficient queries)

### Step 4: Add Sample Data (Optional but Recommended)

#### Create a Sample Creator
1. In Firestore Database, click **Start collection**
2. Collection ID: `creators`
3. Add document with auto-ID
4. Add these fields:
   ```
   name (string): "Mike Predictions"
   avatar (string): "https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff"
   subscribers (number): 0
   winRate (number): 0
   totalSlips (number): 0
   verifiedStatus (string): "verified"
   description (string): "Professional football analyst"
   createdAt (timestamp): [Click to set server timestamp]
   ```

#### Create a Sample Slip
1. Create collection: `slips`
2. Add document with auto-ID
3. Add these fields:
   ```
   creatorId (string): [Copy creator document ID from above]
   creatorName (string): "Mike Predictions"
   creatorAvatar (string): "https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff"
   title (string): "Liverpool vs Arsenal"
   description (string): "Liverpool to win at home. Strong form."
   odds (number): 2.10
   status (string): "pending"
   matchDate (timestamp): [Set to future date]
   sport (string): "Football"
   league (string): "Premier League"
   createdAt (timestamp): [Server timestamp]
   likes (number): 0
   comments (number): 0
   ```

## Run the App

```bash
# Start development server
npm start

# In another terminal, run on iOS
npm run ios

# Or run on Android (after adding google-services.json)
npm run android
```

## Test the App

### 1. Sign Up
- Open the app
- Skip onboarding
- Click **Sign Up**
- Enter:
  - Name: Your Name
  - Email: test@example.com
  - Password: test123456
  - Confirm Password: test123456
- Click **Sign Up**

### 2. Verify User Created
- Go to Firebase Console → Firestore Database
- Check `users` collection
- Your user document should be there

### 3. Test Logout
- Go to Settings tab
- See your name and email displayed
- Click **Logout**
- Confirm logout

### 4. Test Login
- Enter same email/password
- Click **Sign In**
- You should be logged back in

## Troubleshooting

### "Email/Password not enabled"
→ Go to Firebase Console → Authentication → Enable Email/Password

### "Permission denied" errors
→ Deploy Firestore rules: `npx firebase deploy --only firestore`

### Can't see data in app
→ Add sample data to Firestore (see Step 4 above)

### Android build fails
→ Download google-services.json from Firebase Console and place in project root

## What's Next?

1. ✅ **Working**: Authentication, user management, logout
2. 📝 **Add More Data**: Create more creators and slips in Firestore
3. 🎨 **Customize**: Update screens to fetch and display real Firestore data
4. 💳 **Payments**: Integrate payment provider for subscriptions
5. 📱 **Push Notifications**: Set up Firebase Cloud Messaging
6. 🖼️ **Images**: Set up Firebase Storage for slip images

## Files to Review

- `src/services/auth.service.ts` - Authentication logic
- `src/services/firestore.service.ts` - Database operations
- `src/contexts/AuthContext.tsx` - Auth state management
- `FIREBASE_SETUP.md` - Detailed Firebase documentation
- `DEPLOYMENT.md` - Production deployment guide

---

**Need Help?** Check `SETUP_SUMMARY.md` for complete setup details.

