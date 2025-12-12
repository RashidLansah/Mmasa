import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../design/theme';

interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  style,
  edges = ['top', 'bottom'],
}) => {
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, style]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});

