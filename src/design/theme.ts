import { Platform } from 'react-native';

export const colors = {
  // Backgrounds
  background: {
    primary: '#05060A',
    surface: '#0B0D12',
    raised: '#151823',
  },
  // Accents
  accent: {
    primary: '#18FF6D',
    secondary: '#39C8FF',
  },
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A7AEC2',
  },
  // Borders
  border: {
    subtle: '#222633',
  },
  // Status
  status: {
    warning: '#FFC857',
    success: '#18FF6D',
    error: '#FF4D4F',
  },
  // Misc
  muted: '#1D2230',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  pill: 999,
  card: 16,
  button: 24,
};

// iOS System Font (San Francisco) - falls back to system default
const getFontFamily = () => {
  if (typeof Platform !== 'undefined' && Platform.OS === 'ios') {
    return 'System'; // Uses San Francisco on iOS
  }
  return undefined; // Uses system default on Android/Web
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
    fontFamily: getFontFamily(),
  },
  h1: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    fontFamily: getFontFamily(),
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontFamily: getFontFamily(),
  },
  h3: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
    fontFamily: getFontFamily(),
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: getFontFamily(),
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: getFontFamily(),
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: getFontFamily(),
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};



