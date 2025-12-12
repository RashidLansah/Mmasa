/**
 * Update Results Screen (Manual + Auto API Verification)
 * 
 * Allows:
 * - Manual result updates by creators
 * - Automatic verification via API-Football
 * - Support for multiple bet types (h2h, totals, spreads, etc.)
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { theme } from '../../design/theme';
import { ResultsUpdater } from '../../services/results-updater.service';
import { AutoVerify } from '../../services/auto-verify.service';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface UpdateResultsScreenProps {
  navigation: any;
}

export const UpdateResultsScreen: React.FC<UpdateResultsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [pendingSlips, setPendingSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingSlipId, setUpdatingSlipId] = useState<string | null>(null);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [verificationSummary, setVerificationSummary] = useState({ totalPending: 0, verifiable: 0, alreadyVerified: 0 });

  useEffect(() => {
    fetchPendingSlips();
  }, []);

  const fetchPendingSlips = async () => {
    try {
      setLoading(true);
      const [slips, summary] = await Promise.all([
        ResultsUpdater.getPendingSlips(),
        AutoVerify.getVerificationSummary()
      ]);
      
      // Filter to only show user's own slips
      const userSlips = slips.filter(slip => slip.creatorId === user?.uid);
      
      // Sort by match date (oldest first)
      userSlips.sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime());
      
      setPendingSlips(userSlips);
      setVerificationSummary(summary);
    } catch (error) {
      console.error('Error fetching pending slips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingSlips();
    setRefreshing(false);
  };

  const handleAutoVerifyAll = async () => {
    Alert.alert(
      'Auto-Verify Results',
      'This will automatically verify all eligible slips using API-Football. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify All',
          onPress: async () => {
            setAutoVerifying(true);
            try {
              const results = await AutoVerify.verifyCreatorSlips(user?.uid || '');
              
              const successCount = results.filter(r => r.verified).length;
              const wonCount = results.filter(r => r.status === 'won').length;
              const lostCount = results.filter(r => r.status === 'lost').length;
              
              Alert.alert(
                'Verification Complete',
                `✅ Verified: ${successCount} slips\n🎉 Won: ${wonCount}\n❌ Lost: ${lostCount}`,
                [{ text: 'OK', onPress: () => fetchPendingSlips() }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to auto-verify slips');
            } finally {
              setAutoVerifying(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateResult = async (slipId: string, homeScore: number, awayScore: number) => {
    try {
      setUpdatingSlipId(slipId);
      
      await ResultsUpdater.updateSlipResult(slipId, homeScore, awayScore);
      
      Alert.alert('Success', 'Slip result updated!');
      
      // Remove from list
      setPendingSlips(prev => prev.filter(s => s.id !== slipId));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update result');
    } finally {
      setUpdatingSlipId(null);
    }
  };

  const renderSlip = ({ item }: { item: any }) => {
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const isUpdating = updatingSlipId === item.id;
    const isPastMatch = item.matchDate < new Date();

    return (
      <Card style={styles.slipCard}>
        <View style={styles.slipHeader}>
          <View>
            <AppText variant="caption" color={theme.colors.accent.primary}>
              {item.league}
            </AppText>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              {item.matchDate.toLocaleDateString()} {item.matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </AppText>
          </View>
          {!isPastMatch && (
            <AppText variant="caption" color={theme.colors.status.warning}>
              Match not started yet
            </AppText>
          )}
        </View>

        <View style={styles.matchInfo}>
          <AppText variant="h3">{item.homeTeam}</AppText>
          <AppText variant="body" color={theme.colors.text.secondary}>vs</AppText>
          <AppText variant="h3">{item.awayTeam}</AppText>
        </View>

        <View style={styles.predictionRow}>
          <View>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              Your Prediction
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.accent.primary}>
              {item.prediction === 'home' ? item.homeTeam :
               item.prediction === 'away' ? item.awayTeam :
               'Draw'}
            </AppText>
          </View>
          <View>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              Odds
            </AppText>
            <AppText variant="bodySmall">{item.odds?.toFixed(2) || '0.00'}</AppText>
          </View>
        </View>

        <View style={styles.scoreInputRow}>
          <AppText variant="bodySmall" style={styles.scoreLabel}>Enter Final Score:</AppText>
          <View style={styles.scoreInputs}>
            <View style={styles.scoreInput}>
              <AppText variant="caption" color={theme.colors.text.secondary}>{item.homeTeam}</AppText>
              <TextInput
                style={styles.input}
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
            <AppText variant="h3" color={theme.colors.text.secondary}>-</AppText>
            <View style={styles.scoreInput}>
              <AppText variant="caption" color={theme.colors.text.secondary}>{item.awayTeam}</AppText>
              <TextInput
                style={styles.input}
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <AppButton
          title={isUpdating ? 'Updating...' : 'Update Result'}
          onPress={() => {
            const home = parseInt(homeScore);
            const away = parseInt(awayScore);
            
            if (isNaN(home) || isNaN(away)) {
              Alert.alert('Error', 'Please enter valid scores');
              return;
            }
            
            handleUpdateResult(item.id, home, away);
          }}
          variant="primary"
          disabled={isUpdating || !homeScore || !awayScore}
          style={styles.updateButton}
        />
      </Card>
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.loadingText}>
            Loading your pending slips...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="h1">Update Results</AppText>
        <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
          Update match results manually or auto-verify with API
        </AppText>

        {/* Auto-Verify Button */}
        {verificationSummary.verifiable > 0 && (
          <TouchableOpacity
            style={styles.autoVerifyButton}
            onPress={handleAutoVerifyAll}
            disabled={autoVerifying}
          >
            <Ionicons 
              name="flash" 
              size={20} 
              color={theme.colors.accent.primary}
            />
            <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.autoVerifyText}>
              {autoVerifying ? 'Verifying...' : `Auto-Verify ${verificationSummary.verifiable} Slips`}
            </AppText>
          </TouchableOpacity>
        )}

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <AppText variant="caption" color={theme.colors.text.secondary}>Pending</AppText>
            <AppText variant="h3">{verificationSummary.totalPending}</AppText>
          </View>
          <View style={styles.statItem}>
            <AppText variant="caption" color={theme.colors.text.secondary}>Verified</AppText>
            <AppText variant="h3" color={theme.colors.status.success}>{verificationSummary.alreadyVerified}</AppText>
          </View>
          <View style={styles.statItem}>
            <AppText variant="caption" color={theme.colors.text.secondary}>Ready</AppText>
            <AppText variant="h3" color={theme.colors.accent.primary}>{verificationSummary.verifiable}</AppText>
          </View>
        </View>
      </View>

      <FlatList
        data={pendingSlips}
        renderItem={renderSlip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppText variant="h3" color={theme.colors.text.secondary}>
              No Pending Slips
            </AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptySubtext}>
              All your slips have been updated!
            </AppText>
          </View>
        }
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
  },
  autoVerifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.accent.primary}20`,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  autoVerifyText: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  statItem: {
    alignItems: 'center',
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  slipCard: {
    marginBottom: theme.spacing.md,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  matchInfo: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    marginVertical: theme.spacing.md,
  },
  scoreInputRow: {
    marginTop: theme.spacing.md,
  },
  scoreLabel: {
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: theme.spacing.md,
  },
  scoreInput: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    minWidth: 60,
  },
  updateButton: {
    marginTop: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl * 2,
  },
  emptySubtext: {
    marginTop: theme.spacing.sm,
  },
});

