import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows, fontSize, fontWeight } from '../theme';

type ChipVariant = 'streak' | 'xp' | 'heart';

const VARIANT: Record<ChipVariant, {
  gradient: readonly string[];
  textColor: string;
  shadowColor: string;
  icon: string;
}> = {
  streak: { gradient: gradients.streak, textColor: '#fff', shadowColor: colors.streakDarker, icon: '🔥' },
  xp: { gradient: gradients.secondary, textColor: '#78350F', shadowColor: colors.secondaryDarker, icon: '⚡' },
  heart: { gradient: gradients.red, textColor: '#fff', shadowColor: colors.errorDarker, icon: '❤' },
};

interface Props {
  variant: ChipVariant;
  value: number | string;
  style?: ViewStyle;
}

export const Chip: React.FC<Props> = ({ variant, value, style }) => {
  const v = VARIANT[variant];
  return (
    <View
      style={[{
        shadowColor: v.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
        borderRadius: radius.full,
      }, style]}
    >
      <LinearGradient
        colors={v.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: radius.full,
        }}
      >
        <Text style={{ fontSize: 16 }}>{v.icon}</Text>
        <Text style={{
          color: v.textColor,
          fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
          fontSize: fontSize.sm,
          textShadowColor: 'rgba(0,0,0,0.18)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}>{value}</Text>
      </LinearGradient>
    </View>
  );
};

export default Chip;
