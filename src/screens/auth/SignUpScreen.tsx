import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { AppTextInput } from '../../components/common/AppTextInput';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpScreenProps {
  navigation: any;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    // Validation
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      Alert.alert('Success', 'Account created successfully!');
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <AppScreen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <AppText variant="h1" style={styles.title}>
              Create Account
            </AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
              Sign up to get started
            </AppText>

            <View style={styles.inputsContainer}>
              <AppTextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                returnKeyType="next"
                textContentType="name"
                autoComplete="name"
              />

              <AppTextInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                textContentType="emailAddress"
                autoComplete="email"
              />

              <AppTextInput
                label="Password"
                placeholder="Min 6 characters"
                value={password}
                onChangeText={setPassword}
                isPassword
                returnKeyType="next"
              />

              <AppTextInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <AppButton
              title={loading ? 'Creating Account...' : 'Sign Up'}
              onPress={handleSignUp}
              disabled={!displayName || !email || !password || !confirmPassword || loading}
            />
            
            <View style={styles.loginContainer}>
              <AppText variant="body" color={theme.colors.text.secondary}>
                Already have an account?{' '}
              </AppText>
              <TouchableOpacity onPress={handleBackToLogin}>
                <AppText variant="body" color={theme.colors.accent.primary} style={styles.loginLink}>
                  Sign In
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  inputsContainer: {
    marginTop: theme.spacing.xl,
  },
  footer: {
    marginTop: theme.spacing.xxl,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  loginLink: {
    fontWeight: '600',
  },
});

