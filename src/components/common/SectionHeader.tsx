import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../../design/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="h3">{title}</AppText>
      {actionLabel && (
        <TouchableOpacity onPress={onActionPress}>
          <AppText variant="bodySmall" color={theme.colors.accent.secondary}>
            {actionLabel}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
});



