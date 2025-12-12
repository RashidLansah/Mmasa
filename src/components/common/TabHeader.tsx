import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../../design/theme';

interface Tab {
  id: string;
  label: string;
}

interface TabHeaderProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive ? styles.activeTab : null]}
            onPress={() => onTabChange(tab.id)}
          >
            <AppText
              variant="bodySmall"
              color={isActive ? theme.colors.accent.primary : theme.colors.text.secondary}
              style={isActive ? styles.activeText : undefined}
            >
              {tab.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.accent.primary,
  },
  activeText: {
    fontWeight: '600',
  },
});

