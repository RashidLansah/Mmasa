import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';

export const ManageSubscriptionScreen: React.FC = () => {
  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="h1">Manage Subscription</AppText>
      </View>
      <Card style={styles.content}>
        <AppText variant="body" color={theme.colors.text.secondary}>
          Subscription management will be implemented here.
        </AppText>
      </Card>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  content: {
    margin: theme.spacing.lg,
  },
});



