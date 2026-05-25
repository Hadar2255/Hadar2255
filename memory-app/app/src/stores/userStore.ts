import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../i18n';

const STORAGE_KEY = 'brainy.user.v1';

export type GoalLevel = 'casual' | 'regular' | 'serious' | 'intense';

export const GOAL_XP_TARGET: Record<GoalLevel, number> = {
  casual: 10,
  regular: 20,
  serious: 40,
  intense: 60,
};

export interface UserState {
  // Profile
  name: string;
  joinedAt: number;
  language: Language;
  goal: GoalLevel;
  darkMode: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  reminderTime: string;
  hasOnboarded: boolean;

  // Game stats
  xp: number;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  totalLessonsCompleted: number;
  totalCorrectAnswers: number;
  totalAnswers: number;
  weeklyXP: number[]; // 7 values, sun..sat

  // Actions
  hydrate: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  setGoal: (goal: GoalLevel) => void;
  setDarkMode: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  finishOnboarding: () => void;
  resetUser: () => void;

  // Game actions
  addXP: (amount: number) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  recordAnswer: (correct: boolean) => void;
  completeLesson: () => void;
  registerActivityToday: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
};

const initial: Omit<UserState, keyof Pick<UserState,
  'hydrate'|'setLanguage'|'setGoal'|'setDarkMode'|'setSoundEnabled'|'setNotifications'|
  'finishOnboarding'|'resetUser'|'addXP'|'loseHeart'|'refillHearts'|'recordAnswer'|
  'completeLesson'|'registerActivityToday'
>> = {
  name: 'הדר',
  joinedAt: Date.now(),
  language: 'he',
  goal: 'regular',
  darkMode: false,
  soundEnabled: true,
  notificationsEnabled: true,
  reminderTime: '19:00',
  hasOnboarded: false,
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streakDays: 0,
  longestStreak: 0,
  lastActiveDay: null,
  totalLessonsCompleted: 0,
  totalCorrectAnswers: 0,
  totalAnswers: 0,
  weeklyXP: [0, 0, 0, 0, 0, 0, 0],
};

const persist = async (state: Partial<UserState>) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...state }));
  } catch (e) {
    console.warn('Failed to persist user state', e);
  }
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initial,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to hydrate user state', e);
    }
  },

  setLanguage: (language) => {
    set({ language });
    persist({ language });
  },
  setGoal: (goal) => {
    set({ goal });
    persist({ goal });
  },
  setDarkMode: (darkMode) => {
    set({ darkMode });
    persist({ darkMode });
  },
  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled });
    persist({ soundEnabled });
  },
  setNotifications: (notificationsEnabled) => {
    set({ notificationsEnabled });
    persist({ notificationsEnabled });
  },
  finishOnboarding: () => {
    set({ hasOnboarded: true });
    persist({ hasOnboarded: true });
  },
  resetUser: () => {
    set(initial);
    persist(initial);
  },

  addXP: (amount) => {
    const dayIdx = new Date().getDay();
    const weeklyXP = [...get().weeklyXP];
    weeklyXP[dayIdx] = (weeklyXP[dayIdx] || 0) + amount;
    const xp = get().xp + amount;
    set({ xp, weeklyXP });
    persist({ xp, weeklyXP });
  },

  loseHeart: () => {
    const hearts = Math.max(0, get().hearts - 1);
    set({ hearts });
    persist({ hearts });
  },

  refillHearts: () => {
    const { maxHearts } = get();
    set({ hearts: maxHearts });
    persist({ hearts: maxHearts });
  },

  recordAnswer: (correct) => {
    const totalAnswers = get().totalAnswers + 1;
    const totalCorrectAnswers = get().totalCorrectAnswers + (correct ? 1 : 0);
    set({ totalAnswers, totalCorrectAnswers });
    persist({ totalAnswers, totalCorrectAnswers });
  },

  completeLesson: () => {
    const totalLessonsCompleted = get().totalLessonsCompleted + 1;
    set({ totalLessonsCompleted });
    persist({ totalLessonsCompleted });
    get().registerActivityToday();
  },

  registerActivityToday: () => {
    const today = todayStr();
    const last = get().lastActiveDay;
    let streakDays = get().streakDays;
    if (last === today) return;
    if (last && dayDiff(last, today) === 1) {
      streakDays += 1;
    } else if (!last || dayDiff(last, today) > 1) {
      streakDays = 1;
    }
    const longestStreak = Math.max(get().longestStreak, streakDays);
    set({ streakDays, longestStreak, lastActiveDay: today });
    persist({ streakDays, longestStreak, lastActiveDay: today });
  },
}));
