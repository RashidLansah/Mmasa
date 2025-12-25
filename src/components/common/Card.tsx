import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../design/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glass?: boolean; // Enable glassmorphism effect (iOS 16+ style)
  intensity?: number; // Blur intensity (0-100, default: 60)
  tint?: 'light' | 'dark' | 'default';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  glass = false,
  intensity = 60,
  tint = 'dark',
}) => {
  // Use glassmorphism on iOS when enabled
  if (glass && Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.card, styles.glassCard, style]}
      >
        <View style={styles.content}>{children}</View>
      </BlurView>
    );
  }

  // Standard card (or fallback for Android/Web)
  return (
    <View style={[styles.card, glass && styles.glassFallback, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  glassCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border for glass effect
  },
  glassFallback: {
    // Android/Web fallback - semi-transparent
    backgroundColor: 'rgba(11, 13, 18, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    // Content wrapper for glass cards
  },
});

