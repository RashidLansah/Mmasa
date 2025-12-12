import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../../design/theme';

interface StatPillProps {
  label: string;
  value: string | number;
}

export const StatPill: React.FC<StatPillProps> = ({ label, value }) => {
  return (
    <View style={styles.container}>
      <AppText variant="caption" color={theme.colors.text.secondary}>
        {label}
      </AppText>
      <AppText variant="h3" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.raised,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    marginTop: theme.spacing.xs,
    color: theme.colors.accent.primary,
  },
});



