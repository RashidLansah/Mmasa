import React from 'react';
import { Text, StyleSheet, TextProps, TextStyle, Platform } from 'react-native';
import { theme } from '../../design/theme';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = theme.colors.text.primary,
  style,
  children,
  ...props
}) => {
  const variantStyle = theme.typography[variant];

  return (
    <Text
      style={[
        variantStyle,
        { color },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};



