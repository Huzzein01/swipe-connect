export const Colors = {
  light: {
    primary: '#1D4ED8',            // Deep professional blue
    primaryForeground: '#FFFFFF',
    secondary: '#7C3AED',          // Purple — secondary actions
    secondaryForeground: '#FFFFFF',
    accent: '#0EA5E9',             // Sky blue — networking / highlights
    accentForeground: '#FFFFFF',
    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#E2E8F0',
    mutedForeground: '#64748B',
    border: '#E2E8F0',
    input: '#E2E8F0',
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    success: '#059669',
    warning: '#D97706',
  },
  dark: {
    primary: '#3B82F6',            // Lighter blue for dark backgrounds
    primaryForeground: '#FFFFFF',
    secondary: '#8B5CF6',
    secondaryForeground: '#FFFFFF',
    accent: '#38BDF8',             // Lighter sky blue on dark
    accentForeground: '#0C1A2E',
    background: '#0F172A',
    foreground: '#F1F5F9',
    card: '#1E293B',
    cardForeground: '#F1F5F9',
    muted: '#334155',
    mutedForeground: '#94A3B8',
    border: '#334155',
    input: '#334155',
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
