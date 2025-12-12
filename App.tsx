import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
// @ts-ignore - Library has no types
import { PaystackProvider } from 'react-native-paystack-webview';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

// Paystack Test Public Key
const PAYSTACK_PUBLIC_KEY = 'pk_test_22eeaf379d48c3fac65b37d0506904d217249234';

export default function App() {
  return (
    <PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaystackProvider>
  );
}


