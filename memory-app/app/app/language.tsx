import React from 'react';
import { View, Text, Pressable, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MobileFrame from '../src/components/MobileFrame';
import Button from '../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius, shadows } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';
import { Language, isRTL } from '../src/i18n';

const OPTIONS: Array<{ code: Language; flag: string; native: string }> = [
  { code: 'he', flag: '🇮🇱', native: 'Hebrew' },
  { code: 'en', flag: '🇺🇸', native: 'English' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const language = useUserStore(s => s.language);
  const setLanguage = useUserStore(s => s.setLanguage);
  const rtl = isRTL(language);

  return (
    <MobileFrame>
      <View style={{ flex: 1 }}>
        <View style={{ padding: spacing[5], gap: spacing[5] }}>
          <View style={{ alignItems: 'center', marginTop: spacing[4] }}>
            <Text style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              color: colors.text,
              textAlign: 'center',
              letterSpacing: -1,
            }}>{t('language.title')}</Text>
            <Text style={{
              fontSize: fontSize.base,
              color: colors.textMuted,
              marginTop: spacing[2],
              textAlign: 'center',
            }}>{t('language.subtitle')}</Text>
          </View>

          <View style={{ gap: spacing[3] }}>
            {OPTIONS.map(opt => {
              const selected = language === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => setLanguage(opt.code)}
                  style={{
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: spacing[4],
                    padding: spacing[5],
                    backgroundColor: selected ? '#F5F3FF' : colors.surface,
                    borderRadius: radius.xl,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    ...(selected ? shadows.purple : shadows.xs),
                  }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 32 }}>{opt.flag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: fontSize.lg,
                      fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
                      color: colors.text,
                    }}>{opt.code === 'he' ? t('language.hebrew') : t('language.english')}</Text>
                    <Text style={{
                      fontSize: fontSize.sm,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}>{opt.native}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ padding: spacing[5] }}>
          <Button
            title={t('common.continue')}
            variant="primary"
            size="lg"
            block
            onPress={() => router.replace('/goal')}
          />
        </View>
      </View>
    </MobileFrame>
  );
}
