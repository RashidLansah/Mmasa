import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';

interface WalletScreenProps {
  navigation: any;
  route?: any;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      console.log('💼 Fetching wallet data for user:', user.uid);
      
      // Fetch transactions
      const userTransactions = await FirestoreService.getUserTransactions(user.uid);
      console.log('📊 Found transactions:', userTransactions.length);
      setTransactions(userTransactions);

      // Calculate earnings and balance
      // Earnings are immediately available (10% fee already deducted at purchase)
      let totalEarnings = 0;
      let totalWithdrawals = 0;

      userTransactions.forEach(txn => {
        console.log('📝 Transaction:', {
          type: txn.type,
          amount: txn.amount,
          status: txn.status,
          description: txn.description,
        });
        
        if (txn.type === 'earning' && txn.status === 'completed') {
          totalEarnings += txn.amount; // All earnings are available (fee already deducted)
        } else if (txn.type === 'withdrawal' && txn.status === 'completed') {
          totalWithdrawals += txn.amount;
        }
      });

      // Available balance = Total earnings - Completed withdrawals
      const availableBalance = totalEarnings - totalWithdrawals;

      console.log('💰 Total Earnings:', totalEarnings);
      console.log('💸 Total Withdrawals:', totalWithdrawals);
      console.log('💵 Available Balance:', availableBalance);

      setEarnings(totalEarnings);
      setBalance(availableBalance);
    } catch (error) {
      console.error('❌ Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  // Refresh when returning from other screens (e.g., after withdrawal)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Wallet screen focused, refreshing data...');
      setLoading(true);
      fetchWalletData();
    });

    return unsubscribe;
  }, [navigation, user]);

  // Refresh if route params include refresh timestamp
  useEffect(() => {
    if (route?.params?.refresh) {
      console.log('🔄 Refresh triggered by navigation params');
      setLoading(true);
      fetchWalletData();
    }
  }, [route?.params?.refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  return (
    <AppScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>Wallet</AppText>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <AppText variant="caption" color={theme.colors.text.secondary} style={styles.balanceLabel}>
            Available Balance
          </AppText>
          <AppText variant="h1" style={styles.balanceAmount}>
            GH₵ {balance.toFixed(2)}
          </AppText>
          <AppText variant="caption" color={theme.colors.text.secondary} style={styles.earningsText}>
            Total Earnings: GH₵ {earnings.toFixed(2)} (after 10% platform fee)
          </AppText>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddAccount')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.accent.primary} />
            </View>
            <AppText variant="bodySmall" style={styles.actionText}>Add Account</AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Withdraw')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="arrow-up-circle-outline" size={24} color={theme.colors.accent.primary} />
            </View>
            <AppText variant="bodySmall" style={styles.actionText}>Withdraw</AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="receipt-outline" size={24} color={theme.colors.accent.primary} />
            </View>
            <AppText variant="bodySmall" style={styles.actionText}>History</AppText>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <AppText variant="h2" style={styles.sectionTitle}>Recent Transactions</AppText>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={theme.colors.text.secondary} />
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptyText}>
                No transactions yet
              </AppText>
            </View>
          ) : (
            transactions.slice(0, 5).map(txn => (
              <View key={txn.id} style={styles.transactionRow}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={txn.type === 'earning' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={txn.type === 'earning' ? theme.colors.status.success : theme.colors.status.error}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <AppText variant="bodySmall" style={styles.transactionTitle}>
                    {txn.description}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.text.secondary}>
                    {txn.createdAt.toLocaleDateString()}
                  </AppText>
                </View>
                <AppText
                  variant="bodySmall"
                  color={txn.type === 'earning' ? theme.colors.status.success : theme.colors.text.primary}
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
  },
  balanceCard: {
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  balanceLabel: {
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.accent.primary,
    marginVertical: theme.spacing.sm,
    textAlign: 'center',
  },
  earningsText: {
    marginTop: theme.spacing.sm,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.raised,
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
});

