import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeFeedScreen } from '../screens/home/HomeFeedScreen';
import { CreatorProfileScreen } from '../screens/home/CreatorProfileScreen';
import { SlipDetailsScreen } from '../screens/home/SlipDetailsScreen';
import { SlipUploadScreenV2 } from '../screens/home/SlipUploadScreenV2';
import { SubscriptionScreen } from '../screens/home/SubscriptionScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ManageSubscriptionScreen } from '../screens/settings/ManageSubscriptionScreen';
import { PaymentMethodsScreen } from '../screens/settings/PaymentMethodsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060A' },
      }}
    >
      <Stack.Screen name="HomeFeed" component={HomeFeedScreen} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <Stack.Screen name="SlipDetails" component={SlipDetailsScreen} />
      <Stack.Screen name="SlipUpload" component={SlipUploadScreenV2} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
};



