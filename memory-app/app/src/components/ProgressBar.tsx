import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '../theme';

interface Props {
  value: number;       // 0..1
  variant?: 'success' | 'primary' | 'streak';
  height?: number;
  style?: ViewStyle;
}

const VARIANT: Record<NonNullable<Props['variant']>, readonly string[]> = {
  success: gradients.success,
  primary: gradients.primary,
  streak: gradients.streak,
};

export const ProgressBar: React.FC<Props> = ({ value, variant = 'success', height = 14, style }) => {
  const pct = Math.min(1, Math.max(0, value));
  return (
    <View style={[{
      width: '100%',
      height,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.full,
      overflow: 'hidden',
    }, style]}>
      <LinearGradient
        colors={VARIANT[variant] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: radius.full,
        }}
      />
    </View>
  );
};

export default ProgressBar;
