import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle, ActivityIndicator, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows, spacing, fontSize, fontWeight } from '../theme';

type Variant = 'primary' | 'secondary' | 'success' | 'error' | 'accent' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const VARIANT_GRADIENTS: Record<Exclude<Variant, 'ghost' | 'outline'>, readonly string[]> = {
  primary: gradients.primary,
  secondary: gradients.secondary,
  success: gradients.success,
  error: gradients.red,
  accent: gradients.accent,
};

const VARIANT_SHADOW_COLORS: Record<Variant, string> = {
  primary: colors.primaryDarker,
  secondary: colors.secondaryDarker,
  success: colors.successDarker,
  error: colors.errorDarker,
  accent: colors.accentDark,
  ghost: colors.border,
  outline: colors.borderStrong,
};

const VARIANT_TEXT_COLORS: Record<Variant, string> = {
  primary: colors.textInverse,
  secondary: '#78350F',
  success: colors.textInverse,
  error: colors.textInverse,
  accent: colors.textInverse,
  ghost: colors.textSecondary,
  outline: colors.primary,
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  loading = false,
  style,
}) => {
  const [pressed, setPressed] = React.useState(false);
  const sizePad: { v: number; h: number; font: number; rad: number } =
    size === 'lg' ? { v: 18, h: 32, font: fontSize.md, rad: radius.xl } :
    size === 'sm' ? { v: 8, h: 16, font: fontSize.sm, rad: radius.md } :
    { v: 16, h: 24, font: fontSize.base, rad: radius.lg };

  const shadowColor = VARIANT_SHADOW_COLORS[variant];
  const textColor = VARIANT_TEXT_COLORS[variant];

  const baseStyle: ViewStyle = {
    borderRadius: sizePad.rad,
    width: block ? '100%' : undefined,
    overflow: 'hidden',
    opacity: disabled ? 0.45 : 1,
  };

  const shadowStyle: ViewStyle = {
    backgroundColor: shadowColor,
    borderRadius: sizePad.rad,
    paddingBottom: pressed ? 3 : 6,
    width: block ? '100%' : undefined,
    alignSelf: block ? 'stretch' : 'flex-start',
  };

  const content = (
    <View
      style={{
        paddingVertical: sizePad.v,
        paddingHorizontal: sizePad.h,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing[2],
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontSize: sizePad.font,
            fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
      )}
    </View>
  );

  const inner = variant === 'ghost' ? (
    <View style={{ backgroundColor: 'transparent' }}>{content}</View>
  ) : variant === 'outline' ? (
    <View style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.borderStrong, borderRadius: sizePad.rad }}>{content}</View>
  ) : (
    <LinearGradient
      colors={VARIANT_GRADIENTS[variant] as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: sizePad.rad }}
    >
      {content}
    </LinearGradient>
  );

  return (
    <View style={[shadowStyle, style]}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={baseStyle}
      >
        {inner}
      </Pressable>
    </View>
  );
};

export default Button;
