import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { theme } from '../../design/theme';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  isPassword,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="bodySmall" style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.text.secondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <AppText variant="caption" color={theme.colors.status.error} style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.background.primary,
  },
  inputContainerError: {
    borderColor: theme.colors.status.error,
  },
  input: {
    flex: 1,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  eyeIcon: {
    padding: theme.spacing.md,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
});

