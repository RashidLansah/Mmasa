import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from './types';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ManageSubscriptionScreen } from '../screens/settings/ManageSubscriptionScreen';
import { PaymentMethodsScreen } from '../screens/settings/PaymentMethodsScreen';
import { UpdateResultsScreen } from '../screens/settings/UpdateResultsScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060A' },
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="UpdateResults" component={UpdateResultsScreen} />
    </Stack.Navigator>
  );
};



