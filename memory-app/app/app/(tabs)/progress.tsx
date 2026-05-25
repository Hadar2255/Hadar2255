import React from 'react';
import { View, Text, ScrollView, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing, radius, shadows, gradients } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { isRTL } from '../../src/i18n';
import { METHODS, METHOD_BY_ID } from '../../src/data/methods';
import { LESSONS_BY_METHOD } from '../../src/data/lessons';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from '../../src/components/ProgressBar';

const DAY_KEYS = ['day_sun','day_mon','day_tue','day_wed','day_thu','day_fri','day_sat'];

function StatTile({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: 'white',
      borderRadius: radius.xl,
      padding: spacing[4],
      alignItems: 'center',
      borderWidth: 2, borderColor: colors.border,
      ...shadows.sm,
    }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={{
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.black as TextStyle['fontWeight'],
        color: colors.primary,
        marginTop: 4,
        letterSpacing: -1,
      }}>{value}</Text>
      <Text style={{
        fontSize: fontSize.xs,
        fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
        color: colors.textMuted,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const language = useUserStore(s => s.language);
  const xp = useUserStore(s => s.xp);
  const longestStreak = useUserStore(s => s.longestStreak);
  const totalLessonsCompleted = useUserStore(s => s.totalLessonsCompleted);
  const totalAnswers = useUserStore(s => s.totalAnswers);
  const totalCorrectAnswers = useUserStore(s => s.totalCorrectAnswers);
  const weeklyXP = useUserStore(s => s.weeklyXP);
  const lessons = useProgressStore(s => s.lessons);
  const rtl = isRTL(language);

  const accuracy = totalAnswers > 0 ? Math.round((totalCorrectAnswers / totalAnswers) * 100) : 0;
  const maxWeekly = Math.max(1, ...weeklyXP);
  const todayIdx = new Date().getDay();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing[4], alignItems: 'center' }}>
        <Text style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.black as TextStyle['fontWeight'],
          color: colors.text,
        }}>{t('progress.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5] }}>
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <StatTile icon="⚡" value={xp} label={t('progress.total_xp')} />
          <StatTile icon="🔥" value={longestStreak} label={t('progress.longest_streak')} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <StatTile icon="📚" value={totalLessonsCompleted} label={t('progress.lessons_done')} />
          <StatTile icon="🎯" value={`${accuracy}%`} label={t('progress.accuracy')} />
        </View>

        <View>
          <Text style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
            marginBottom: spacing[3],
            color: colors.text,
          }}>{t('progress.weekly_activity')}</Text>
          <View style={{
            backgroundColor: 'white',
            borderRadius: radius.xl,
            padding: spacing[4],
            borderWidth: 2, borderColor: colors.border,
            ...shadows.sm,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              height: 120,
              justifyContent: 'space-between',
              gap: spacing[2],
            }}>
              {weeklyXP.map((v, i) => {
                const h = Math.max(8, (v / maxWeekly) * 100);
                const isToday = i === todayIdx;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View style={{ width: '100%', height: h, borderRadius: 6, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={(isToday ? gradients.streak : gradients.primary) as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ flex: 1, borderRadius: 6 }}
                      />
                    </View>
                    <Text style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
                      color: colors.textMuted,
                    }}>{t(`progress.${DAY_KEYS[i] || 'day_sun'}`, language === 'he' ? ['א','ב','ג','ד','ה','ו','ש'][i] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i])}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View>
          <Text style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
            marginBottom: spacing[3],
            color: colors.text,
          }}>{t('progress.methods')}</Text>
          <View style={{ gap: spacing[3] }}>
            {METHODS.map(m => {
              const all = LESSONS_BY_METHOD[m.id];
              const done = all.filter(l => lessons[l.id]?.status === 'completed').length;
              const pct = all.length > 0 ? done / all.length : 0;
              return (
                <View key={m.id} style={{
                  backgroundColor: 'white',
                  borderRadius: radius.xl,
                  padding: spacing[4],
                  borderWidth: 2, borderColor: colors.border,
                  ...shadows.xs,
                }}>
                  <View style={{
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: spacing[3],
                    marginBottom: spacing[2],
                  }}>
                    <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.black as TextStyle['fontWeight'],
                        color: colors.text,
                      }}>{t(`methods.${m.id}_full`)}</Text>
                      <Text style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}>
                        {all.length === 0
                          ? (language === 'he' ? 'בקרוב' : 'Coming soon')
                          : `${done}/${all.length} ${language === 'he' ? 'שיעורים' : 'lessons'}`}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.black as TextStyle['fontWeight'],
                      color: colors.primary,
                    }}>{Math.round(pct * 100)}%</Text>
                  </View>
                  <ProgressBar value={pct} variant="primary" height={10} />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
