import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MySlipsStackParamList } from './types';
import { MySlipsScreen } from '../screens/myslips/MySlipsScreen';
import { SlipDetailsScreen } from '../screens/home/SlipDetailsScreen';
import { SlipUploadScreenV2 } from '../screens/home/SlipUploadScreenV2';

const Stack = createNativeStackNavigator<MySlipsStackParamList>();

export const MySlipsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05060A' },
      }}
    >
      <Stack.Screen name="MySlips" component={MySlipsScreen} />
      <Stack.Screen name="SlipDetails" component={SlipDetailsScreen} />
      <Stack.Screen name="SlipUpload" component={SlipUploadScreenV2} />
    </Stack.Navigator>
  );
};

