import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
// @ts-ignore - Library has no types
import { PaystackProvider } from 'react-native-paystack-webview';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import Toast from 'react-native-toast-message';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

// Paystack Public Key
// SECURITY: Use environment variables in production
// For Expo, use app.json extra config or expo-constants
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_22eeaf379d48c3fac65b37d0506904d217249234'; // ⚠️ TODO: Move to .env

export default function App() {
  return (
    <ActionSheetProvider>
      <PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
            <Toast />
          </NavigationContainer>
        </AuthProvider>
      </PaystackProvider>
    </ActionSheetProvider>
  );
}


