import React from 'react';
import { View, Text, ScrollView, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mascot } from '../src/components/Mascot';
import MobileFrame from '../src/components/MobileFrame';
import Button from '../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';
import { isRTL } from '../src/i18n';

const SLIDES = [
  {
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    illustration: 'mascot',
    bgColors: ['#DDD6FE', '#A78BFA', '#7C3AED'],
  },
  {
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    illustration: '🏰',
    bgColors: ['#FEF3C7', '#FCD34D', '#F59E0B'],
  },
  {
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    illustration: '🔥',
    bgColors: ['#FECACA', '#F87171', '#F97316'],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const language = useUserStore(s => s.language);
  const rtl = isRTL(language);
  const [step, setStep] = React.useState(0);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const onNext = () => {
    if (isLast) router.replace('/language');
    else setStep(s => s + 1);
  };
  const onSkip = () => router.replace('/language');

  return (
    <MobileFrame>
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          padding: spacing[4],
        }}>
          <View />
          <Button title={t('common.skip')} variant="ghost" size="sm" onPress={onSkip} />
        </View>

        <ScrollView contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
          gap: spacing[6],
        }}>
          <View style={{
            width: 260, height: 260, borderRadius: 130,
            shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 60,
            elevation: 12,
          }}>
            <LinearGradient
              colors={slide.bgColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                borderRadius: 130,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {slide.illustration === 'mascot' ? (
                <Mascot size={220} />
              ) : (
                <Text style={{ fontSize: 110 }}>{slide.illustration}</Text>
              )}
            </LinearGradient>
          </View>

          <Text style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
            color: colors.text,
            textAlign: 'center',
            letterSpacing: -1,
          }}>{t(slide.titleKey)}</Text>
          <Text style={{
            fontSize: fontSize.base,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 320,
            lineHeight: 24,
            fontWeight: fontWeight.medium as TextStyle['fontWeight'],
          }}>{t(slide.descKey)}</Text>
        </ScrollView>

        <View style={{ padding: spacing[6], gap: spacing[5] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[2] }}>
            {SLIDES.map((_, i) => (
              <View key={i} style={{
                width: i === step ? 32 : 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: i === step ? colors.primary : colors.borderStrong,
              }} />
            ))}
          </View>
          <Button
            title={isLast ? t('common.start') : t('common.next')}
            variant="primary"
            size="lg"
            block
            onPress={onNext}
          />
        </View>
      </View>
    </MobileFrame>
  );
}
