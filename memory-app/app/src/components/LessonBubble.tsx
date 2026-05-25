import React from 'react';
import { Pressable, View, Text, TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows, fontSize, fontWeight } from '../theme';
import { LessonStatus } from '../stores/progressStore';

interface Props {
  status: LessonStatus | 'current';
  emoji: string;
  badge?: string;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const LessonBubble: React.FC<Props> = ({
  status,
  emoji,
  badge,
  size = 84,
  onPress,
  style,
}) => {
  const [pressed, setPressed] = React.useState(false);

  const gradient =
    status === 'completed' ? gradients.success :
    status === 'current' ? gradients.secondary :
    status === 'unlocked' ? gradients.primary :
    null;

  const shadowColor =
    status === 'completed' ? colors.successDarker :
    status === 'current' ? colors.secondaryDarker :
    status === 'unlocked' ? colors.primaryDarker :
    colors.lockedShadow;

  const inner = (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: 'white',
      overflow: 'hidden',
    }}>
      {gradient ? (
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: size * 0.42, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 4 }}>
            {status === 'completed' ? '⭐' : status === 'locked' ? '🔒' : emoji}
          </Text>
        </LinearGradient>
      ) : (
        <View style={{
          width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.locked,
        }}>
          <Text style={{ fontSize: size * 0.42, opacity: 0.6 }}>🔒</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[{
      backgroundColor: shadowColor,
      borderRadius: size / 2,
      paddingBottom: pressed && status !== 'locked' ? 3 : 8,
    }, style]}>
      <Pressable
        disabled={status === 'locked' || !onPress}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        {inner}
      </Pressable>
      {badge && status === 'current' && (
        <View style={{
          position: 'absolute',
          top: -10,
          right: -16,
          backgroundColor: colors.secondary,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
          borderWidth: 3,
          borderColor: 'white',
        }}>
          <Text style={{
            color: '#78350F',
            fontSize: fontSize.xs,
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
          }}>{badge}</Text>
        </View>
      )}
    </View>
  );
};

export default LessonBubble;
