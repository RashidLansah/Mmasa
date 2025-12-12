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

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
  },
  h1: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};



