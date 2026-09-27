import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DraftEntry } from '@/features/capture/lib/types';
import { deviceCurrency } from '@/shared/data/currencies';
import type { Enums } from '@/shared/lib/database.types';
import { persistStorage } from '@/shared/lib/storage';

export interface OnboardingDraft {
  firstName: string;
  currency: string;
  budgetMode: Enums<'budget_mode'>;
  monthlyBudget: number;
  /** Limits by preset id */
  categoryLimits: Record<string, number | null>;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderRepeat: Enums<'reminder_repeat'>;
  birthDate: string | null;
  entries: DraftEntry[];
  captureTipsSeen: boolean;
  /** Set once completeOnboarding has written the answers to the account */
  saved: boolean;
}

interface OnboardingState extends OnboardingDraft {
  update: (patch: Partial<OnboardingDraft>) => void;
  addEntries: (entries: DraftEntry[]) => void;
  reset: () => void;
}

const initialDraft: OnboardingDraft = {
  firstName: '',
  currency: deviceCurrency(),
  budgetMode: 'per_category',
  monthlyBudget: 800,
  categoryLimits: {},
  reminderEnabled: false,
  reminderTime: '20:30',
  reminderRepeat: 'daily',
  birthDate: null,
  entries: [],
  captureTipsSeen: false,
  saved: false,
};

// Answers collected before an account exists. Persisted so closing the app
// mid-onboarding resumes where the user left off; cleared once the data has
// been written to Supabase after sign-up.
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialDraft,
      update: (patch) => set(patch),
      addEntries: (entries) => set((state) => ({ entries: [...state.entries, ...entries] })),
      reset: () => set(initialDraft),
    }),
    { name: 'looop-onboarding', storage: persistStorage },
  ),
);
