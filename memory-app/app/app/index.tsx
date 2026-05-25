import React from 'react';
import { View, Text, Pressable, TextStyle, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Mascot } from '../src/components/Mascot';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { fontSize, fontWeight, spacing } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const hasOnboarded = useUserStore(s => s.hasOnboarded);

  // Animated mascot float
  const tY = useSharedValue(0);
  React.useEffect(() => {
    tY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1
    );
  }, []);
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tY.value }],
  }));

  // Logo bounce-in
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  React.useEffect(() => {
    logoScale.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
  }, []);
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  React.useEffect(() => {
    const t1 = setTimeout(() => {
      if (hasOnboarded) router.replace('/(tabs)/home');
      else router.replace('/onboarding');
    }, 2800);
    return () => clearTimeout(t1);
  }, [hasOnboarded]);

  const goNext = () => {
    if (hasOnboarded) router.replace('/(tabs)/home');
    else router.replace('/onboarding');
  };

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground variant="hero">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] }}>
          <View style={{ position: 'absolute', top: 60, right: 16 }}>
            <Pressable onPress={goNext} style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 18, paddingVertical: 8,
              borderRadius: 9999,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
            }}>
              <Text style={{ color: 'white', fontWeight: fontWeight.extrabold as TextStyle['fontWeight'], fontSize: 12 }}>
                {t('common.skip')}
              </Text>
            </Pressable>
          </View>

          <Animated.View style={mascotStyle}>
            <Mascot size={200} />
          </Animated.View>

          <Animated.Text style={[
            {
              fontSize: fontSize['4xl'],
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              color: 'white',
              marginTop: spacing[6],
              textShadowColor: 'rgba(0,0,0,0.35)',
              textShadowRadius: 24,
              textShadowOffset: { width: 0, height: 4 },
              letterSpacing: -2,
            },
            logoStyle,
          ]}>
            {t('app.name')}
          </Animated.Text>

          <Animated.Text style={[
            {
              fontSize: fontSize.md,
              color: 'rgba(255,255,255,0.95)',
              marginTop: spacing[3],
              textAlign: 'center',
              fontWeight: fontWeight.bold as TextStyle['fontWeight'],
              maxWidth: 280,
            },
            taglineStyle,
          ]}>
            {t('app.tagline')}
          </Animated.Text>
        </View>
      </AnimatedBackground>
    </View>
  );
}
