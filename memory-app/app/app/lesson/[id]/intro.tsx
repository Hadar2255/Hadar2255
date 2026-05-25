import React from 'react';
import { View, Text, Pressable, ScrollView, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '../../../src/components/Mascot';
import Button from '../../../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius, shadows, gradients } from '../../../src/theme';
import { useUserStore } from '../../../src/stores/userStore';
import { LESSON_BY_ID } from '../../../src/data/lessons';
import { isRTL } from '../../../src/i18n';

export default function LessonIntro() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const language = useUserStore(s => s.language);
  const rtl = isRTL(language);

  const lesson = id ? LESSON_BY_ID[id] : undefined;
  if (!lesson) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Lesson not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={gradients.bgHero as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: spacing[12],
          paddingBottom: spacing[8],
          paddingHorizontal: spacing[5],
          alignItems: 'center',
        }}>
        <View style={{
          position: 'absolute', top: 50,
          flexDirection: 'row', justifyContent: 'space-between',
          left: spacing[4], right: spacing[4],
        }}>
          <Pressable onPress={() => router.back()} style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            width: 40, height: 40, borderRadius: 20,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>✕</Text>
          </Pressable>
        </View>

        <Mascot size={130} />

        <Text style={{
          fontSize: fontSize.xl,
          fontWeight: fontWeight.black as TextStyle['fontWeight'],
          color: 'white',
          marginTop: spacing[3],
          textAlign: 'center',
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowRadius: 12,
          letterSpacing: -1,
        }}>{lesson.title[language]}</Text>
        <Text style={{
          fontSize: fontSize.sm,
          color: 'rgba(255,255,255,0.95)',
          marginTop: 4,
          textAlign: 'center',
          fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
        }}>{lesson.subtitle[language]}</Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(255,255,255,0.25)',
          paddingHorizontal: 16, paddingVertical: 6,
          borderRadius: 9999,
          marginTop: spacing[3],
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
        }}>
          <Text style={{ fontSize: 14 }}>⏱</Text>
          <Text style={{ color: 'white', fontWeight: fontWeight.extrabold as TextStyle['fontWeight'], fontSize: fontSize.xs }}>
            {t('lesson.estimated_time')}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        <Text style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.black as TextStyle['fontWeight'],
          color: colors.text,
          writingDirection: rtl ? 'rtl' : 'ltr',
        }}>{t('lesson.what_youll_learn')}</Text>
        <View style={{
          backgroundColor: 'white',
          borderRadius: radius.xl,
          padding: spacing[5],
          borderWidth: 2, borderColor: colors.border,
          ...shadows.sm,
        }}>
          {lesson.bullets.map((b, i) => (
            <View key={i} style={{
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: spacing[3],
              paddingVertical: spacing[3],
              borderTopWidth: i === 0 ? 0 : 1,
              borderColor: colors.border,
            }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: colors.success,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: 'white', fontWeight: '900' }}>✓</Text>
              </View>
              <Text style={{
                flex: 1,
                fontSize: fontSize.base,
                color: colors.text,
                writingDirection: rtl ? 'rtl' : 'ltr',
                fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
              }}>{b[language]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: spacing[5], backgroundColor: 'white' }}>
        <Button
          title={t('lesson.start_lesson')}
          variant="primary"
          size="lg"
          block
          onPress={() => router.push({ pathname: '/lesson/[id]/play', params: { id: lesson.id } })}
        />
      </View>
    </View>
  );
}
