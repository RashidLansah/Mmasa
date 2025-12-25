import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';

interface SubscriptionScreenProps {
  navigation: any;
  route: { params?: { creatorId?: string } };
}

const plans = [
  {
    id: 'daily',
    name: 'Daily Access',
    price: 5,
    description: "Access all today's slips",
    features: ['All premium slips today', 'Real-time updates', '24-hour access'],
  },
  {
    id: 'weekly',
    name: 'Weekly Access',
    price: 20,
    description: 'Best value for active bettors',
    features: ['All premium slips this week', 'Priority notifications', '7-day access'],
    popular: true,
  },
  {
    id: 'monthly',
    name: 'Monthly Access',
    price: 60,
    description: 'For serious followers',
    features: ['All premium slips this month', 'Exclusive content', '30-day access'],
  },
];

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  navigation,
  route,
}) => {
  const handleSelectPlan = (planId: string) => {
    // Mock payment confirmation
    console.log('Selected plan:', planId);
    // In real app, would show payment modal or navigate to payment screen
    navigation.goBack();
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="h1">Unlock Premium Predictions</AppText>
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
            Choose a subscription plan to access premium betting slips
          </AppText>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              glass={plan.popular} // Glass effect for popular plan
              intensity={plan.popular ? 80 : 60}
              style={plan.popular ? [styles.planCard, styles.popularCard] : styles.planCard}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <AppText variant="caption" style={styles.popularText}>
                    MOST POPULAR
                  </AppText>
                </View>
              )}
              <AppText variant="h2" style={styles.planName}>
                {plan.name}
              </AppText>
              <View style={styles.priceContainer}>
                <AppText variant="display" style={styles.price}>
                  GHS {plan.price}
                </AppText>
              </View>
              <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.description}>
                {plan.description}
              </AppText>
              <View style={styles.features}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <AppText variant="caption" style={styles.checkmark}>
                      ✓
                    </AppText>
                    <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.featureText}>
                      {feature}
                    </AppText>
                  </View>
                ))}
              </View>
              <AppButton
                title="Choose"
                onPress={() => handleSelectPlan(plan.id)}
                variant={plan.popular ? 'primary' : 'ghost'}
                style={styles.chooseButton}
              />
            </Card>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  plansContainer: {
    padding: theme.spacing.lg,
  },
  planCard: {
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.pill,
  },
  popularText: {
    color: theme.colors.background.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  planName: {
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    marginBottom: theme.spacing.sm,
  },
  price: {
    color: theme.colors.accent.primary,
  },
  description: {
    marginBottom: theme.spacing.lg,
  },
  features: {
    marginBottom: theme.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  checkmark: {
    color: theme.colors.accent.primary,
    marginRight: theme.spacing.sm,
    fontSize: 16,
  },
  featureText: {
    flex: 1,
  },
  chooseButton: {
    width: '100%',
  },
});

