import { Platform } from 'react-native';

export const fontFamilies = {
  he: Platform.select({
    ios: 'Heebo',
    android: 'Heebo_400Regular',
    default: 'Heebo, system-ui, sans-serif',
  }),
  en: Platform.select({
    ios: 'Nunito',
    android: 'Nunito_400Regular',
    default: 'Nunito, system-ui, sans-serif',
  }),
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 26,
  '2xl': 32,
  '3xl': 40,
  '4xl': 52,
  '5xl': 64,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.3,
  normal: 1.55,
  relaxed: 1.75,
} as const;
