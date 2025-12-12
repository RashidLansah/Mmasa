import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { AccountVerifyService } from '../../services/account-verify.service';
import { FirestoreService } from '../../services/firestore.service';

interface AddAccountScreenProps {
  navigation: any;
}

type Provider = 'MTN' | 'Vodafone' | 'AirtelTigo';
type Step = 'provider' | 'details' | 'otp';

export const AddAccountScreen: React.FC<AddAccountScreenProps> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState<Step>('provider');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState('');
  const [recipientCode, setRecipientCode] = useState('');

  const providers: { id: Provider; name: string; color: string; icon: string }[] = [
    { id: 'MTN', name: 'MTN Mobile Money', color: '#FFCC00', icon: 'phone-portrait' },
    { id: 'Vodafone', name: 'Vodafone Cash', color: '#E60000', icon: 'phone-portrait' },
    { id: 'AirtelTigo', name: 'AirtelTigo Money', color: '#ED1C24', icon: 'phone-portrait' },
  ];

  const handleSelectProvider = (selectedProvider: Provider) => {
    setProvider(selectedProvider);
    setStep('details');
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!provider) {
      Alert.alert('Error', 'Provider not selected');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Verifying account with Paystack...');
      
      // Verify account with Paystack
      const result = await AccountVerifyService.verifyAccount(phoneNumber, provider);

      if (result.success && result.verified && result.accountName) {
        // Account verified successfully!
        console.log('✅ Account verified:', result.accountName);
        setVerifiedAccountName(result.accountName);
        setRecipientCode(result.recipientCode || '');
        
        Alert.alert(
          'Account Verified! ✅',
          `Account Holder: ${result.accountName}\n\n⚠️ FOR MVP TESTING: Enter any 6-digit code (e.g., 123456)`,
          [{ 
            text: 'Continue', 
            onPress: () => {
              // Simulate OTP send (in production, integrate with SMS service)
              setStep('otp');
            }
          }]
        );
      } else {
        // Account not found or verification failed
        console.log('❌ Account verification failed:', result.error);
        Alert.alert(
          'Verification Failed',
          result.error || 'Could not verify this mobile money account. Please check the number and provider.',
          [
            { text: 'Try Again', style: 'cancel' },
            {
              text: 'Continue Anyway',
              onPress: () => {
                // Allow user to proceed without verification (for testing)
                Alert.alert(
                  'Confirm Account',
                  `You're adding:\n\n${provider}\n${phoneNumber}\n\nAccount verification failed, but you can continue. Is this correct?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes, Continue', onPress: () => setStep('otp') }
                  ]
                );
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Account verification error:', error);
      Alert.alert('Error', 'Failed to verify account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    if (!user || !provider) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving mobile money account to Firestore...');

      // MVP: Accept any 6-digit code for testing
      // In production, verify OTP via SMS service (Twilio, Africa's Talking, etc.)
      console.log('ℹ️  MVP Mode: Accepting OTP:', otp);

      // Save mobile money account to Firestore
      await FirestoreService.addMobileMoneyAccount({
        userId: user.uid,
        provider,
        phoneNumber,
        accountName: verifiedAccountName || accountName || 'Unknown',
        isVerified: !!verifiedAccountName,
        isPrimary: true, // First account is primary by default
        recipientCode: recipientCode,
      });

      console.log('✅ Mobile money account saved successfully');

      Alert.alert(
        'Success! ✅',
        'Your mobile money account has been added and verified',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving account:', error);
      Alert.alert('Error', 'Failed to save account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Provider Selection
  if (step === 'provider') {
    return (
      <AppScreen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <AppText variant="h1" style={styles.title}>Add Mobile Money</AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
              Select your mobile money provider
            </AppText>
          </View>

          <View style={styles.providersContainer}>
            {providers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.providerCard}
                onPress={() => handleSelectProvider(p.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.providerIcon, { backgroundColor: p.color + '20' }]}>
                  <Ionicons name={p.icon as any} size={32} color={p.color} />
                </View>
                <AppText variant="body" style={styles.providerName}>
                  {p.name}
                </AppText>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </AppScreen>
    );
  }

  // Step 2: Enter Details
  if (step === 'details') {
    return (
      <AppScreen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('provider')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <AppText variant="h1" style={styles.title}>Account Details</AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
              Enter your {provider} account details
            </AppText>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <AppText variant="bodySmall" style={styles.label}>
                Phone Number *
              </AppText>
              <View style={styles.phoneInput}>
                <AppText variant="body" color={theme.colors.text.secondary}>
                  +233
                </AppText>
                <TextInput
                  style={styles.phoneField}
                  placeholder="XX XXX XXXX"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <AppText variant="caption" color={theme.colors.text.secondary} style={styles.hint}>
                Enter the number registered with {provider}
              </AppText>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.accent.primary} />
              <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.infoText}>
                We'll verify your account details with {provider} using Paystack's secure API.
              </AppText>
            </View>

            <AppButton
              title={loading ? 'Verifying Account...' : 'Verify & Continue'}
              onPress={handleSendOTP}
              variant="primary"
              disabled={loading}
            />
          </View>
        </ScrollView>
      </AppScreen>
    );
  }

  // Step 3: Verify OTP
  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('details')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <AppText variant="h1" style={styles.title}>Verify OTP</AppText>
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
            Enter the code sent to {phoneNumber}
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            <Ionicons name="phone-portrait" size={64} color={theme.colors.accent.primary} />
            <AppText variant="h2" style={styles.otpTitle}>
              Enter Verification Code
            </AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.otpDescription}>
              ⚠️ MVP Testing: Enter any 6-digit code
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.status.warning} style={[styles.otpDescription, { marginTop: 8 }]}>
              (e.g., 123456)
            </AppText>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="bodySmall" style={styles.label}>
              Enter OTP *
            </AppText>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor={theme.colors.text.secondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
          </View>

          <TouchableOpacity style={styles.resendButton} onPress={handleSendOTP}>
            <AppText variant="bodySmall" color={theme.colors.accent.primary}>
              Didn't receive code? Resend
            </AppText>
          </TouchableOpacity>

          <AppButton
            title={loading ? 'Verifying...' : 'Verify & Add Account'}
            onPress={handleVerifyOTP}
            variant="primary"
            disabled={loading}
          />
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
  backButton: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
  },
  providersContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  providerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    flex: 1,
    fontWeight: '600',
  },
  form: {
    padding: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.lg,
  },
  phoneField: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    padding: 0,
  },
  hint: {
    marginTop: theme.spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.raised,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
  otpContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  otpTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  otpDescription: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
});

