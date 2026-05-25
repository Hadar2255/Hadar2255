import React from 'react';
import { View, Text, Pressable, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Lesson } from '../data/lessons';
import { colors, radius, fontSize, fontWeight, spacing } from '../theme';
import { Button } from './Button';
import { Chip } from './Chip';
import { ProgressBar } from './ProgressBar';
import TeachExerciseView from './exercises/TeachExerciseView';
import MCExerciseView from './exercises/MCExerciseView';
import MatchExerciseView from './exercises/MatchExerciseView';
import RecallExerciseView from './exercises/RecallExerciseView';
import OrderExerciseView from './exercises/OrderExerciseView';
import { useUserStore } from '../stores/userStore';
import { useProgressStore } from '../stores/progressStore';
import { Language, isRTL } from '../i18n';

interface Props {
  lesson: Lesson;
}

export const LessonRunner: React.FC<Props> = ({ lesson }) => {
  const router = useRouter();
  const lang = useUserStore(s => s.language);
  const rtl = isRTL(lang);
  const hearts = useUserStore(s => s.hearts);
  const addXP = useUserStore(s => s.addXP);
  const recordAnswer = useUserStore(s => s.recordAnswer);
  const completeLesson = useUserStore(s => s.completeLesson);
  const markCompleted = useProgressStore(s => s.markCompleted);

  const [step, setStep] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [wasCorrect, setWasCorrect] = React.useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [totalAnswerable, setTotalAnswerable] = React.useState(0);

  const exercise = lesson.exercises[step];
  const isLast = step === lesson.exercises.length - 1;
  const isTeach = exercise.type === 'teach';
  const isMatch = exercise.type === 'match';
  const progress = (step + (revealed ? 1 : 0)) / lesson.exercises.length;

  React.useEffect(() => {
    // Count answerable exercises on first render
    const total = lesson.exercises.filter(e => e.type !== 'teach').length;
    setTotalAnswerable(total);
  }, [lesson]);

  const handleAnswered = (correct: boolean) => {
    setRevealed(true);
    setWasCorrect(correct);
    if (correct) setCorrectCount(c => c + 1);
    recordAnswer(correct);
  };

  const handleCheck = () => {
    if (isTeach) {
      handleAdvance();
      return;
    }
    // Find current exercise view instance and trigger check
    const views: any[] = [MCExerciseView, RecallExerciseView, OrderExerciseView];
    for (const v of views) {
      if (v.__currentInstance?.check) {
        v.__currentInstance.check();
        v.__currentInstance = null;
        break;
      }
    }
  };

  const handleAdvance = () => {
    if (isLast) {
      // Finish lesson
      const accuracy = totalAnswerable > 0 ? Math.round((correctCount / totalAnswerable) * 100) : 100;
      addXP(lesson.xpReward);
      completeLesson();
      markCompleted(lesson.id, accuracy);
      router.replace({
        pathname: '/lesson/[id]/complete',
        params: { id: lesson.id, xp: String(lesson.xpReward), accuracy: String(accuracy) },
      });
      return;
    }
    setStep(s => s + 1);
    setRevealed(false);
    setWasCorrect(null);
  };

  const checkDisabled = () => {
    if (isTeach || isMatch) return false;
    if (revealed) return false;
    const views: any[] = [MCExerciseView, RecallExerciseView, OrderExerciseView];
    for (const v of views) {
      if (v.__currentInstance?.hasSelection) {
        return !v.__currentInstance.hasSelection();
      }
    }
    return true;
  };

  // Force re-render when user makes a selection (poll briefly)
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    if (isTeach || isMatch || revealed) return;
    const t = setInterval(force, 200);
    return () => clearInterval(t);
  }, [isTeach, isMatch, revealed]);

  const buttonLabel = revealed
    ? (lang === 'he' ? 'המשך' : 'CONTINUE')
    : (lang === 'he' ? 'בדוק' : 'CHECK');

  const buttonVariant: 'primary' | 'success' | 'error' =
    revealed ? (wasCorrect ? 'success' : 'error') : 'primary';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header with progress + hearts */}
      <View style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Pressable onPress={() => router.back()} style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textSecondary }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={progress} variant="success" />
        </View>
        <Chip variant="heart" value={hearts} />
      </View>

      {/* Exercise body */}
      <View style={{ flex: 1 }}>
        {exercise.type === 'teach' && (
          <TeachExerciseView exercise={exercise} lang={lang as Language} />
        )}
        {exercise.type === 'mc' && (
          <MCExerciseView exercise={exercise} lang={lang as Language} onAnswered={handleAnswered} />
        )}
        {exercise.type === 'match' && (
          <MatchExerciseView exercise={exercise} lang={lang as Language} onComplete={() => handleAnswered(true)} />
        )}
        {exercise.type === 'recall' && (
          <RecallExerciseView exercise={exercise} lang={lang as Language} onAnswered={handleAnswered} />
        )}
        {exercise.type === 'order' && (
          <OrderExerciseView exercise={exercise} lang={lang as Language} onAnswered={handleAnswered} />
        )}
      </View>

      {/* Footer with feedback + check button */}
      <View style={{
        padding: spacing[4],
        gap: spacing[3],
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        {revealed && wasCorrect !== null && (
          <View style={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: spacing[3],
            padding: spacing[3],
            borderRadius: radius.lg,
            backgroundColor: wasCorrect ? colors.successBg : colors.errorBg,
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'white',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 24, color: wasCorrect ? colors.success : colors.error }}>
                {wasCorrect ? '✓' : '✕'}
              </Text>
            </View>
            <Text style={{
              fontSize: fontSize.base,
              fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
              color: wasCorrect ? colors.successDarker : colors.errorDarker,
              flex: 1,
              writingDirection: rtl ? 'rtl' : 'ltr',
            }}>
              {wasCorrect
                ? (lang === 'he' ? 'מצוין! תשובה נכונה' : 'Excellent! Correct')
                : (lang === 'he' ? 'אופס, לא נכון' : 'Oops, incorrect')}
            </Text>
          </View>
        )}
        <Button
          title={buttonLabel}
          block
          size="lg"
          variant={buttonVariant}
          disabled={checkDisabled() && !isMatch}
          onPress={revealed ? handleAdvance : handleCheck}
        />
      </View>
    </View>
  );
};

export default LessonRunner;
