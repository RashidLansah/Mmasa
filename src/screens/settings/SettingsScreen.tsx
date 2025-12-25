import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService, MobileMoneyAccount } from '../../services/firestore.service';
import { useActionSheetService } from '../../utils/actionSheet.service';
import { showError } from '../../utils/toast.service';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [accounts, setAccounts] = useState<MobileMoneyAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const { user, userProfile, signOut } = useAuth();
  const { showActionSheet } = useActionSheetService();

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      setLoadingAccounts(true);
      const userAccounts = await FirestoreService.getUserMobileMoneyAccounts(user.uid);
      setAccounts(userAccounts.filter(acc => acc.isVerified));
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleLogout = () => {
    showActionSheet({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      options: [
        {
          label: 'Logout',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              showError('Failed to logout', 'Error');
            }
          },
          destructive: true,
        },
      ],
      cancelButtonIndex: 1, // Cancel is second option
    });
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>Settings</AppText>
        </View>

        <View style={styles.sections}>
          <Card style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>
              Account
            </AppText>
            <View style={styles.settingItem}>
              <AppText variant="bodySmall">Name</AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                {userProfile?.displayName || user?.displayName || 'Not set'}
              </AppText>
            </View>
            <View style={styles.settingItem}>
              <AppText variant="bodySmall">Email</AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                {user?.email || 'Not set'}
              </AppText>
            </View>
            <View style={styles.settingItem}>
              <AppText variant="bodySmall">Subscription</AppText>
              <AppText 
                variant="caption" 
                color={userProfile?.subscriptionStatus === 'premium' ? theme.colors.accent.primary : theme.colors.text.secondary}
              >
                {userProfile?.subscriptionStatus?.toUpperCase() || 'FREE'}
              </AppText>
            </View>
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" style={styles.sectionTitle}>
                Mobile Money Accounts
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('HomeStack', {
                    screen: 'HomeFeed',
                    params: {
                      screen: 'WalletStack',
                      params: { screen: 'AddAccount' }
                    }
                  });
                }}
              >
                <Ionicons name="add-circle" size={24} color={theme.colors.accent.primary} />
              </TouchableOpacity>
            </View>
            
            {loadingAccounts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent.primary} />
              </View>
            ) : accounts.length === 0 ? (
              <View style={styles.emptyAccountsContainer}>
                <AppText variant="caption" color={theme.colors.text.secondary}>
                  No mobile money accounts added
                </AppText>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('HomeStack', {
                      screen: 'HomeFeed',
                      params: {
                        screen: 'WalletStack',
                        params: { screen: 'AddAccount' }
                      }
                    });
                  }}
                  style={styles.addAccountButton}
                >
                  <AppText variant="caption" color={theme.colors.accent.primary}>
                    + Add Account
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              accounts.map((account, index) => (
                <View
                  key={account.id}
                  style={[
                    styles.accountItem,
                    index === 0 && styles.firstAccountItem,
                  ]}
                >
                  <View style={styles.accountIcon}>
                    <Ionicons name="phone-portrait" size={20} color={theme.colors.accent.primary} />
                  </View>
                  <View style={styles.accountDetails}>
                    <View style={styles.accountRow}>
                      <AppText variant="bodySmall" style={styles.accountProvider}>
                        {account.provider}
                      </AppText>
                      {account.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <AppText variant="caption" style={styles.primaryText}>
                            PRIMARY
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppText variant="caption" color={theme.colors.text.secondary}>
                      {account.phoneNumber}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.text.secondary}>
                      {account.accountName}
                    </AppText>
                  </View>
                  {account.isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.status.success}
                    />
                  )}
                </View>
              ))
            )}
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>
              Subscription
            </AppText>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('ManageSubscription')}
            >
              <AppText variant="bodySmall">Manage Subscription</AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                →
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('PaymentMethods')}
            >
              <AppText variant="bodySmall">Payment Methods</AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                →
              </AppText>
            </TouchableOpacity>
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>
              Appearance
            </AppText>
            <View style={styles.settingItem}>
              <AppText variant="bodySmall">Dark Mode</AppText>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{
                  false: theme.colors.border.subtle,
                  true: theme.colors.accent.primary,
                }}
                thumbColor={theme.colors.background.primary}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>
              Legal
            </AppText>
            <TouchableOpacity style={styles.settingItem}>
              <AppText variant="bodySmall">Terms of Service</AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                →
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <AppText variant="bodySmall">Privacy Policy</AppText>
              <AppText variant="caption" color={theme.colors.text.secondary}>
                →
              </AppText>
            </TouchableOpacity>
          </Card>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <AppText variant="bodySmall" style={styles.logoutText}>
              Logout
            </AppText>
          </TouchableOpacity>
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
    ...theme.typography.display,
  },
  sections: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  logoutButton: {
    backgroundColor: theme.colors.status.error,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  logoutText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  firstAccountItem: {
    borderTopWidth: 0,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  accountProvider: {
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  primaryBadge: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.pill,
  },
  primaryText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyAccountsContainer: {
    paddingVertical: theme.spacing.md,
  },
  addAccountButton: {
    marginTop: theme.spacing.sm,
  },
});



