import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { AppTextInput } from '../../components/common/AppTextInput';
import { theme } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';

interface PhoneLoginScreenProps {
  navigation: any;
}

export const PhoneLoginScreen: React.FC<PhoneLoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <AppScreen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <AppText variant="display" style={styles.title}>
            Mmasa
          </AppText>
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
            Sign in to your account
          </AppText>

          <View style={styles.inputsContainer}>
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              textContentType="password"
              autoComplete="password"
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.forgotPasswordText}>
                Forgot Password?
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <AppButton
            title={loading ? 'Signing In...' : 'Sign In'}
            onPress={handleLogin}
            disabled={!email || !password || loading}
          />
          
          <View style={styles.signupContainer}>
            <AppText variant="body" color={theme.colors.text.secondary}>
              Don't have an account?{' '}
            </AppText>
            <TouchableOpacity onPress={handleSignUp}>
              <AppText variant="body" color={theme.colors.accent.primary} style={styles.signupLink}>
                Sign Up
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  forgotPasswordText: {
    fontWeight: '600',
  },
  footer: {
    marginTop: theme.spacing.xxl,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  signupLink: {
    fontWeight: '600',
  },
});
