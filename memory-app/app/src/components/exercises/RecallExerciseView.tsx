import React from 'react';
import { View, Text, TextInput, ScrollView, TextStyle, Pressable } from 'react-native';
import { RecallExercise } from '../../data/lessons';
import { Mascot } from '../Mascot';
import { SpeechBubble } from '../SpeechBubble';
import { colors, radius, fontSize, fontWeight, spacing, shadows } from '../../theme';
import { Language, isRTL } from '../../i18n';

interface Props {
  exercise: RecallExercise;
  lang: Language;
  onAnswered: (correct: boolean) => void;
}

export const RecallExerciseView: React.FC<Props> = ({ exercise, lang, onAnswered }) => {
  const rtl = isRTL(lang);
  const [value, setValue] = React.useState('');
  const [revealed, setRevealed] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);

  React.useEffect(() => {
    (RecallExerciseView as any).__currentInstance = {
      check: () => {
        if (revealed) return null;
        const cleaned = value.trim().toLowerCase();
        const correct = exercise.acceptedAnswers.some(a =>
          cleaned === a.toLowerCase() || cleaned.includes(a.toLowerCase())
        );
        setRevealed(true);
        onAnswered(correct);
        return correct;
      },
      hasSelection: () => value.trim().length > 0 && !revealed,
    };
  }, [value, revealed]);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
      <View style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: spacing[3],
      }}>
        <View style={{ flexShrink: 0 }}>
          <Mascot size={72} />
        </View>
        <View style={{ flex: 1, marginBottom: spacing[1] }}>
          <SpeechBubble>
            <Text style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              color: colors.text,
              writingDirection: rtl ? 'rtl' : 'ltr',
              textAlign: rtl ? 'right' : 'left',
            }}>
              {exercise.question[lang]}
            </Text>
            {exercise.placeholder && (
              <Text style={{
                fontSize: fontSize.sm,
                color: colors.textMuted,
                marginTop: 4,
                writingDirection: rtl ? 'rtl' : 'ltr',
                textAlign: rtl ? 'right' : 'left',
              }}>
                {exercise.placeholder[lang]}
              </Text>
            )}
          </SpeechBubble>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!revealed}
        placeholder={exercise.placeholder?.[lang] ?? ''}
        placeholderTextColor={colors.textMuted}
        multiline
        style={{
          minHeight: 100,
          padding: spacing[4],
          borderWidth: 2,
          borderColor: revealed ? colors.primary : colors.border,
          borderRadius: radius.lg,
          backgroundColor: 'white',
          fontSize: fontSize.base,
          fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
          color: colors.text,
          writingDirection: rtl ? 'rtl' : 'ltr',
          textAlign: rtl ? 'right' : 'left',
          textAlignVertical: 'top',
        }}
      />

      {exercise.hint && (
        <Pressable
          onPress={() => setShowHint(s => !s)}
          style={{
            backgroundColor: '#FEF3C7',
            borderWidth: 2,
            borderColor: colors.secondaryLight,
            borderRadius: radius.md,
            padding: spacing[3],
          }}
        >
          <Text style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.bold as TextStyle['fontWeight'],
            color: '#78350F',
          }}>
            💡 {showHint ? exercise.hint[lang] : (lang === 'he' ? 'הצג רמז' : 'Show hint')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

export default RecallExerciseView;
