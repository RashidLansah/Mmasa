import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { AppText } from './AppText';
import { theme } from '../../design/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) => {
  const buttonStyle = 
    variant === 'primary' ? styles.primary : 
    variant === 'secondary' ? styles.secondary : 
    styles.ghost;
  const textColor = 
    variant === 'primary' ? theme.colors.background.primary :
    variant === 'secondary' ? theme.colors.text.primary :
    theme.colors.accent.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        (disabled || loading) ? styles.disabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText variant="body" style={[styles.text, { color: textColor }]}>
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: theme.colors.accent.primary,
  },
  secondary: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});

