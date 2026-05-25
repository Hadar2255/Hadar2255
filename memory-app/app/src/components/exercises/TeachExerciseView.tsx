import React from 'react';
import { View, Text, ScrollView, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TeachExercise } from '../../data/lessons';
import { Mascot } from '../Mascot';
import { SpeechBubble } from '../SpeechBubble';
import { colors, gradients, radius, fontSize, fontWeight, spacing, shadows } from '../../theme';
import { Language, isRTL } from '../../i18n';

interface Props {
  exercise: TeachExercise;
  lang: Language;
}

const TILE_GRADIENTS: readonly (readonly string[])[] = [
  gradients.primarySoft,
  gradients.secondary,
  gradients.success,
];

const TILE_SHADOWS = [colors.primaryDarker, colors.secondaryDarker, colors.successDarker];

export const TeachExerciseView: React.FC<Props> = ({ exercise, lang }) => {
  const rtl = isRTL(lang);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5] }}>
      <View style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: spacing[3],
      }}>
        <View style={{ flexShrink: 0 }}>
          <Mascot size={92} />
        </View>
        <View style={{ flex: 1, marginBottom: spacing[2] }}>
          <SpeechBubble>
            <Text style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              color: colors.text,
              writingDirection: rtl ? 'rtl' : 'ltr',
              textAlign: rtl ? 'right' : 'left',
            }}>
              {exercise.title[lang]}
            </Text>
            <Text style={{
              fontSize: fontSize.base,
              color: colors.textSecondary,
              marginTop: spacing[2],
              lineHeight: 22,
              writingDirection: rtl ? 'rtl' : 'ltr',
              textAlign: rtl ? 'right' : 'left',
              fontWeight: fontWeight.medium as TextStyle['fontWeight'],
            }}>
              {exercise.body[lang]}
            </Text>
          </SpeechBubble>
        </View>
      </View>

      {exercise.tiles && (
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          {exercise.tiles.map((t, i) => (
            <View key={i} style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: radius.lg,
              overflow: 'hidden',
              ...shadows.md,
            }}>
              <LinearGradient
                colors={TILE_GRADIENTS[i % TILE_GRADIENTS.length] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  alignItems: 'center',
                  paddingTop: 18,
                  paddingBottom: 12,
                }}
              >
                <Text style={{
                  fontSize: 38,
                  fontWeight: fontWeight.black as TextStyle['fontWeight'],
                  color: i === 1 ? '#78350F' : 'white',
                  textShadowColor: 'rgba(0,0,0,0.2)',
                  textShadowRadius: 6,
                }}>{t.label}</Text>
              </LinearGradient>
              <View style={{ padding: spacing[3], alignItems: 'center' }}>
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
                  color: colors.text,
                  textAlign: 'center',
                }}>{t.word[lang]}</Text>
                <Text style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  marginTop: 2,
                  textAlign: 'center',
                }}>{t.desc[lang]}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {exercise.example && (
        <View style={{
          backgroundColor: '#FFFBEB',
          borderColor: colors.secondaryLight,
          borderWidth: 2,
          borderRadius: radius.lg,
          padding: spacing[4],
        }}>
          <Text style={{
            fontSize: fontSize.xs,
            fontWeight: fontWeight.black as TextStyle['fontWeight'],
            color: '#78350F',
            letterSpacing: 1,
            marginBottom: spacing[1],
            textAlign: rtl ? 'right' : 'left',
          }}>💡 {lang === 'he' ? 'דוגמה' : 'EXAMPLE'}</Text>
          <Text style={{
            fontSize: fontSize.sm,
            color: colors.text,
            lineHeight: 22,
            writingDirection: rtl ? 'rtl' : 'ltr',
            textAlign: rtl ? 'right' : 'left',
          }}>{exercise.example[lang]}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default TeachExerciseView;
