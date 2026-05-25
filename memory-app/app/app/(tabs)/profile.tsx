import React from 'react';
import { View, Text, ScrollView, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '../../src/components/Mascot';
import Button from '../../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius, shadows, gradients } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';

const ACHIEVEMENTS = [
  { id: 'first_lesson', icon: '🥇', name: { he: 'השיעור הראשון', en: 'First Lesson' }, condition: (s: any) => s.totalLessonsCompleted >= 1 },
  { id: 'week_streak', icon: '🔥', name: { he: 'רצף שבוע', en: 'Week Streak' }, condition: (s: any) => s.longestStreak >= 7 },
  { id: 'perfect', icon: '🎯', name: { he: 'טוסט מושלם', en: 'Perfect' }, condition: (s: any) => s.totalAnswers >= 10 && s.totalCorrectAnswers / s.totalAnswers >= 0.9 },
  { id: 'early', icon: '🌅', name: { he: 'ציפור בוקר', en: 'Early Bird' }, condition: () => false },
  { id: 'night', icon: '🌙', name: { he: 'ינשוף לילה', en: 'Night Owl' }, condition: () => false },
  { id: 'month', icon: '👑', name: { he: 'רצף חודש', en: 'Month Streak' }, condition: (s: any) => s.longestStreak >= 30 },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const language = useUserStore(s => s.language);
  const name = useUserStore(s => s.name);
  const xp = useUserStore(s => s.xp);
  const streakDays = useUserStore(s => s.streakDays);
  const totalLessonsCompleted = useUserStore(s => s.totalLessonsCompleted);
  const totalAnswers = useUserStore(s => s.totalAnswers);
  const totalCorrectAnswers = useUserStore(s => s.totalCorrectAnswers);
  const longestStreak = useUserStore(s => s.longestStreak);
  const level = Math.floor(xp / 100) + 1;
  const state = { totalLessonsCompleted, longestStreak, totalAnswers, totalCorrectAnswers };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView>
        <LinearGradient
          colors={gradients.bgHero as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: spacing[5],
            paddingBottom: spacing[5],
            paddingHorizontal: spacing[5],
            alignItems: 'center',
          }}
        >
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: 'white',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 5, borderColor: 'white',
            overflow: 'hidden',
            ...shadows.lg,
          }}>
            <Mascot size={110} />
          </View>
          <View style={{
            backgroundColor: colors.secondary,
            paddingHorizontal: 12, paddingVertical: 4,
            borderRadius: 9999,
            marginTop: -16,
            borderWidth: 3, borderColor: 'white',
          }}>
            <Text style={{
              color: '#78350F',
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              fontSize: fontSize.xs,
            }}>{t('profile.level')} {level}</Text>
          </View>
          <Text style={{
            fontSize: fontSize.xl,
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
            color: 'white',
            marginTop: spacing[3],
            letterSpacing: -1,
          }}>{name}</Text>

          <View style={{
            flexDirection: 'row',
            gap: spacing[2],
            marginTop: spacing[4],
            width: '100%',
          }}>
            {[
              { v: streakDays || 0, l: `🔥 ${t('profile.streak')}` },
              { v: xp, l: `⚡ ${t('profile.xp')}` },
              { v: totalLessonsCompleted, l: `📚 ${t('profile.lessons')}` },
            ].map((stat, i) => (
              <View key={i} style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: radius.lg,
                padding: spacing[3],
                alignItems: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
              }}>
                <Text style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.black as TextStyle['fontWeight'],
                  color: 'white',
                }}>{stat.v}</Text>
                <Text style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.85)',
                  marginTop: 4,
                  fontWeight: fontWeight.bold as TextStyle['fontWeight'],
                }}>{stat.l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={{ padding: spacing[5], gap: spacing[5] }}>
          <Button title={t('profile.edit')} variant="outline" block />

          <View>
            <Text style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              marginBottom: spacing[3],
            }}>{t('profile.achievements')}</Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing[2],
            }}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = a.condition(state);
                return (
                  <View key={a.id} style={{
                    width: '31%',
                    backgroundColor: unlocked ? '#FFFBEB' : 'white',
                    borderColor: unlocked ? colors.secondary : colors.border,
                    borderWidth: 2,
                    borderRadius: radius.lg,
                    padding: spacing[3],
                    alignItems: 'center',
                    gap: spacing[2],
                    ...(unlocked ? shadows.amber : shadows.xs),
                  }}>
                    <View style={{
                      width: 56, height: 56, borderRadius: 28,
                      backgroundColor: unlocked ? colors.secondary : colors.surfaceAlt,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 3, borderColor: unlocked ? colors.secondaryDark : colors.border,
                      opacity: unlocked ? 1 : 0.4,
                    }}>
                      <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                    </View>
                    <Text style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
                      color: unlocked ? colors.text : colors.textMuted,
                      textAlign: 'center',
                    }}>{a.name[language]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
