export const palette = {
  deepNavy: '#0B1220',
  navySurface: '#111827',
  royalBlue: '#2563EB',
  electricBlue: '#3B82F6',
  coralRed: '#F43F5E',
  warmOrange: '#F97316',
  mintGreen: '#10B981',
  softIce: '#F8FAFC',
  cardWhite: '#FFFFFF',
  lightBlueSurface: '#EEF6FF',
  mainText: '#0F172A',
  secondaryText: '#475569',
  mutedText: '#94A3B8',
  softBorder: '#E2E8F0',
};

export const colors = {
  primary: palette.royalBlue,
  primaryDark: palette.deepNavy,
  primaryLight: palette.electricBlue,
  secondary: palette.electricBlue,
  secondaryDark: '#1D4ED8',
  accent: palette.coralRed,
  orange: palette.warmOrange,
  mint: palette.mintGreen,
  background: palette.softIce,
  surface: palette.lightBlueSurface,
  card: palette.cardWhite,
  text: palette.mainText,
  muted: palette.secondaryText,
  mutedLight: palette.mutedText,
  border: palette.softBorder,
  success: palette.mintGreen,
  warning: palette.warmOrange,
  danger: palette.coralRed,
  white: '#FFFFFF',
  black: '#000000',
};

export const typography = {
  display: 34,
  title: 26,
  subtitle: 20,
  body: 16,
  small: 13,
  tiny: 11,
  weights: {
    regular: '400' as const,
    medium: '600' as const,
    bold: '800' as const,
    heavy: '900' as const,
  },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: palette.deepNavy,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  card: {
    shadowColor: palette.deepNavy,
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  premium: {
    shadowColor: palette.deepNavy,
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
};

export const gradients = {
  premiumHero: [palette.deepNavy, '#172554', palette.royalBlue] as const,
  blue: [palette.royalBlue, palette.electricBlue] as const,
  warm: [palette.coralRed, palette.warmOrange] as const,
  mint: [palette.mintGreen, '#34D399'] as const,
  surface: [palette.softIce, palette.lightBlueSurface] as const,
};

export const animation = {
  fast: 140,
  normal: 220,
  slow: 360,
};
