import React from 'react';
import { View, Text, Pressable, ScrollView, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MobileFrame from '../src/components/MobileFrame';
import Button from '../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius, shadows } from '../src/theme';
import { useUserStore, GoalLevel } from '../src/stores/userStore';
import { isRTL } from '../src/i18n';

const OPTIONS: Array<{ id: GoalLevel; icon: string }> = [
  { id: 'casual', icon: '☕' },
  { id: 'regular', icon: '🎯' },
  { id: 'serious', icon: '🚀' },
  { id: 'intense', icon: '🔥' },
];

export default function GoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const language = useUserStore(s => s.language);
  const goal = useUserStore(s => s.goal);
  const setGoal = useUserStore(s => s.setGoal);
  const finishOnboarding = useUserStore(s => s.finishOnboarding);
  const rtl = isRTL(language);

  return (
    <MobileFrame>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5] }}>
          <View style={{ alignItems: 'center', marginTop: spacing[2] }}>
            <Text style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              color: colors.text,
              textAlign: 'center',
              letterSpacing: -1,
            }}>{t('signup.title')}</Text>
            <Text style={{
              fontSize: fontSize.sm,
              color: colors.textMuted,
              marginTop: spacing[2],
              textAlign: 'center',
              maxWidth: 280,
            }}>{t('signup.subtitle')}</Text>
          </View>

          <View style={{ gap: spacing[3] }}>
            {OPTIONS.map(opt => {
              const selected = goal === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setGoal(opt.id)}
                  style={{
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: spacing[4],
                    padding: spacing[4],
                    backgroundColor: selected ? '#F5F3FF' : colors.surface,
                    borderRadius: radius.xl,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    ...(selected ? shadows.purple : shadows.xs),
                  }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: fontSize.md,
                      fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
                      color: colors.text,
                    }}>{t(`signup.${opt.id}`)}</Text>
                    <Text style={{
                      fontSize: fontSize.sm,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}>{t(`signup.${opt.id}_time`)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ padding: spacing[5] }}>
          <Button
            title={t('common.continue')}
            variant="primary"
            size="lg"
            block
            onPress={() => {
              finishOnboarding();
              router.replace('/(tabs)/home');
            }}
          />
        </View>
      </View>
    </MobileFrame>
  );
}
