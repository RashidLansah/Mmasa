import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService, MobileMoneyAccount } from '../../services/firestore.service';
import { TransferService } from '../../services/transfer.service';

interface WithdrawScreenProps {
  navigation: any;
}

export const WithdrawScreen: React.FC<WithdrawScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<MobileMoneyAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<MobileMoneyAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch mobile money accounts
      const userAccounts = await FirestoreService.getUserMobileMoneyAccounts(user.uid);
      const verifiedAccounts = userAccounts.filter(acc => acc.isVerified);
      setAccounts(verifiedAccounts);
      
      // Set primary account as default
      const primaryAccount = verifiedAccounts.find(acc => acc.isPrimary);
      if (primaryAccount) {
        setSelectedAccount(primaryAccount);
      }

      // Calculate available balance (all earnings available - fee already deducted)
      const transactions = await FirestoreService.getUserTransactions(user.uid);
      let totalEarnings = 0;
      let totalWithdrawals = 0;

      transactions.forEach(txn => {
        if (txn.type === 'earning' && txn.status === 'completed') {
          totalEarnings += txn.amount; // All earnings available (10% fee already deducted)
        } else if (txn.type === 'withdrawal' && txn.status === 'completed') {
          totalWithdrawals += txn.amount;
        }
      });

      const availableBalance = totalEarnings - totalWithdrawals;
      setBalance(availableBalance);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !selectedAccount) return;

    const withdrawAmount = parseFloat(amount);

    // Validation
    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (withdrawAmount > balance) {
      Alert.alert('Insufficient Balance', `You only have GH₵ ${balance.toFixed(2)} available`);
      return;
    }

    if (withdrawAmount < 1) {
      Alert.alert('Minimum Withdrawal', 'Minimum withdrawal amount is GH₵ 1.00');
      return;
    }

    // Confirm withdrawal
    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw GH₵ ${withdrawAmount.toFixed(2)} to ${selectedAccount.provider} (${selectedAccount.phoneNumber})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              console.log('💸 Processing withdrawal:', {
                amount: withdrawAmount,
                account: selectedAccount.phoneNumber,
                provider: selectedAccount.provider,
                recipientCode: selectedAccount.recipientCode,
              });

              // Check if account has recipient code (required for transfer)
              if (!selectedAccount.recipientCode) {
                Alert.alert(
                  'Account Not Verified',
                  'This account needs to be verified before withdrawals. Please add it again and complete verification.',
                  [{ text: 'OK' }]
                );
                setSubmitting(false);
                return;
              }

              // Generate unique reference
              const reference = `WTH_${user.uid}_${Date.now()}`;

              // Calculate arrival date (5 days from now)
              const arrivalDate = new Date();
              arrivalDate.setDate(arrivalDate.getDate() + 5);
              const arrivalDateStr = arrivalDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });

              // Step 1: Create withdrawal transaction with status 'pending'
              // Balance will NOT reduce yet (only counts 'completed' withdrawals)
              // Money will arrive in 5 days
              const txnId = await FirestoreService.createTransaction({
                userId: user.uid,
                type: 'withdrawal',
                amount: withdrawAmount,
                status: 'pending', // Pending for 5 days
                description: `Withdrawal to ${selectedAccount.provider} ${selectedAccount.phoneNumber}`,
                reference,
                availableAt: arrivalDate, // When money will arrive
              });

              console.log('📝 Withdrawal transaction created (pending):', txnId);
              console.log('📅 Money will arrive on:', arrivalDateStr);

              // Show confirmation with arrival date
              Alert.alert(
                'Withdrawal Requested! ✅',
                `Your withdrawal of GH₵ ${withdrawAmount.toFixed(2)} has been submitted.\n\n💰 Money will arrive in your ${selectedAccount.provider} account (${selectedAccount.phoneNumber}) on:\n\n📅 ${arrivalDateStr}\n\n(5 business days processing time)`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back and refresh wallet screen
                      // Balance still shows (withdrawal is 'pending', not 'completed')
                      navigation.navigate('Wallet', { refresh: Date.now() });
                    },
                  },
                ]
              );

              // Note: In production, you would schedule a job to process this after 5 days
              // For now, withdrawals remain 'pending' until manually processed
              // You can create a backend cron job or use Firebase Cloud Functions
              // to automatically process pending withdrawals after 5 days
            } catch (error) {
              console.error('❌ Withdrawal error:', error);
              Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.loadingText}>
            Loading...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h1" style={styles.title}>Withdraw</AppText>
            <AppText variant="body" color={theme.colors.text.secondary}>
              Transfer your earnings to mobile money
            </AppText>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              Available Balance
            </AppText>
            <AppText variant="h1" style={styles.balanceAmount}>
              GH₵ {balance.toFixed(2)}
            </AppText>
          </View>

          {/* No Accounts State */}
          {accounts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={64} color={theme.colors.text.secondary} />
              <AppText variant="h3" style={styles.emptyTitle}>
                No Mobile Money Account
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptyText}>
                Add a verified mobile money account to withdraw your earnings
              </AppText>
              <AppButton
                title="Add Account"
                onPress={() => navigation.navigate('AddAccount')}
                variant="primary"
              />
            </View>
          )}

          {/* Withdrawal Form */}
          {accounts.length > 0 && (
            <View style={styles.form}>
              {/* Account Selection */}
              <View style={styles.section}>
                <AppText variant="h3" style={styles.sectionTitle}>
                  Withdrawal Account
                </AppText>
                {accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountCard,
                      selectedAccount?.id === account.id && styles.accountCardSelected,
                    ]}
                    onPress={() => setSelectedAccount(account)}
                  >
                    <View style={styles.accountIcon}>
                      <Ionicons
                        name="phone-portrait"
                        size={24}
                        color={theme.colors.accent.primary}
                      />
                    </View>
                    <View style={styles.accountInfo}>
                      <AppText variant="bodySmall" style={styles.accountProvider}>
                        {account.provider}
                      </AppText>
                      <AppText variant="caption" color={theme.colors.text.secondary}>
                        {account.phoneNumber} • {account.accountName}
                      </AppText>
                    </View>
                    {selectedAccount?.id === account.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <View style={styles.section}>
                <AppText variant="h3" style={styles.sectionTitle}>
                  Amount
                </AppText>
                <View style={styles.amountContainer}>
                  <AppText variant="h2" style={styles.currencySymbol}>
                    GH₵
                  </AppText>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.secondary}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  {[10, 50, 100, balance].map((quickAmount, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickAmountButton}
                      onPress={() => setAmount(quickAmount.toFixed(2))}
                    >
                      <AppText variant="caption" color={theme.colors.accent.primary}>
                        {index === 3 ? 'All' : `GH₵ ${quickAmount}`}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={theme.colors.accent.primary} />
                <AppText variant="caption" color={theme.colors.text.secondary} style={styles.infoText}>
                  ⚠️ MVP Testing: Withdrawals are instant. In production, they'll be processed via Paystack Transfer API within 24 hours. Minimum: GH₵ 1.00
                </AppText>
              </View>

              {/* Submit Button */}
              <AppButton
                title={submitting ? 'Processing...' : 'Withdraw Funds'}
                onPress={handleWithdraw}
                variant="primary"
                disabled={!selectedAccount || !amount || submitting || balance <= 0}
                style={styles.submitButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  balanceCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  form: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountCardSelected: {
    borderColor: theme.colors.accent.primary,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountProvider: {
    fontWeight: '600',
    marginBottom: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  currencySymbol: {
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: theme.spacing.md,
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
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
});

