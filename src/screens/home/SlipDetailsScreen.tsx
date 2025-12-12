import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore - Library has no types  
import { usePaystack } from 'react-native-paystack-webview';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { theme } from '../../design/theme';
import { FirestoreService, Slip } from '../../services/firestore.service';
import { DeepLink} from '../../services/deeplink.service';
import { useAuth } from '../../contexts/AuthContext';
import { Paystack as PaystackService } from '../../services/paystack.service';

interface SlipDetailsScreenProps {
  navigation: any;
  route: { params: { slipId: string } };
}

export const SlipDetailsScreen: React.FC<SlipDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { slipId } = route.params;
  const { user, userProfile } = useAuth();
  const [slip, setSlip] = useState<Slip | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { popup } = usePaystack();

  useEffect(() => {
    const fetchSlipDetails = async () => {
      try {
        const slipData = await FirestoreService.getSlip(slipId);
        setSlip(slipData);
      } catch (error) {
        console.error('Error fetching slip:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlipDetails();
  }, [slipId]);

  const handlePurchase = () => {
    if (!user || !userProfile || !slip) return;

    // Trigger Paystack payment popup
    popup.checkout({
      email: userProfile.email,
      amount: PaystackService.toKobo(slip.price || 0),
      reference: PaystackService.generateReference(user.uid, slip.id),
      metadata: {
        userId: user.uid,
        slipId: slip.id,
        slipTitle: slip.title,
        type: 'slip_purchase',
      },
      onSuccess: handlePaymentSuccess,
      onCancel: handlePaymentCancel,
      onError: handlePaymentError,
    });
  };

  const handlePaymentSuccess = async (response: any) => {
    if (!user || !slip) return;

    console.log('✅ Payment successful:', response);
    
    setPurchasing(true);
    try {
      const reference = response.transactionRef?.reference || response.reference;
      
      // Verify payment (in production, do this server-side)
      console.log('🔍 Verifying payment:', reference);
      
      // Add user to purchasedBy array
      await FirestoreService.purchaseSlip(slip.id, user.uid);

      // Calculate platform fee (10%) and creator earnings (90%)
      const purchaseAmount = slip.price || 0;
      const platformFee = purchaseAmount * 0.10; // 10% platform fee
      const creatorEarning = purchaseAmount * 0.90; // 90% to creator
      
      console.log('💰 Processing earnings:', {
        purchaseAmount,
        platformFee,
        creatorEarning,
      });

      // Create earnings transaction for creator (90% - immediately available)
      const earningTxnId = await FirestoreService.createTransaction({
        userId: slip.creatorId,
        type: 'earning',
        amount: creatorEarning,
        status: 'completed',
        description: `Earnings from slip: ${slip.title}`,
        slipId: slip.id,
        reference,
        platformFee, // Track the fee (10% already deducted)
      });
      console.log('✅ Creator earning transaction created:', earningTxnId);

      // Create platform fee transaction (optional: track platform revenue)
      const platformTxnId = await FirestoreService.createTransaction({
        userId: 'platform', // Platform account
        type: 'platform_fee',
        amount: platformFee,
        status: 'completed',
        description: `Platform fee from slip: ${slip.title}`,
        slipId: slip.id,
        reference,
      });
      console.log('✅ Platform fee transaction created:', platformTxnId);

      // Create purchase transaction for buyer
      await FirestoreService.createTransaction({
        userId: user.uid,
        type: 'purchase',
        amount: -(slip.price || 0),
        status: 'completed',
        description: `Purchased slip: ${slip.title}`,
        slipId: slip.id,
        reference,
      });

      // Refresh slip data
      const updatedSlip = await FirestoreService.getSlip(slip.id);
      setSlip(updatedSlip);

      Alert.alert(
        'Purchase Successful! 🎉',
        'You can now view the full slip details',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please contact support.');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePaymentCancel = () => {
    console.log('⚠️  Payment cancelled by user');
    Alert.alert('Payment Cancelled', 'You cancelled the payment');
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ Payment error:', error);
    Alert.alert('Payment Failed', 'An error occurred during payment. Please try again.');
  };

  const hasAccess = !slip?.isPremium || slip?.creatorId === user?.uid || slip?.purchasedBy?.includes(user?.uid || '');

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.loadingText}>
            Loading slip details...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (!slip) {
    return (
      <AppScreen>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.text.secondary} />
          <AppText variant="h3" style={styles.emptyTitle}>
            Slip Not Found
          </AppText>
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.creatorHeader}
            onPress={() => navigation.navigate('CreatorProfile', { creatorId: slip.creatorId })}
          >
            <Image source={{ uri: slip.creatorAvatar }} style={styles.avatar} />
            <View style={styles.creatorInfo}>
              <AppText variant="bodySmall" style={styles.creatorName}>
                {slip.creatorName}
              </AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                {slip.sport} • {slip.league}
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        <Card style={styles.summaryCard}>
          <AppText variant="h2" style={styles.slipTitle}>
            {slip.title}
          </AppText>
          
          <View style={styles.summaryRow}>
            <StatusBadge status={slip.status} />
            <View style={styles.oddsContainer}>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                Odds
              </AppText>
              <AppText variant="h2" style={styles.oddsText}>{slip.odds?.toFixed(2) || '0.00'}</AppText>
            </View>
          </View>

          {/* Booking Code & Platform - Only show if user has access */}
          {hasAccess && slip.bookingCode && (
            <Card style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View>
                  <AppText variant="caption" color={theme.colors.text.secondary}>
                    Booking Code
                  </AppText>
                  <AppText variant="h3" color={theme.colors.accent.primary}>
                    {slip.bookingCode}
                  </AppText>
                </View>
                {slip.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.status.success} />
                    <AppText variant="caption" color={theme.colors.status.success}>
                      Verified
                    </AppText>
                  </View>
                )}
              </View>
              
              {slip.platform && (
                <AppText variant="caption" color={theme.colors.text.secondary} style={styles.platformText}>
                  Platform: {slip.platform}
                </AppText>
              )}
              
              <AppButton
                title={`Load Slip on ${slip.platform || 'Betting Platform'}`}
                onPress={() => {
                  if (slip.platform && slip.bookingCode && slip.platform !== 'Other') {
                    DeepLink.openSlipInPlatform(slip.platform, slip.bookingCode);
                  }
                }}
                variant="primary"
                style={styles.loadButton}
              />
            </Card>
          )}
          
          {/* Locked booking code indicator for premium slips */}
          {slip.isPremium && !hasAccess && slip.bookingCode && (
            <Card style={styles.bookingCard}>
              <View style={styles.lockedBooking}>
                <Ionicons name="lock-closed" size={24} color={theme.colors.text.secondary} />
                <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                  <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                    Booking Code Hidden
                  </AppText>
                  <AppText variant="caption" color={theme.colors.text.secondary}>
                    Unlock to view the booking code
                  </AppText>
                </View>
              </View>
            </Card>
          )}

          {/* Premium Paywall - Show if user doesn't have access */}
          {slip.isPremium && !hasAccess && (
            <Card style={styles.premiumCard}>
              <View style={styles.premiumHeader}>
                <Ionicons name="lock-closed" size={48} color={theme.colors.accent.primary} />
                <AppText variant="h2" style={styles.premiumTitle}>
                  Premium Slip
                </AppText>
              </View>
              
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.premiumDescription}>
                Unlock this premium slip to view the full screenshot, betting details, and expert analysis.
              </AppText>
              
              <View style={styles.priceContainer}>
                <AppText variant="h1" color={theme.colors.accent.primary}>
                  GH₵ {slip.price?.toFixed(2)}
                </AppText>
              </View>
              
              <AppButton
                title={purchasing ? "Processing..." : "Unlock Premium Slip"}
                onPress={handlePurchase}
                variant="primary"
                disabled={purchasing}
                style={{ width: '100%' }}
              />
              
              <View style={styles.securePayment}>
                <Ionicons name="shield-checkmark" size={16} color={theme.colors.status.success} />
                <AppText variant="caption" color={theme.colors.text.secondary} style={styles.secureText}>
                  Secure payment via Paystack
                </AppText>
              </View>
            </Card>
          )}

          {/* Screenshot - Only show if user has access */}
          {hasAccess && slip.imageUrl && (
            <Card style={styles.screenshotCard}>
              <AppText variant="h3" style={styles.sectionTitle}>
                Slip Screenshot
              </AppText>
              <Image source={{ uri: slip.imageUrl }} style={styles.screenshot} />
            </Card>
          )}

          {/* Description - Always visible for basic info */}
          <View style={styles.detailsSection}>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.description}>
              {slip.description}
            </AppText>
          </View>
          
          {/* Show blurred preview for locked premium slips */}
          {slip.isPremium && !hasAccess && (
            <View style={styles.lockedNotice}>
              <Ionicons name="information-circle" size={20} color={theme.colors.text.secondary} />
              <AppText variant="caption" color={theme.colors.text.secondary} style={{ marginLeft: 8 }}>
                Full details available after purchase
              </AppText>
            </View>
          )}

          {/* Stats - Hide stake/potential win for locked premium slips */}
          <View style={styles.statsRow}>
            {hasAccess && slip.stake && (
              <View style={styles.statItem}>
                <AppText variant="caption" color={theme.colors.text.secondary}>
                  Stake
                </AppText>
                <AppText variant="bodySmall" style={styles.statValue}>
                  GH₵{slip.stake}
                </AppText>
              </View>
            )}
            {hasAccess && slip.potentialWin && (
              <View style={styles.statItem}>
                <AppText variant="caption" color={theme.colors.text.secondary}>
                  Potential Win
                </AppText>
                <AppText variant="bodySmall" style={styles.winValue}>
                  GH₵{slip.potentialWin}
                </AppText>
              </View>
            )}
            <View style={styles.statItem}>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                Match Date
              </AppText>
              <AppText variant="bodySmall" style={styles.statValue}>
                {new Date(slip.matchDate).toLocaleDateString()}
              </AppText>
            </View>
            {slip.isPremium && !hasAccess && (
              <View style={styles.statItem}>
                <Ionicons name="lock-closed" size={16} color={theme.colors.text.secondary} />
                <AppText variant="caption" color={theme.colors.text.secondary}>
                  Locked
                </AppText>
              </View>
            )}
          </View>

          <AppText variant="caption" color={theme.colors.text.secondary} style={styles.date}>
            Published {new Date(slip.createdAt).toLocaleDateString()}
          </AppText>
        </Card>

      </ScrollView>

    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryCard: {
    margin: theme.spacing.lg,
  },
  slipTitle: {
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  oddsContainer: {
    alignItems: 'flex-end',
  },
  oddsText: {
    color: theme.colors.accent.primary,
    fontWeight: '700',
  },
  detailsSection: {
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  description: {
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
    marginTop: 4,
  },
  winValue: {
    fontWeight: '600',
    color: theme.colors.status.success,
    marginTop: 4,
  },
  date: {
    marginTop: theme.spacing.md,
  },
  actionsContainer: {
    padding: theme.spacing.lg,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    paddingHorizontal: theme.spacing.xxl,
  },
  bookingCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.background.raised,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
  },
  platformText: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  loadButton: {
    marginTop: theme.spacing.sm,
  },
  screenshotCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  screenshot: {
    width: '100%',
    height: 400,
    borderRadius: theme.borderRadius.card,
    resizeMode: 'contain',
    backgroundColor: theme.colors.background.surface,
  },
  premiumCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.raised,
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  premiumTitle: {
    marginTop: theme.spacing.sm,
    fontWeight: '700',
  },
  premiumDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  priceContainer: {
    marginBottom: theme.spacing.lg,
  },
  securePayment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  secureText: {
    marginLeft: 4,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background.raised,
    borderRadius: theme.borderRadius.card,
  },
  lockedBooking: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
  },
});


