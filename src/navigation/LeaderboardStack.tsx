import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeaderboardStackParamList } from './types';
import { LeaderboardScreen } from '../screens/leaderboard/LeaderboardScreen';
import { CreatorProfileScreen } from '../screens/home/CreatorProfileScreen';
import { SlipDetailsScreen } from '../screens/home/SlipDetailsScreen';
import { SubscriptionScreen } from '../screens/home/SubscriptionScreen';

const Stack = createNativeStackNavigator<LeaderboardStackParamList>();

export const LeaderboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060A' },
      }}
    >
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <Stack.Screen name="SlipDetails" component={SlipDetailsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
};



