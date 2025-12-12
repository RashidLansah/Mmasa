# Mmasa - Sports Betting Slips Social Platform

A React Native mobile application for sharing and following sports betting predictions from verified creators.

## Features

- 🔐 **Email/Password Authentication** - Secure user registration and login
- 👥 **Creator Profiles** - Follow your favorite tipsters
- 🎫 **Betting Slips** - View, create, and share betting predictions
- 📊 **Leaderboard** - Track top-performing creators
- 🔔 **Notifications** - Stay updated on new slips and results
- 💳 **Subscriptions** - Subscribe to premium creators
- ⚙️ **Settings** - Manage account and preferences

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for routing
- **Firebase Authentication** for user management
- **Cloud Firestore** for real-time database
- **React Native Firebase** for native Firebase integration

## Getting Started

### Prerequisites

- Node.js (v20, 22, or 24 recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Mmasa
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - The iOS configuration is already included (`GoogleService-Info.plist`)
   - For Android, download `google-services.json` from Firebase Console and place it in the project root
   - See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions

4. Start the development server:
```bash
npm start
```

5. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Project Structure

```
Mmasa/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── common/      # Common components (Button, Text, Card, etc.)
│   ├── contexts/        # React Context providers
│   │   └── AuthContext.tsx
│   ├── navigation/      # Navigation configuration
│   │   ├── AuthStack.tsx
│   │   ├── MainTabs.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/         # Screen components
│   │   ├── auth/       # Login, Signup, Forgot Password
│   │   ├── home/       # Home feed, Creator profiles, Slip details
│   │   ├── leaderboard/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   └── settings/
│   ├── services/        # Firebase and API services
│   │   ├── firebase.ts
│   │   ├── auth.service.ts
│   │   └── firestore.service.ts
│   ├── data/           # Mock data and constants
│   └── design/         # Theme and design tokens
├── assets/             # Images, icons, fonts
├── App.tsx            # Root component
├── GoogleService-Info.plist  # Firebase iOS config
└── app.json           # Expo configuration
```

## Firebase Setup

### Authentication
- Email/Password authentication is enabled
- Password reset functionality included
- User profiles stored in Firestore

### Firestore Collections

1. **users** - User profiles and preferences
2. **creators** - Creator/tipster information
3. **slips** - Betting predictions
4. **subscriptions** - User subscriptions to creators
5. **notifications** - User notifications
6. **transactions** - Payment and subscription history

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for:
- Complete collection schemas
- Security rules
- Required indexes
- Sample data

## Key Components

### Authentication Flow
- `PhoneLoginScreen` - Email/password login (repurposed from phone login)
- `SignUpScreen` - User registration
- `ForgotPasswordScreen` - Password reset
- `AuthContext` - Global auth state management

### Main Features
- `HomeFeedScreen` - Browse all betting slips
- `CreatorProfileScreen` - View creator stats and slips
- `SlipDetailsScreen` - Detailed view of a betting slip
- `LeaderboardScreen` - Top creators by win rate
- `NotificationsScreen` - User notifications
- `SettingsScreen` - Account management and logout

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser

## Environment Configuration

The app is configured with:
- **Project ID**: `sureodds-8f685`
- **iOS Bundle ID**: `com.pesewabrands.sureodds`
- **Android Package**: `com.pesewabrands.sureodds`

## Next Steps

1. ✅ Set up Firebase Authentication (Email/Password)
2. ✅ Create user registration and login flows
3. ✅ Implement Firestore data services
4. 📝 Add Firestore security rules (see FIREBASE_SETUP.md)
5. 📝 Create Firestore indexes
6. 📝 Populate sample data for testing
7. 📝 Download Android google-services.json from Firebase Console
8. 🔄 Integrate real data in UI components
9. 🔄 Add image upload for slips (Firebase Storage)
10. 🔄 Implement payment integration
11. 🔄 Add push notifications (FCM)

## Troubleshooting

### Firebase Connection Issues
- Ensure GoogleService-Info.plist is in the project root
- For Android, ensure google-services.json is in the project root
- Check that the bundle ID/package name matches Firebase project

### Build Issues
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version (should be v20, 22, or 24)

### Authentication Errors
- Verify Email/Password authentication is enabled in Firebase Console
- Check Firebase project settings match app configuration

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.

