import React from 'react';
import { View, Text, Pressable, ScrollView, TextStyle } from 'react-native';
import { MatchExercise } from '../../data/lessons';
import { colors, radius, fontSize, fontWeight, spacing } from '../../theme';
import { Language, isRTL } from '../../i18n';

interface Props {
  exercise: MatchExercise;
  lang: Language;
  onComplete: () => void;
}

interface Tile { id: string; pairId: number; text: string; }

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const MatchExerciseView: React.FC<Props> = ({ exercise, lang, onComplete }) => {
  const rtl = isRTL(lang);

  const initialTiles: Tile[] = React.useMemo(() => {
    const tiles: Tile[] = [];
    exercise.pairs.forEach((p, i) => {
      tiles.push({ id: `${i}-a`, pairId: i, text: p.a[lang] });
      tiles.push({ id: `${i}-b`, pairId: i, text: p.b[lang] });
    });
    return shuffle(tiles);
  }, [exercise, lang]);

  const [tiles] = React.useState(initialTiles);
  const [matched, setMatched] = React.useState<Set<string>>(new Set());
  const [selected, setSelected] = React.useState<Tile | null>(null);
  const [wrongIds, setWrongIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (matched.size === tiles.length) {
      setTimeout(() => onComplete(), 500);
    }
  }, [matched, tiles.length]);

  const onTilePress = (tile: Tile) => {
    if (matched.has(tile.id) || wrongIds.has(tile.id)) return;
    if (selected?.id === tile.id) {
      setSelected(null);
      return;
    }
    if (!selected) {
      setSelected(tile);
      return;
    }
    if (selected.pairId === tile.pairId) {
      const newMatched = new Set(matched);
      newMatched.add(selected.id);
      newMatched.add(tile.id);
      setMatched(newMatched);
      setSelected(null);
    } else {
      setWrongIds(new Set([selected.id, tile.id]));
      setTimeout(() => {
        setWrongIds(new Set());
        setSelected(null);
      }, 700);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
      <Text style={{
        fontSize: fontSize.lg,
        fontWeight: fontWeight.black as TextStyle['fontWeight'],
        color: colors.text,
        textAlign: 'center',
      }}>
        {exercise.title[lang]}
      </Text>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
      }}>
        {tiles.map((t) => {
          const isMatched = matched.has(t.id);
          const isSelected = selected?.id === t.id;
          const isWrong = wrongIds.has(t.id);
          let bg = colors.surface, border = colors.border, textColor = colors.text;
          if (isMatched) { bg = colors.successBg; border = colors.success; textColor = colors.successDarker; }
          else if (isWrong) { bg = colors.errorBg; border = colors.error; textColor = colors.errorDarker; }
          else if (isSelected) { bg = '#F5F3FF'; border = colors.primary; textColor = colors.primaryDarker; }
          return (
            <View key={t.id} style={{ width: '47%', backgroundColor: border, borderRadius: radius.lg, paddingBottom: 4 }}>
              <Pressable
                disabled={isMatched}
                onPress={() => onTilePress(t)}
                style={{
                  backgroundColor: bg,
                  borderWidth: 2,
                  borderColor: border,
                  borderRadius: radius.lg,
                  padding: spacing[4],
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 60,
                  opacity: isMatched ? 0.6 : 1,
                }}
              >
                <Text style={{
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.bold as TextStyle['fontWeight'],
                  color: textColor,
                  textAlign: 'center',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                }}>{t.text}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default MatchExerciseView;
