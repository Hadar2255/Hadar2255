import React from 'react';
import { View, Text, Pressable, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mascot } from '../src/components/Mascot';
import MobileFrame from '../src/components/MobileFrame';
import { colors, fontSize, fontWeight, spacing } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const hasOnboarded = useUserStore(s => s.hasOnboarded);

  React.useEffect(() => {
    const t1 = setTimeout(() => {
      if (hasOnboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    }, 2500);
    return () => clearTimeout(t1);
  }, [hasOnboarded]);

  const goNext = () => {
    if (hasOnboarded) router.replace('/(tabs)/home');
    else router.replace('/onboarding');
  };

  return (
    <MobileFrame bg="transparent">
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] }}
      >
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

        <Mascot size={200} />

        <Text style={{
          fontSize: fontSize['4xl'],
          fontWeight: fontWeight.black as TextStyle['fontWeight'],
          color: 'white',
          marginTop: spacing[6],
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowRadius: 24,
          letterSpacing: -2,
        }}>
          {t('app.name')}
        </Text>
        <Text style={{
          fontSize: fontSize.md,
          color: 'rgba(255,255,255,0.95)',
          marginTop: spacing[3],
          textAlign: 'center',
          fontWeight: fontWeight.bold as TextStyle['fontWeight'],
          maxWidth: 280,
        }}>
          {t('app.tagline')}
        </Text>
      </LinearGradient>
    </MobileFrame>
  );
}
