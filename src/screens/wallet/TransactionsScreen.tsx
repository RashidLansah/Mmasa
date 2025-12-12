import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService, Transaction } from '../../services/firestore.service';

interface TransactionsScreenProps {
  navigation: any;
}

type TransactionType = 'all' | 'earning' | 'purchase' | 'withdrawal';

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userTransactions = await FirestoreService.getUserTransactions(user.uid);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const filteredTransactions = transactions.filter(txn => 
    filter === 'all' ? true : txn.type === filter
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return 'arrow-down';
      case 'withdrawal':
        return 'arrow-up';
      case 'purchase':
        return 'cart';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'pending') return theme.colors.text.secondary;
    switch (type) {
      case 'earning':
        return theme.colors.status.success;
      case 'withdrawal':
      case 'purchase':
        return theme.colors.text.primary;
      default:
        return theme.colors.text.primary;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: theme.colors.status.success,
      pending: theme.colors.status.warning,
      failed: theme.colors.status.error,
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: colors[status] || theme.colors.text.secondary }]}>
        <AppText variant="caption" style={styles.statusText}>
          {status.toUpperCase()}
        </AppText>
      </View>
    );
  };

  const getArrivalDateText = (txn: Transaction): string | null => {
    // For pending withdrawals, show when money will arrive
    if (txn.type === 'withdrawal' && txn.status === 'pending' && txn.availableAt) {
      const now = new Date();
      const arrivalDate = txn.availableAt;
      
      if (now >= arrivalDate) {
        return 'Arriving today';
      }
      
      const diffTime = arrivalDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Arriving tomorrow';
      } else if (diffDays > 1) {
        return `Arriving in ${diffDays} days`;
      } else {
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        return `Arriving in ${diffHours} hours`;
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>Transaction History</AppText>
          <AppText variant="body" color={theme.colors.text.secondary}>
            View all your transactions
          </AppText>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'earning', 'purchase', 'withdrawal'] as TransactionType[]).map(type => (
              <View
                key={type}
                style={[
                  styles.filterTab,
                  filter === type && styles.filterTabActive,
                ]}
                onTouchEnd={() => setFilter(type)}
              >
                <AppText
                  variant="bodySmall"
                  color={filter === type ? theme.colors.accent.primary : theme.colors.text.secondary}
                  style={styles.filterText}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={theme.colors.text.secondary} />
              <AppText variant="h3" style={styles.emptyTitle}>
                No Transactions
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptyText}>
                {filter === 'all' 
                  ? 'Your transactions will appear here'
                  : `No ${filter} transactions yet`}
              </AppText>
            </View>
          ) : (
            filteredTransactions.map(txn => (
              <View key={txn.id} style={styles.transactionCard}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(txn.type, txn.status) + '20' }
                ]}>
                  <Ionicons
                    name={getTransactionIcon(txn.type)}
                    size={24}
                    color={getTransactionColor(txn.type, txn.status)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <AppText variant="bodySmall" style={styles.transactionTitle}>
                    {txn.description}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.text.secondary}>
                    {txn.createdAt.toLocaleDateString()} • {txn.createdAt.toLocaleTimeString()}
                  </AppText>
                  {txn.type === 'earning' && txn.platformFee && (
                    <AppText variant="caption" color={theme.colors.text.secondary} style={{ marginTop: 2 }}>
                      Platform fee: GH₵ {txn.platformFee.toFixed(2)} (10%)
                    </AppText>
                  )}
                  {getArrivalDateText(txn) && (
                    <View style={styles.availableDateContainer}>
                      <Ionicons name="time-outline" size={12} color={theme.colors.status.warning} />
                      <AppText variant="caption" color={theme.colors.status.warning} style={styles.availableDateText}>
                        {getArrivalDateText(txn)}
                      </AppText>
                    </View>
                  )}
                  {getStatusBadge(txn.status)}
                </View>
                <AppText
                  variant="h3"
                  color={getTransactionColor(txn.type, txn.status)}
                  style={styles.transactionAmount}
                >
                  {txn.type === 'earning' ? '+' : '-'}GH₵ {Math.abs(txn.amount).toFixed(2)}
                </AppText>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  filterTab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.background.surface,
  },
  filterTabActive: {
    backgroundColor: theme.colors.accent.primary + '20',
  },
  filterText: {
    fontWeight: '600',
  },
  transactionsList: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionAmount: {
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.pill,
    marginTop: theme.spacing.xs,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  availableDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  availableDateText: {
    fontWeight: '600',
  },
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

