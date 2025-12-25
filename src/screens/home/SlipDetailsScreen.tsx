import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { showToast, showError, showSuccess } from '../../utils/toast.service';
import { useActionSheetService } from '../../utils/actionSheet.service';

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
  const [deleting, setDeleting] = useState(false);
  const { popup } = usePaystack();
  const { showActionSheet } = useActionSheetService();

  useEffect(() => {
    // Set up real-time listener for slip updates
    const unsubscribe = FirestoreService.subscribeToSlip(slipId, (slipData) => {
      if (slipData) {
        setSlip(slipData);
      } else {
        // Slip was deleted
        setSlip(null);
      }
      setLoading(false);
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [slipId]);
  
  const handlePurchase = async () => {
    if (!user || !userProfile || !slip) return;
    
    // SERVER-SIDE VERIFICATION: Call backend to verify slip is still purchasable
    // This prevents race conditions where slip expires between client check and payment
    try {
      const SERVER_URL = __DEV__ ? 'http://192.168.1.152:3001' : 'https://your-production-server.com';
      const verifyResponse = await fetch(`${SERVER_URL}/api/verify-slip-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slipId: slip.id })
      });
      
      const verifyResult = await verifyResponse.json();
      
      if (!verifyResult.success || !verifyResult.purchasable) {
        showError(
          verifyResult.message || 'This slip cannot be purchased at this time.',
          verifyResult.code === 'SLIP_EXPIRED' ? 'Slip Expired' : 'Purchase Failed'
        );
        return;
      }
    } catch (error) {
      console.error('Error verifying slip purchase:', error);
      // Continue with purchase if verification fails (graceful degradation)
      // Server will still block it if expired when processing payment
    }

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
      // NOTE: purchaseSlip now includes expiry check - will throw if expired
      try {
        await FirestoreService.purchaseSlip(slip.id, user.uid);
      } catch (error: any) {
        // Handle expiry error specifically
        if (error.message && error.message.includes('SLIP_EXPIRED')) {
          showError(
            'This slip has expired and can no longer be purchased. Your payment will be refunded.',
            'Purchase Failed'
          );
          setPurchasing(false);
          return;
        }
        throw error; // Re-throw other errors
      }

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

      // Update creator stats (ROI will be recalculated)
      try {
        await FirestoreService.updateCreatorStats(slip.creatorId);
        console.log('✅ Creator stats updated after purchase');
      } catch (error) {
        console.error('⚠️ Failed to update creator stats:', error);
        // Don't fail the purchase if stats update fails
      }

      // Refresh slip data
      const updatedSlip = await FirestoreService.getSlip(slip.id);
      setSlip(updatedSlip);

      showSuccess('You can now view the full slip details', 'Purchase Successful! 🎉');
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      showError('Failed to complete purchase. Please contact support.', 'Error');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePaymentCancel = () => {
    console.log('⚠️  Payment cancelled by user');
    showToast('Payment cancelled', 'Payment Cancelled');
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ Payment error:', error);
    showError('An error occurred during payment. Please try again.', 'Payment Failed');
  };

  /**
   * Handle slip deletion (only for creator)
   */
  const handleDeleteSlip = () => {
    if (!slip || !user) return;

    showActionSheet({
      title: 'Delete Slip',
      message: 'Are you sure you want to delete this slip? This action cannot be undone.',
      options: [
        {
          label: 'Delete',
          onPress: async () => {
            setDeleting(true);
            try {
              await FirestoreService.deleteSlip(slip.id, user.uid);
              showSuccess('Slip has been deleted successfully', 'Deleted');
              // Navigate back after a short delay
              setTimeout(() => {
                navigation.goBack();
              }, 1500);
            } catch (error: any) {
              console.error('Error deleting slip:', error);
              showError(error.message || 'Failed to delete slip', 'Error');
            } finally {
              setDeleting(false);
            }
          },
          destructive: true,
        },
      ],
      cancelButtonIndex: 1, // Cancel is second option (after Delete)
    });
  };


  const hasAccess = !slip?.isPremium || slip?.creatorId === user?.uid || slip?.purchasedBy?.includes(user?.uid || '');
  const isCreator = slip?.creatorId === user?.uid;

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
              {slip.extractionStatus === 'extracting' || !slip.odds ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
                  <AppText variant="h2" style={[styles.oddsText, { color: theme.colors.text.secondary }]}>
                    —
                  </AppText>
                </View>
              ) : (
                <>
                  <AppText variant="h2" style={styles.oddsText}>{slip.odds.toFixed(2)}</AppText>
                  <AppText variant="caption" color={theme.colors.text.secondary} style={{ fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>
                    *Odds may change when loaded on {slip.platform || 'the betting platform'}
                  </AppText>
                </>
              )}
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
            <Card glass intensity={70} style={styles.premiumCard}>
              <View style={styles.premiumHeader}>
                <Ionicons name="lock-closed" size={48} color={theme.colors.accent.primary} />
                <AppText variant="h2" style={styles.premiumTitle}>
                  Premium Slip
                </AppText>
              </View>

              {false ? (
                <View style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm }}>
                    <Ionicons name="time-outline" size={24} color={theme.colors.status.error} />
                    <AppText variant="body" color={theme.colors.status.error} style={{ fontWeight: '600' }}>
                      This slip has expired
                    </AppText>
                  </View>
                  <AppText variant="bodySmall" color={theme.colors.text.secondary} style={{ textAlign: 'center' }}>
                    Slips expire 15 minutes before the first match kickoff and can no longer be purchased.
                  </AppText>
                </View>
              ) : (
                <>
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
                </>
              )}
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

          {/* Matches List - Show if available */}
          {hasAccess && (
            <>
              {/* New format: Multiple matches from matches array */}
              {slip.matches && slip.matches.length > 0 && (
                <Card style={styles.matchesCard}>
                  <AppText variant="h3" style={styles.matchesTitle}>
                    Selections ({slip.matches.length})
                  </AppText>
                  {slip.matches.map((match, index) => {
                    // Format prediction display
                    const predictionLabel = match.prediction === 'home' ? 'Home' : 
                                          match.prediction === 'away' ? 'Away' : 
                                          match.prediction === 'draw' ? 'Draw' :
                                          match.prediction.charAt(0).toUpperCase() + match.prediction.slice(1);
                    
                    // Format market/bet type (e.g., 'h2h' -> '1X2', 'totals' -> 'Over/Under')
                    const marketLabel = match.market === 'h2h' ? '1X2' :
                                      match.market === 'totals' ? 'Over/Under' :
                                      match.market === 'btts' ? 'BTTS' :
                                      match.market === 'spreads' ? 'Handicap' :
                                      match.market === 'double_chance' ? 'Double Chance' :
                                      match.market.toUpperCase();
                    
                    return (
                      <View key={index} style={styles.matchCard}>
                        {index > 0 && <View style={styles.matchDivider} />}
                        <View style={styles.matchContent}>
                          <View style={styles.matchLeft}>
                            <View style={styles.predictionRow}>
                              <Ionicons name="football" size={16} color={theme.colors.text.primary} />
                              <AppText variant="bodySmall" style={styles.predictionLabel}>
                                {predictionLabel}
                              </AppText>
                            </View>
                            <AppText variant="bodySmall" style={styles.matchTeams}>
                              {match.homeTeam} vs {match.awayTeam}
                            </AppText>
                            <AppText variant="caption" color={theme.colors.text.secondary} style={styles.marketLabel}>
                              {marketLabel}
                            </AppText>
                          </View>
                          {match.odds ? (
                            <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.matchOdds}>
                              {match.odds.toFixed(2)}
                            </AppText>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="time-outline" size={12} color={theme.colors.text.secondary} />
                              <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.matchOdds}>
                                —
                              </AppText>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </Card>
              )}
              
              {/* Old format: Single match from homeTeam/awayTeam (backward compatibility) */}
              {(!slip.matches || slip.matches.length === 0) && slip.homeTeam && slip.awayTeam && (
                <Card style={styles.matchesCard}>
                  <AppText variant="h3" style={styles.matchesTitle}>
                    Bet Details
                  </AppText>
                  <View style={styles.matchCard}>
                    <View style={styles.matchHeader}>
                      <AppText variant="bodySmall" style={styles.matchTeams}>
                        {slip.homeTeam} vs {slip.awayTeam}
                      </AppText>
                      {slip.odds && (
                        <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.matchOdds}>
                          {slip.odds.toFixed(2)}
                        </AppText>
                      )}
                    </View>
                    {slip.prediction && (
                      <View style={styles.matchPrediction}>
                        <AppText variant="caption" color={theme.colors.text.secondary}>
                          Prediction:
                        </AppText>
                        <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.predictionText}>
                          {slip.prediction === 'home' ? slip.homeTeam : 
                           slip.prediction === 'away' ? slip.awayTeam : 
                           'Draw'}
                        </AppText>
                      </View>
                    )}
                  </View>
                </Card>
              )}
            </>
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

          {/* Stats - Show only match date and total odds */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                Total Odds
              </AppText>
              <View>
                <AppText variant="bodySmall" style={styles.statValue}>
                  {slip.extractionStatus === 'extracting' || !slip.odds ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color={theme.colors.text.secondary} />
                      <AppText variant="caption" color={theme.colors.text.secondary}>—</AppText>
                    </View>
                  ) : (
                    slip.odds.toFixed(2)
                  )}
                </AppText>
                {slip.odds && (
                  <AppText variant="caption" color={theme.colors.text.secondary} style={{ fontSize: 9, marginTop: 2, fontStyle: 'italic' }}>
                    *May change when loaded
                  </AppText>
                )}
              </View>
              {slip.odds && (
                <AppText variant="caption" color={theme.colors.text.secondary} style={{ fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>
                  *Odds may change when loaded
                </AppText>
              )}
            </View>
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
          
          {/* Expiration notice - only show if expiresAt is set and valid */}
          {slip.expiresAt && (() => {
            const expiresAt = new Date(slip.expiresAt);
            const now = new Date();
            const isValidDate = !isNaN(expiresAt.getTime());
            
            if (!isValidDate) {
              return null; // Invalid date, don't show anything
            }
            
            if (expiresAt > now) {
              // Not expired yet
              return (
                <View style={styles.expirationNotice}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.status.warning} />
                  <AppText variant="caption" color={theme.colors.status.warning}>
                    Expires {expiresAt.toLocaleString()}
                  </AppText>
                </View>
              );
            } else {
              // Expired
              return (
                <View style={styles.expiredNotice}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.status.error} />
                  <AppText variant="caption" color={theme.colors.status.error}>
                    This slip has expired
                  </AppText>
                </View>
              );
            }
          })()}
        </Card>

        {/* Action buttons - Delete for creator, Purchase for others */}
        {isCreator && (
          <View style={styles.actionsContainer}>
            <AppButton
              title={deleting ? 'Deleting...' : 'Delete Slip'}
              onPress={handleDeleteSlip}
              variant="secondary"
              disabled={deleting}
              style={[styles.actionButton, styles.deleteButton]}
            />
          </View>
        )}

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
  matchesCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  matchesTitle: {
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  matchCard: {
    marginBottom: 0,
  },
  matchDivider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: theme.spacing.md,
  },
  matchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  predictionLabel: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  matchTeams: {
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  marketLabel: {
    fontSize: 11,
  },
  matchOdds: {
    fontWeight: '600',
    fontSize: 16,
    minWidth: 50,
    textAlign: 'right',
  },
  actionsContainer: {
    padding: theme.spacing.lg,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  deleteButton: {
    backgroundColor: theme.colors.status.error,
    borderColor: theme.colors.status.error,
  },
  expirationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: `${theme.colors.status.warning}20`,
    borderRadius: theme.borderRadius.card,
  },
  expiredCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    backgroundColor: `${theme.colors.status.error}10`,
    borderWidth: 2,
    borderColor: theme.colors.status.error,
  },
  expiredCardContent: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  expiredCardTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.status.error,
  },
  expiredCardText: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  expiredCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    backgroundColor: `${theme.colors.status.error}10`,
    borderWidth: 2,
    borderColor: theme.colors.status.error,
  },
  expiredCardContent: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  expiredCardTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.status.error,
  },
  expiredCardText: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  expiredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: `${theme.colors.status.error}20`,
    borderRadius: theme.borderRadius.card,
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


