import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsStackParamList } from './types';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { SlipDetailsScreen } from '../screens/home/SlipDetailsScreen';
import { CreatorProfileScreen } from '../screens/home/CreatorProfileScreen';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060A' },
      }}
    >
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SlipDetails" component={SlipDetailsScreen} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
    </Stack.Navigator>
  );
};



