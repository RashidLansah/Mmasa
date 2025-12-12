# Deployment Guide

## Firebase Configuration & Deployment

### 1. Deploy Firestore Rules and Indexes

After setting up your Firebase project:

```bash
# Login to Firebase (if not already logged in)
npx firebase login

# Deploy Firestore rules and indexes
npx firebase deploy --only firestore
```

This will:
- Deploy security rules from `firestore.rules`
- Create composite indexes from `firestore.indexes.json`

### 2. Enable Authentication

In Firebase Console:
1. Go to Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. (Optional) Enable email verification
5. (Optional) Customize email templates

### 3. Set Up Firestore Database

In Firebase Console:
1. Go to Firestore Database
2. Click "Create Database"
3. Choose Production mode (rules are already configured)
4. Select your region (closest to your users)

### 4. Create Collections with Sample Data

Manually create these collections in Firestore Console or use Firebase Admin SDK:

#### Create a Creator
```
Collection: creators
Document ID: [auto-generate]
Fields:
  name: "Mike Predictions"
  avatar: "https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff"
  subscribers: 0
  winRate: 0
  totalSlips: 0
  verifiedStatus: "unverified"
  description: "Sports betting expert"
  createdAt: [server timestamp]
```

#### Create a Slip
```
Collection: slips
Document ID: [auto-generate]
Fields:
  creatorId: [creator document ID from above]
  creatorName: "Mike Predictions"
  creatorAvatar: "https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff"
  title: "Liverpool vs Arsenal"
  description: "Liverpool to win at home"
  odds: 2.10
  status: "pending"
  matchDate: [future timestamp]
  sport: "Football"
  league: "Premier League"
  createdAt: [server timestamp]
  likes: 0
  comments: 0
```

### 5. Download Android Configuration (If Needed)

1. Go to Firebase Console → Project Settings
2. Under "Your apps", find the Android app or add one
3. Download `google-services.json`
4. Place it in the project root directory

### 6. Test the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### 7. Test Authentication Flow

1. Open the app
2. Skip onboarding
3. Click "Sign Up" on login screen
4. Create a test account with email/password
5. Verify you're redirected to the main app
6. Check Firestore Console to see your user document created

### 8. Verify Firestore Security

Try accessing Firestore from the app:
- You should be able to read creators and slips
- You should only be able to write to your own user document
- Unauthorized requests should be denied

## Production Deployment

### iOS App Store

1. Configure app signing in Xcode
2. Update version in `app.json`
3. Build for production:
   ```bash
   eas build --platform ios
   ```
4. Submit to App Store Connect

### Google Play Store

1. Create a keystore for signing
2. Update version in `app.json`
3. Build for production:
   ```bash
   eas build --platform android
   ```
4. Submit to Google Play Console

## Environment Variables

For production, consider using environment variables:

```bash
# .env.production
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=sureodds-8f685
FIREBASE_AUTH_DOMAIN=sureodds-8f685.firebaseapp.com
```

Update Firebase configuration to use these variables instead of hardcoded values.

## Monitoring & Analytics

### Enable Firebase Analytics
1. Go to Firebase Console → Analytics
2. Enable Google Analytics
3. Events are automatically tracked

### Error Reporting
Consider adding Crashlytics:
```bash
npm install @react-native-firebase/crashlytics
```

### Performance Monitoring
```bash
npm install @react-native-firebase/perf
```

## Backup & Security

1. **Firestore Backups**: Set up automatic backups in Firebase Console
2. **Security Rules**: Review and test security rules regularly
3. **API Keys**: Restrict API keys to specific platforms in Firebase Console
4. **User Data**: Implement data export/deletion for GDPR compliance

## Post-Deployment Checklist

- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] Email/Password auth enabled
- [ ] Sample data created
- [ ] iOS GoogleService-Info.plist in place
- [ ] Android google-services.json in place (if deploying to Android)
- [ ] App tested on iOS simulator/device
- [ ] App tested on Android emulator/device (if applicable)
- [ ] Authentication flow working
- [ ] User creation in Firestore working
- [ ] Data fetching from Firestore working
- [ ] Security rules preventing unauthorized access
- [ ] Production builds tested

## Troubleshooting

### Firestore Permission Denied
- Check security rules are deployed
- Verify user is authenticated
- Check the user is trying to access their own data

### Authentication Errors
- Verify Email/Password is enabled in Firebase Console
- Check GoogleService-Info.plist is correctly placed
- Ensure bundle ID matches Firebase project

### Build Errors
- Clear cache: `expo start -c`
- Clean install: `rm -rf node_modules && npm install`
- Check React Native Firebase setup: https://rnfirebase.io

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

