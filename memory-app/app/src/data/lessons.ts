import { MethodId } from './methods';

export type ExerciseType = 'teach' | 'mc' | 'match' | 'recall' | 'order';

export interface TeachExercise {
  type: 'teach';
  title: { he: string; en: string };
  body: { he: string; en: string };
  example?: { he: string; en: string };
  tiles?: Array<{ label: string; word: { he: string; en: string }; desc: { he: string; en: string } }>;
}

export interface MCExercise {
  type: 'mc';
  question: { he: string; en: string };
  options: Array<{ text: { he: string; en: string }; correct?: boolean }>;
}

export interface MatchExercise {
  type: 'match';
  title: { he: string; en: string };
  pairs: Array<{ a: { he: string; en: string }; b: { he: string; en: string } }>;
}

export interface RecallExercise {
  type: 'recall';
  question: { he: string; en: string };
  placeholder?: { he: string; en: string };
  acceptedAnswers: string[]; // lowercase
  hint?: { he: string; en: string };
}

export interface OrderExercise {
  type: 'order';
  question: { he: string; en: string };
  items: Array<{ he: string; en: string }>; // in correct order
}

export type Exercise = TeachExercise | MCExercise | MatchExercise | RecallExercise | OrderExercise;

export interface Lesson {
  id: string;             // e.g. "mom-1"
  methodId: MethodId;
  index: number;          // 1-based within method
  title: { he: string; en: string };
  subtitle: { he: string; en: string };
  bullets: Array<{ he: string; en: string }>;
  xpReward: number;
  exercises: Exercise[];
}

// ============ MOM Lessons ============

const momLesson1: Lesson = {
  id: 'mom-1',
  methodId: 'mom',
  index: 1,
  title: {
    he: 'ה-MOM של הזיכרון',
    en: 'The MOM of Memory',
  },
  subtitle: {
    he: 'המפתח לזיכרון מתחיל ביסודות',
    en: 'The key to memory starts with the basics',
  },
  bullets: [
    { he: 'מהי המוטיבציה ולמה היא חשובה לזיכרון', en: 'What motivation is and why it matters' },
    { he: 'איך תצפית מודעת משנה את הזיכרון', en: 'How conscious observation transforms memory' },
    { he: 'המכניזם של זיכרון לטווח ארוך', en: 'The mechanism of long-term memory' },
  ],
  xpReward: 15,
  exercises: [
    {
      type: 'teach',
      title: { he: 'מהו MOM?', en: 'What is MOM?' },
      body: {
        he: "ג'ים קוויק לימד שזיכרון נשען על שלושה עקרונות: מוטיבציה (M), תצפית (O), ומכניזם (M). כדי לזכור משהו אתה חייב לרצות לזכור, לתת תשומת לב מלאה, ולהשתמש בטכניקה.",
        en: 'Jim Kwik taught that memory rests on three principles: Motivation (M), Observation (O), and Mechanism (M). To remember something you must want to remember it, give it full attention, and use a technique.',
      },
      example: {
        he: 'כשאתה פוגש מישהו חדש ובאמת רוצה לזכור את שמו - אתה מתרכז בפנים שלו, חוזר על השם, ויוצר ציור מנטלי. זה ה-MOM בפעולה.',
        en: "When you meet someone new and really want to remember their name — you focus on their face, repeat the name, and create a mental image. That's MOM in action.",
      },
      tiles: [
        { label: 'M', word: { he: 'מוטיבציה', en: 'Motivation' }, desc: { he: 'תרצה לזכור', en: 'Want to remember' } },
        { label: 'O', word: { he: 'תצפית', en: 'Observation' }, desc: { he: 'שים לב', en: 'Pay attention' } },
        { label: 'M', word: { he: 'מכניזם', en: 'Mechanism' }, desc: { he: 'השתמש בשיטה', en: 'Use a method' } },
      ],
    },
    {
      type: 'mc',
      question: {
        he: 'מה משמעות האות M הראשונה ב-MOM?',
        en: 'What does the first M in MOM stand for?',
      },
      options: [
        { text: { he: 'Memory (זיכרון)', en: 'Memory' } },
        { text: { he: 'Motivation (מוטיבציה)', en: 'Motivation' }, correct: true },
        { text: { he: 'Method (שיטה)', en: 'Method' } },
        { text: { he: 'Mind (תודעה)', en: 'Mind' } },
      ],
    },
    {
      type: 'match',
      title: { he: 'התאם בין האות למשמעות', en: 'Match each letter to its meaning' },
      pairs: [
        { a: { he: 'M (ראשונה)', en: 'M (first)' }, b: { he: 'מוטיבציה', en: 'Motivation' } },
        { a: { he: 'O', en: 'O' }, b: { he: 'תצפית', en: 'Observation' } },
        { a: { he: 'M (שנייה)', en: 'M (second)' }, b: { he: 'מכניזם', en: 'Mechanism' } },
      ],
    },
    {
      type: 'recall',
      question: {
        he: 'מהי האות הראשונה ב-MOM?',
        en: 'What does the first M in MOM stand for?',
      },
      placeholder: { he: 'הקלד את התשובה...', en: 'Type your answer...' },
      acceptedAnswers: ['motivation', 'מוטיבציה'],
      hint: { he: 'מה מניע אותך לזכור?', en: 'What drives you to remember?' },
    },
  ],
};

const momLesson2: Lesson = {
  id: 'mom-2',
  methodId: 'mom',
  index: 2,
  title: { he: 'מוטיבציה - הדלק של הזיכרון', en: 'Motivation - the fuel of memory' },
  subtitle: { he: 'בלי "למה" אין "איך"', en: 'Without "why" there is no "how"' },
  bullets: [
    { he: 'מה הופך מוטיבציה לחזקה', en: 'What makes motivation strong' },
    { he: 'איך לחבר רצון רגשי לזיכרון', en: 'How to connect emotion to memory' },
  ],
  xpReward: 15,
  exercises: [
    {
      type: 'teach',
      title: { he: 'הסיבה היא הכל', en: 'The reason is everything' },
      body: {
        he: 'מוטיבציה חזקה מגיעה כשיש לך סיבה ברורה לזכור. ככל שהסיבה אישית וחזקה יותר, המוח שלך יקדיש לה משאבים. נסה לחשוב על שם של מישהו שאתה אוהב מאוד - תזכור אותו מיד.',
        en: 'Strong motivation comes from a clear reason to remember. The more personal and powerful the reason, the more resources your brain dedicates. Think of a name of someone you love deeply — you remember it instantly.',
      },
    },
    {
      type: 'mc',
      question: { he: 'מהו המרכיב החזק ביותר במוטיבציה?', en: 'What is the strongest part of motivation?' },
      options: [
        { text: { he: 'לחץ חיצוני', en: 'External pressure' } },
        { text: { he: 'סיבה אישית רגשית', en: 'Personal emotional reason' }, correct: true },
        { text: { he: 'תגמול כספי', en: 'Money reward' } },
        { text: { he: 'פחד מכישלון', en: 'Fear of failure' } },
      ],
    },
    {
      type: 'recall',
      question: { he: 'השלם: "בלי ___ אין איך"', en: 'Complete: "Without ___ there is no how"' },
      acceptedAnswers: ['למה', 'why', 'מוטיבציה', 'motivation', 'reason', 'סיבה'],
      hint: { he: 'מתחיל ב-ל...', en: 'Starts with W...' },
    },
  ],
};

const momLesson3: Lesson = {
  id: 'mom-3',
  methodId: 'mom',
  index: 3,
  title: { he: 'תצפית - תשומת לב מודעת', en: 'Observation - conscious attention' },
  subtitle: { he: 'מה שלא שמת לב אליו, לא יכול להיזכר', en: "What you didn't notice can't be remembered" },
  bullets: [
    { he: 'ההבדל בין לראות לבין לשים לב', en: 'Seeing vs. noticing' },
    { he: 'תרגיל תצפית פעילה', en: 'Active observation exercise' },
  ],
  xpReward: 20,
  exercises: [
    {
      type: 'teach',
      title: { he: 'לראות ≠ לשים לב', en: 'Seeing ≠ Noticing' },
      body: {
        he: 'אתה רואה את השעון שלך אלפי פעמים, אבל האם אתה זוכר את הסוג של הספרות? המוח מסנן הרבה. תצפית מודעת היא לבחור להפנות תשומת לב מלאה לפרטים.',
        en: "You see your watch thousands of times, but do you remember the digit style? The brain filters a lot. Conscious observation is choosing to give full attention to details.",
      },
    },
    {
      type: 'mc',
      question: { he: 'מה המשמעות של O ב-MOM?', en: 'What does O mean in MOM?' },
      options: [
        { text: { he: 'Order (סדר)', en: 'Order' } },
        { text: { he: 'Organize (לארגן)', en: 'Organize' } },
        { text: { he: 'Observation (תצפית)', en: 'Observation' }, correct: true },
        { text: { he: 'Open (פתוח)', en: 'Open' } },
      ],
    },
    {
      type: 'order',
      question: { he: 'סדר את שלושת השלבים של MOM נכון', en: 'Order the three MOM steps correctly' },
      items: [
        { he: 'מוטיבציה - תרצה לזכור', en: 'Motivation - want to remember' },
        { he: 'תצפית - שים לב', en: 'Observation - pay attention' },
        { he: 'מכניזם - השתמש בשיטה', en: 'Mechanism - use a method' },
      ],
    },
  ],
};

export const LESSONS: Lesson[] = [
  momLesson1,
  momLesson2,
  momLesson3,
];

export const LESSONS_BY_METHOD: Record<MethodId, Lesson[]> = {
  mom: [momLesson1, momLesson2, momLesson3],
  palace: [],
  chain: [],
  body: [],
  peg: [],
  substitution: [],
  fast: [],
};

export const LESSON_BY_ID: Record<string, Lesson> =
  LESSONS.reduce((acc, l) => { acc[l.id] = l; return acc; }, {} as Record<string, Lesson>);

export function getLessonAt(methodId: MethodId, index: number): Lesson | undefined {
  return LESSONS_BY_METHOD[methodId][index - 1];
}
