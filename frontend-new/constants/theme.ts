export const Colors = {
  light: {
    primary: '#FF006E',
    primaryForeground: '#FFFFFF',
    secondary: '#7C3AED',
    secondaryForeground: '#FFFFFF',
    accent: '#00D4FF',
    accentForeground: '#1C1D24',
    background: '#FFFFFF',
    foreground: '#1C1D24',
    card: '#FFFFFF',
    cardForeground: '#1C1D24',
    muted: '#E8E8EC',
    mutedForeground: '#64666E',
    border: '#E8E8EC',
    input: '#E8E8EC',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
  },
  dark: {
    primary: '#FF006E',
    primaryForeground: '#FFFFFF',
    secondary: '#8B5CF6',
    secondaryForeground: '#1C1D24',
    accent: '#00D4FF',
    accentForeground: '#1C1D24',
    background: '#1C1D24',
    foreground: '#FAFAFA',
    card: '#2A2B33',
    cardForeground: '#FAFAFA',
    muted: '#3A3B44',
    mutedForeground: '#9CA0AB',
    border: '#35363F',
    input: '#35363F',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export type ColorScheme = Record<keyof typeof Colors.light, string>;

export const getColors = (isDark: boolean): ColorScheme =>
  isDark ? Colors.dark : Colors.light;
