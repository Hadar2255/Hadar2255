import React from 'react';
import { View, Text, Pressable, ScrollView, TextStyle } from 'react-native';
import { MCExercise } from '../../data/lessons';
import { colors, radius, fontSize, fontWeight, spacing, shadows } from '../../theme';
import { Language, isRTL } from '../../i18n';

interface Props {
  exercise: MCExercise;
  lang: Language;
  onAnswered: (correct: boolean) => void;
}

export const MCExerciseView: React.FC<Props> = ({ exercise, lang, onAnswered }) => {
  const rtl = isRTL(lang);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  // Expose selection to parent via callback when revealed by parent's Check button
  React.useEffect(() => {
    (MCExerciseView as any).__currentInstance = {
      check: () => {
        if (selected === null || revealed) return null;
        const isCorrect = !!exercise.options[selected].correct;
        setRevealed(true);
        onAnswered(isCorrect);
        return isCorrect;
      },
      hasSelection: () => selected !== null && !revealed,
    };
  }, [selected, revealed]);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
      <Text style={{
        fontSize: fontSize.xl,
        fontWeight: fontWeight.black as TextStyle['fontWeight'],
        color: colors.text,
        writingDirection: rtl ? 'rtl' : 'ltr',
        textAlign: rtl ? 'right' : 'left',
        marginBottom: spacing[2],
      }}>
        {exercise.question[lang]}
      </Text>

      <View style={{ gap: spacing[3] }}>
        {exercise.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = !!opt.correct;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;

          let bg = colors.surface;
          let border = colors.border;
          let shadowColor = colors.border;
          let textColor = colors.text;

          if (showCorrect) {
            bg = colors.successBg; border = colors.success; shadowColor = colors.success; textColor = colors.successDarker;
          } else if (showWrong) {
            bg = colors.errorBg; border = colors.error; shadowColor = colors.error; textColor = colors.errorDarker;
          } else if (isSelected) {
            bg = '#F5F3FF'; border = colors.primary; shadowColor = colors.primary; textColor = colors.primaryDarker;
          }

          return (
            <View key={i} style={{
              backgroundColor: shadowColor,
              borderRadius: radius.lg,
              paddingBottom: 4,
            }}>
              <Pressable
                disabled={revealed}
                onPress={() => setSelected(i)}
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: spacing[3],
                  padding: spacing[4],
                  backgroundColor: bg,
                  borderColor: border,
                  borderWidth: 2,
                  borderRadius: radius.lg,
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.md,
                  backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                  borderColor: colors.border,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.black as TextStyle['fontWeight'],
                    color: isSelected ? 'white' : colors.textSecondary,
                  }}>{i + 1}</Text>
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.bold as TextStyle['fontWeight'],
                  color: textColor,
                  writingDirection: rtl ? 'rtl' : 'ltr',
                  textAlign: rtl ? 'right' : 'left',
                }}>
                  {opt.text[lang]}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default MCExerciseView;
