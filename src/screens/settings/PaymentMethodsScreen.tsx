import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';

export const PaymentMethodsScreen: React.FC = () => {
  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="h1">Payment Methods</AppText>
      </View>
      <Card style={styles.content}>
        <AppText variant="body" color={theme.colors.text.secondary}>
          Payment methods management will be implemented here.
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



