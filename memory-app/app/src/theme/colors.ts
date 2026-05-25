export const colors = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryDarker: '#5B21B6',
  primaryLight: '#A78BFA',
  primaryLighter: '#C4B5FD',

  secondary: '#FBBF24',
  secondaryDark: '#F59E0B',
  secondaryDarker: '#D97706',
  secondaryLight: '#FCD34D',
  secondaryLighter: '#FEF3C7',

  accent: '#EC4899',
  accentDark: '#DB2777',
  accentLight: '#F9A8D4',

  success: '#10B981',
  successDark: '#059669',
  successDarker: '#047857',
  successLight: '#34D399',
  successBg: '#D1FAE5',

  error: '#EF4444',
  errorDark: '#DC2626',
  errorDarker: '#B91C1C',
  errorBg: '#FEE2E2',

  streak: '#F97316',
  streakDark: '#EA580C',
  streakDarker: '#C2410C',

  info: '#3B82F6',
  infoDark: '#2563EB',

  bg: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F4',
  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',

  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  textInverse: '#FFFFFF',

  locked: '#D6D3D1',
  lockedShadow: '#A8A29E',
} as const;

export const gradients = {
  primary: ['#A78BFA', '#7C3AED', '#5B21B6'] as const,
  primarySoft: ['#C4B5FD', '#A78BFA'] as const,
  secondary: ['#FCD34D', '#F59E0B'] as const,
  success: ['#34D399', '#10B981', '#047857'] as const,
  streak: ['#FB923C', '#F97316', '#C2410C'] as const,
  accent: ['#F9A8D4', '#EC4899'] as const,
  sunrise: ['#FBBF24', '#EC4899', '#7C3AED'] as const,
  aurora: ['#C4B5FD', '#F9A8D4', '#FCD34D', '#A7F3D0'] as const,
  twilight: ['#6366F1', '#8B5CF6', '#EC4899'] as const,
  bgScreen: ['#F5F3FF', '#FAE8FF', '#FFF7ED'] as const,
  bgComplete: ['#10B981', '#059669', '#047857'] as const,
  bgHero: ['#A78BFA', '#7C3AED', '#5B21B6'] as const,
  red: ['#FCA5A5', '#EF4444'] as const,
};

export type ColorName = keyof typeof colors;
export type GradientName = keyof typeof gradients;
