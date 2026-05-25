import React from 'react';
import { View, Text, ScrollView, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '../../src/components/Mascot';
import { Chip } from '../../src/components/Chip';
import LessonBubble from '../../src/components/LessonBubble';
import { colors, fontSize, fontWeight, spacing, radius, shadows, gradients } from '../../src/theme';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { METHODS, METHOD_BY_ID } from '../../src/data/methods';
import { LESSONS_BY_METHOD } from '../../src/data/lessons';
import { isRTL } from '../../src/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const language = useUserStore(s => s.language);
  const xp = useUserStore(s => s.xp);
  const hearts = useUserStore(s => s.hearts);
  const streakDays = useUserStore(s => s.streakDays);
  const lessonProgress = useProgressStore(s => s.lessons);
  const rtl = isRTL(language);

  // Build flat list of all lessons across methods, ordered
  const allLessons = METHODS.flatMap(m => LESSONS_BY_METHOD[m.id]);

  // Determine current lesson: first non-completed
  const currentLessonId = React.useMemo(() => {
    for (const l of allLessons) {
      if (lessonProgress[l.id]?.status !== 'completed') return l.id;
    }
    return allLessons[allLessons.length - 1]?.id;
  }, [lessonProgress, allLessons]);

  const isLessonAvailable = (lessonId: string) => {
    const idx = allLessons.findIndex(l => l.id === lessonId);
    if (idx === 0) return true;
    const prev = allLessons[idx - 1];
    return lessonProgress[prev.id]?.status === 'completed';
  };

  const getStatus = (lessonId: string) => {
    const status = lessonProgress[lessonId]?.status;
    if (status === 'completed') return 'completed' as const;
    if (lessonId === currentLessonId && isLessonAvailable(lessonId)) return 'current' as const;
    if (isLessonAvailable(lessonId)) return 'unlocked' as const;
    return 'locked' as const;
  };

  const goToLesson = (lessonId: string) => {
    const status = getStatus(lessonId);
    if (status === 'locked') return;
    router.push({ pathname: '/lesson/[id]/intro', params: { id: lessonId } });
  };

  // Render units (each with their lessons)
  const renderUnit = (methodId: typeof METHODS[number]['id'], idx: number) => {
    const meta = METHOD_BY_ID[methodId];
    const lessons = LESSONS_BY_METHOD[methodId];
    const firstLesson = lessons[0];
    const isLocked = !firstLesson || !isLessonAvailable(firstLesson.id);

    return (
      <View key={methodId} style={{ marginBottom: spacing[6] }}>
        <View style={{
          backgroundColor: colors[isLocked ? 'locked' : 'primary'],
          borderRadius: radius.xl,
          paddingBottom: 8,
          marginBottom: spacing[5],
        }}>
          <LinearGradient
            colors={isLocked ? [colors.locked, colors.locked] as any : gradients.primary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: spacing[5],
              borderRadius: radius.xl,
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: spacing[3],
            }}>
            <Text style={{ fontSize: 32 }}>{meta.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.black as TextStyle['fontWeight'],
                color: 'white',
                opacity: 0.92,
                letterSpacing: 2,
              }}>{t('home.unit')} {meta.unit}</Text>
              <Text style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.black as TextStyle['fontWeight'],
                color: 'white',
                textShadowColor: 'rgba(0,0,0,0.2)',
                textShadowRadius: 4,
              }}>{t(`methods.${methodId}_full`)}</Text>
            </View>
            <Text style={{ fontSize: 22, color: 'white', opacity: isLocked ? 0.5 : 1 }}>
              {isLocked ? '🔒' : '→'}
            </Text>
          </LinearGradient>
        </View>

        <View style={{ alignItems: 'center', gap: spacing[6] }}>
          {lessons.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' }}>
                {language === 'he' ? 'בקרוב...' : 'Coming soon...'}
              </Text>
            </View>
          )}
          {lessons.map((lesson, i) => {
            const offset = i % 3 === 0 ? -50 : i % 3 === 1 ? 0 : 50;
            return (
              <View key={lesson.id} style={{ transform: [{ translateX: rtl ? -offset : offset }] }}>
                <LessonBubble
                  status={getStatus(lesson.id)}
                  emoji={meta.emoji}
                  badge={t('home.lesson')}
                  onPress={() => goToLesson(lesson.id)}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Top bar with stats */}
      <View style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
      }}>
        <Chip variant="streak" value={streakDays || 0} />
        <Chip variant="xp" value={xp} />
        <Chip variant="heart" value={hearts} />
      </View>

      {/* Greeting */}
      <View style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[3],
      }}>
        <View>
          <Mascot size={56} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
            color: colors.text,
            writingDirection: rtl ? 'rtl' : 'ltr',
          }}>{t('home.greeting')}</Text>
          <Text style={{
            fontSize: fontSize.sm,
            color: colors.textMuted,
            writingDirection: rtl ? 'rtl' : 'ltr',
            fontWeight: '600',
          }}>{t('home.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[10] }}>
        {METHODS.slice(0, 3).map((m, i) => renderUnit(m.id, i))}
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
