import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MethodId } from '../data/methods';

const STORAGE_KEY = 'brainy.progress.v1';

export type LessonStatus = 'locked' | 'unlocked' | 'completed';

export interface LessonProgress {
  status: LessonStatus;
  bestScore?: number;
  completedAt?: number;
  attempts: number;
}

export interface ProgressState {
  // Map: lessonId -> progress
  lessons: Record<string, LessonProgress>;
  // Active method index in path
  currentMethod: MethodId;

  hydrate: () => Promise<void>;
  getLesson: (id: string) => LessonProgress;
  markCompleted: (id: string, score: number) => void;
  unlock: (id: string) => void;
  reset: () => void;
}

const persist = async (state: Pick<ProgressState, 'lessons' | 'currentMethod'>) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to persist progress', e);
  }
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  lessons: {},
  currentMethod: 'mom',

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to hydrate progress', e);
    }
  },

  getLesson: (id) => {
    return get().lessons[id] ?? { status: 'locked', attempts: 0 };
  },

  markCompleted: (id, score) => {
    const lessons = { ...get().lessons };
    const prev = lessons[id] ?? { status: 'unlocked', attempts: 0 };
    lessons[id] = {
      status: 'completed',
      bestScore: Math.max(prev.bestScore ?? 0, score),
      completedAt: Date.now(),
      attempts: prev.attempts + 1,
    };
    set({ lessons });
    persist({ lessons, currentMethod: get().currentMethod });
  },

  unlock: (id) => {
    const lessons = { ...get().lessons };
    if (!lessons[id] || lessons[id].status === 'locked') {
      lessons[id] = { status: 'unlocked', attempts: 0 };
      set({ lessons });
      persist({ lessons, currentMethod: get().currentMethod });
    }
  },

  reset: () => {
    set({ lessons: {}, currentMethod: 'mom' });
    persist({ lessons: {}, currentMethod: 'mom' });
  },
}));
