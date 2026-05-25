export type MethodId = 'mom' | 'palace' | 'chain' | 'body' | 'peg' | 'substitution' | 'fast';

export interface MethodMeta {
  id: MethodId;
  emoji: string;
  unit: number;
  order: number;
  unlockAfter?: MethodId;
}

export const METHODS: MethodMeta[] = [
  { id: 'mom', emoji: '🧠', unit: 1, order: 1 },
  { id: 'palace', emoji: '🏰', unit: 2, order: 2, unlockAfter: 'mom' },
  { id: 'chain', emoji: '🔗', unit: 3, order: 3, unlockAfter: 'palace' },
  { id: 'body', emoji: '🧍', unit: 4, order: 4, unlockAfter: 'chain' },
  { id: 'peg', emoji: '⚓', unit: 5, order: 5, unlockAfter: 'body' },
  { id: 'substitution', emoji: '🎨', unit: 6, order: 6, unlockAfter: 'peg' },
  { id: 'fast', emoji: '⚡', unit: 7, order: 7, unlockAfter: 'substitution' },
];

export const METHOD_BY_ID: Record<MethodId, MethodMeta> =
  METHODS.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<MethodId, MethodMeta>);

export const UNITS: Array<{ number: number; methodId: MethodId; titleKey: string }> = [
  { number: 1, methodId: 'mom', titleKey: 'methods.mom_full' },
  { number: 2, methodId: 'palace', titleKey: 'methods.palace_full' },
  { number: 3, methodId: 'chain', titleKey: 'methods.chain_full' },
  { number: 4, methodId: 'body', titleKey: 'methods.body_full' },
  { number: 5, methodId: 'peg', titleKey: 'methods.peg_full' },
  { number: 6, methodId: 'substitution', titleKey: 'methods.substitution_full' },
  { number: 7, methodId: 'fast', titleKey: 'methods.fast_full' },
];
