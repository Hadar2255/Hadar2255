import React from 'react';
import { View, Text, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mascot } from '../../../src/components/Mascot';
import Button from '../../../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius, gradients } from '../../../src/theme';
import { useUserStore } from '../../../src/stores/userStore';

export default function LessonComplete() {
  const { xp = '15', accuracy = '100' } = useLocalSearchParams<{ id: string; xp: string; accuracy: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const streakDays = useUserStore(s => s.streakDays);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={gradients.bgComplete as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
        }}>
        <Mascot size={170} />
        <Text style={{
          fontSize: fontSize['3xl'],
          fontWeight: fontWeight.black as TextStyle['fontWeight'],
          color: 'white',
          marginTop: spacing[4],
          letterSpacing: -1,
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowRadius: 12,
        }}>{t('lesson.complete_title')}</Text>
        <Text style={{
          fontSize: fontSize.md,
          color: 'rgba(255,255,255,0.95)',
          marginTop: spacing[1],
          fontWeight: fontWeight.bold as TextStyle['fontWeight'],
        }}>{t('lesson.complete_subtitle')}</Text>

        <View style={{
          flexDirection: 'row',
          gap: spacing[2],
          marginTop: spacing[6],
          width: '100%',
          maxWidth: 320,
        }}>
          {[
            { value: `+${xp}`, label: t('lesson.xp_gained') },
            { value: `${accuracy}%`, label: t('lesson.accuracy') },
            { value: '4:32', label: t('lesson.time') },
          ].map((s, i) => (
            <View key={i} style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: radius.lg,
              padding: spacing[3],
              alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
            }}>
              <Text style={{
                fontSize: fontSize.xl,
                fontWeight: fontWeight.black as TextStyle['fontWeight'],
                color: 'white',
                letterSpacing: -1,
              }}>{s.value}</Text>
              <Text style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 4,
                fontWeight: fontWeight.bold as TextStyle['fontWeight'],
                textTransform: 'uppercase',
              }}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{
          backgroundColor: colors.streak,
          paddingHorizontal: 22, paddingVertical: 12,
          borderRadius: 9999,
          marginTop: spacing[6],
          borderWidth: 2, borderColor: '#FED7AA',
          flexDirection: 'row', gap: 8, alignItems: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: fontSize.base }}>
            {t('lesson.streak_continued')} {streakDays}
          </Text>
        </View>
      </LinearGradient>

      <View style={{ padding: spacing[5], backgroundColor: 'white', gap: spacing[3] }}>
        <Button
          title={t('lesson.continue_path')}
          variant="primary"
          size="lg"
          block
          onPress={() => router.replace('/(tabs)/home')}
        />
        <Button title={t('lesson.share')} variant="ghost" size="sm" block />
      </View>
    </View>
  );
}
