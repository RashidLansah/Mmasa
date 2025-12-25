/**
 * GlassCard Component
 * 
 * iOS 16+ glassmorphism effect with native blur
 * Provides the frosted glass appearance popular in modern iOS design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../design/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number; // Blur intensity (0-100)
  tint?: 'light' | 'dark' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 80,
  tint = 'dark',
}) => {
  // On iOS, use native blur effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.glassCard, style]}
      >
        <View style={styles.content}>{children}</View>
      </BlurView>
    );
  }

  // Fallback for Android/Web - semi-transparent background
  return (
    <View style={[styles.glassCard, styles.fallback, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border for glass effect
  },
  content: {
    padding: theme.spacing.lg,
  },
  fallback: {
    // Android/Web fallback - semi-transparent with backdrop
    backgroundColor: 'rgba(11, 13, 18, 0.7)', // theme.colors.background.surface with opacity
    backdropFilter: 'blur(20px)', // Web support
  },
});

