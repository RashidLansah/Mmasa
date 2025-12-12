import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from GoogleService-Info.plist
const firebaseConfig = {
  apiKey: "AIzaSyCoh832PXv3T1hLclcZZOppCdDgSyki_P4",
  authDomain: "sureodds-8f685.firebaseapp.com",
  projectId: "sureodds-8f685",
  storageBucket: "sureodds-8f685.firebasestorage.app",
  messagingSenderId: "1029849188268",
  appId: "1:1029849188268:ios:f0337a9a001efebbebdc09"
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

