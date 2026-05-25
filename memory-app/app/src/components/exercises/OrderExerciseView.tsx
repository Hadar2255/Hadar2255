import React from 'react';
import { View, Text, Pressable, ScrollView, TextStyle } from 'react-native';
import { OrderExercise } from '../../data/lessons';
import { colors, radius, fontSize, fontWeight, spacing } from '../../theme';
import { Language, isRTL } from '../../i18n';

interface Props {
  exercise: OrderExercise;
  lang: Language;
  onAnswered: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // make sure shuffled is not identical to original
  if (a.every((v, i) => v === arr[i]) && arr.length > 1) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}

export const OrderExerciseView: React.FC<Props> = ({ exercise, lang, onAnswered }) => {
  const rtl = isRTL(lang);
  const originalItems = exercise.items;
  const [pool] = React.useState(() => shuffle(originalItems.map((_, i) => i)));
  const [picked, setPicked] = React.useState<number[]>([]);
  const [revealed, setRevealed] = React.useState(false);

  const available = pool.filter(i => !picked.includes(i));

  React.useEffect(() => {
    (OrderExerciseView as any).__currentInstance = {
      check: () => {
        if (revealed) return null;
        const correct = picked.every((origIdx, i) => origIdx === i);
        setRevealed(true);
        onAnswered(correct);
        return correct;
      },
      hasSelection: () => picked.length === originalItems.length && !revealed,
    };
  }, [picked, revealed]);

  const onPick = (i: number) => {
    if (revealed) return;
    setPicked(p => [...p, i]);
  };
  const onUnpick = (i: number) => {
    if (revealed) return;
    setPicked(p => p.filter(x => x !== i));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
      <Text style={{
        fontSize: fontSize.lg,
        fontWeight: fontWeight.black as TextStyle['fontWeight'],
        color: colors.text,
        writingDirection: rtl ? 'rtl' : 'ltr',
        textAlign: rtl ? 'right' : 'left',
      }}>
        {exercise.question[lang]}
      </Text>

      {/* Picked slots */}
      <View style={{
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.lg,
        padding: spacing[3],
        gap: spacing[2],
        minHeight: 160,
      }}>
        {Array.from({ length: originalItems.length }).map((_, slotIdx) => {
          const pickedIdx = picked[slotIdx];
          return (
            <View key={slotIdx} style={{
              minHeight: 44,
              borderRadius: radius.md,
              borderWidth: 2,
              borderStyle: pickedIdx === undefined ? 'dashed' : 'solid',
              borderColor: pickedIdx !== undefined && revealed
                ? (pickedIdx === slotIdx ? colors.success : colors.error)
                : colors.borderStrong,
              backgroundColor: pickedIdx !== undefined
                ? (revealed
                    ? (pickedIdx === slotIdx ? colors.successBg : colors.errorBg)
                    : 'white')
                : 'transparent',
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              paddingHorizontal: spacing[3],
              gap: spacing[2],
            }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.black as TextStyle['fontWeight'] }}>{slotIdx + 1}.</Text>
              {pickedIdx !== undefined && (
                <Pressable onPress={() => onUnpick(pickedIdx)} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.bold as TextStyle['fontWeight'],
                    color: colors.text,
                    writingDirection: rtl ? 'rtl' : 'ltr',
                  }}>{originalItems[pickedIdx][lang]}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {/* Available items */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
        {available.map((i) => (
          <Pressable
            key={i}
            onPress={() => onPick(i)}
            style={{
              backgroundColor: 'white',
              borderWidth: 2,
              borderColor: colors.primaryLight,
              borderRadius: radius.md,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
            }}>
            <Text style={{
              fontSize: fontSize.sm,
              fontWeight: fontWeight.bold as TextStyle['fontWeight'],
              color: colors.primaryDarker,
            }}>{originalItems[i][lang]}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

export default OrderExerciseView;
