import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// SECURITY: In production, use environment variables or app.json
// For Expo, you can use app.json or expo-constants
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCoh832PXv3T1hLclcZZOppCdDgSyki_P4", // ⚠️ TODO: Move to .env
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "sureodds-8f685.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "sureodds-8f685",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "sureodds-8f685.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1029849188268",
  appId: process.env.FIREBASE_APP_ID || "1:1029849188268:ios:f0337a9a001efebbebdc09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
// Note: For proper persistence in React Native, use @react-native-firebase/auth
// The JS SDK warning can be safely ignored - auth state persists via secure storage
export const firebaseAuth = getAuth(app);

export const firebaseFirestore = getFirestore(app);
export const firebaseStorage = getStorage(app);
export { app as firebaseApp };

// Collections
export const Collections = {
  USERS: 'users',
  SLIPS: 'slips',
  CREATORS: 'creators',
  SUBSCRIPTIONS: 'subscriptions',
  NOTIFICATIONS: 'notifications',
  TRANSACTIONS: 'transactions',
  MOBILE_MONEY_ACCOUNTS: 'mobileMoneyAccounts',
};

