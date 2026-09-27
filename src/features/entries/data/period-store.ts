import { create } from 'zustand';

import type { DateRange } from '@/shared/lib/dates';

export type PeriodTarget = 'entries' | 'check-ins';

interface PeriodState {
  /** Chosen from–till per screen; null means the screen's default */
  ranges: Record<PeriodTarget, DateRange | null>;
  setRange: (target: PeriodTarget, range: DateRange | null) => void;
}

// Hands the range picked on the period page back to Einträge or Check-ins.
// Not persisted: every app start begins with the default period.
export const usePeriodStore = create<PeriodState>((set) => ({
  ranges: { entries: null, 'check-ins': null },
  setRange: (target, range) => set((state) => ({ ranges: { ...state.ranges, [target]: range } })),
}));
