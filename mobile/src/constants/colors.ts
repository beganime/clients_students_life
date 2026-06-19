export const palette = {
  deepNavy: '#0B1220',
  navySurface: '#111827',
  royalBlue: '#2563EB',
  electricBlue: '#3B82F6',
  brandRed: '#D92D20',
  brandRedDark: '#7F1D1D',
  brandRedDeep: '#4C1111',
  coralRed: '#E11D48',
  warmOrange: '#F97316',
  mintGreen: '#10B981',
  softIce: '#F8FAFC',
  cardWhite: '#FFFFFF',
  softRedSurface: '#FFF5F5',
  mainText: '#0F172A',
  secondaryText: '#475569',
  mutedText: '#94A3B8',
  softBorder: '#E2E8F0',
};

export const colors = {
  primary: palette.brandRed,
  primaryDark: palette.brandRedDark,
  primaryLight: '#EF4444',
  secondary: palette.electricBlue,
  secondaryDark: '#1D4ED8',
  accent: palette.coralRed,
  orange: palette.warmOrange,
  mint: palette.mintGreen,
  background: palette.softIce,
  surface: palette.softRedSurface,
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
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
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
  premiumHero: [palette.brandRed, '#B42318', palette.brandRedDark] as const,
  blue: [palette.royalBlue, palette.electricBlue] as const,
  warm: [palette.brandRed, palette.brandRedDark] as const,
  mint: [palette.mintGreen, '#34D399'] as const,
  surface: [palette.softIce, palette.softRedSurface] as const,
};

export const animation = {
  fast: 140,
  normal: 220,
  slow: 360,
};
