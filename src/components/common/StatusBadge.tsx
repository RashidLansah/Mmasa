import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../../design/theme';

interface StatusBadgeProps {
  status: 'pending' | 'active' | 'expired' | 'won' | 'lost' | 'WON' | 'LOST' | 'ACTIVE' | 'EXPIRED';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case 'WON':
        return theme.colors.status.success;
      case 'LOST':
        return theme.colors.status.error;
      case 'EXPIRED':
        return theme.colors.status.error;
      case 'ACTIVE':
      case 'PENDING':
        return theme.colors.status.warning;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getDisplayText = () => {
    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === 'PENDING') return 'ACTIVE';
    return normalizedStatus;
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
      <AppText variant="caption" style={styles.text}>
        {getDisplayText()}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.pill,
  },
  text: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
});



