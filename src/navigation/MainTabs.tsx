import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { MySlipsStack } from './MySlipsStack';
import { WalletStack } from './WalletStack';
import { LeaderboardStack } from './LeaderboardStack';
import { theme } from '../design/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  // iOS glassmorphism tab bar
  const tabBarStyle = Platform.OS === 'ios' 
    ? {
        position: 'absolute' as const,
        borderTopWidth: 0,
        paddingBottom: 12,
        paddingTop: 12,
        height: 70,
        elevation: 0,
        shadowOpacity: 0,
        backgroundColor: 'transparent',
      }
    : {
        backgroundColor: theme.colors.background.surface,
        borderTopWidth: 0,
        paddingBottom: 12,
        paddingTop: 12,
        height: 70,
        elevation: 0,
        shadowOpacity: 0,
      };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarShowLabel: false,
        tabBarBackground: Platform.OS === 'ios' 
          ? () => (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            )
          : undefined,
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="MySlipsStack"
        component={MySlipsStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "document-text" : "document-text-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="WalletStack"
        component={WalletStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "wallet" : "wallet-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="LeaderboardStack"
        component={LeaderboardStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "trophy" : "trophy-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

