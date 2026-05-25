import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { gradients } from '../theme';

type Variant = 'default' | 'hero' | 'success';

interface Props {
  children?: React.ReactNode;
  variant?: Variant;
}

const Blob = ({
  size, color, top, left, delay = 0, duration = 8000,
}: {
  size: number; color: string;
  top?: number; left?: number;
  delay?: number; duration?: number;
}) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    tx.value = withDelay(delay, withRepeat(
      withTiming(40, { duration, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    ty.value = withDelay(delay, withRepeat(
      withTiming(-30, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    scale.value = withDelay(delay, withRepeat(
      withTiming(1.15, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top, left,
          opacity: 0.55,
        },
        animatedStyle,
      ]}
    />
  );
};

const Sparkle = ({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    scale.value = withDelay(delay, withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.Text style={[{
      position: 'absolute',
      top: y, left: x,
      fontSize: size,
    }, style]}>✨</Animated.Text>
  );
};

export const AnimatedBackground: React.FC<Props> = ({ children, variant = 'default' }) => {
  const { width, height } = Dimensions.get('window');

  const gradient: readonly string[] =
    variant === 'hero' ? ['#1E1B4B', '#312E81', '#5B21B6', '#831843'] :
    variant === 'success' ? gradients.bgComplete :
    ['#EEF2FF', '#FAE8FF', '#FFF7ED'];

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blurred animated blobs (via overlapping radial-like ellipses) */}
      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
        <Blob size={280} color="#A78BFA" top={-60} left={-60} delay={0} duration={9000} />
        <Blob size={240} color="#F9A8D4" top={height * 0.35} left={width - 100} delay={1000} duration={10000} />
        <Blob size={220} color="#FCD34D" top={height * 0.62} left={-80} delay={2000} duration={11000} />
        <Blob size={180} color="#67E8F9" top={height * 0.15} left={width * 0.6} delay={500} duration={8000} />
      </View>

      {/* Top overlay glass effect */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(255,255,255,0.18)' },
        ]}
        pointerEvents="none"
      />

      {/* Sparkles */}
      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
        <Sparkle x={width * 0.12} y={height * 0.08} size={16} delay={0} />
        <Sparkle x={width * 0.85} y={height * 0.12} size={14} delay={400} />
        <Sparkle x={width * 0.18} y={height * 0.42} size={12} delay={800} />
        <Sparkle x={width * 0.78} y={height * 0.5} size={18} delay={1200} />
        <Sparkle x={width * 0.5} y={height * 0.7} size={14} delay={1600} />
        <Sparkle x={width * 0.08} y={height * 0.78} size={16} delay={2000} />
      </View>

      {children}
    </View>
  );
};

export default AnimatedBackground;
