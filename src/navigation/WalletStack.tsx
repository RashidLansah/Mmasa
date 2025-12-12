import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletStackParamList } from './types';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { AddAccountScreen } from '../screens/wallet/AddAccountScreen';
import { WithdrawScreen } from '../screens/wallet/WithdrawScreen';
import { TransactionsScreen } from '../screens/wallet/TransactionsScreen';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export const WalletStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060A' },
      }}
    >
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
    </Stack.Navigator>
  );
};

