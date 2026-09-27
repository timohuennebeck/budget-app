import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DraftEntry } from '@/features/capture/lib/types';
import type { Enums } from '@/shared/lib/database.types';
import { persistStorage } from '@/shared/lib/storage';

export interface CustomCategoryDraft {
  /** Local id, used as category key until the row exists */
  id: string;
  name: string;
  icon: string;
  hue: number;
}

export interface OnboardingDraft {
  firstName: string;
  currency: string;
  /** Selected preset keys and custom category ids, in display order; null
   * until the user changes it, meaning the suggested presets */
  categoryIds: string[] | null;
  customCategories: CustomCategoryDraft[];
  budgetMode: Enums<'budget_mode'>;
  monthlyBudget: number;
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
  /** `selected` is the current selection from useSelectedCategoryIds */
  toggleCategory: (id: string, selected: string[]) => void;
  addCustomCategory: (category: Omit<CustomCategoryDraft, 'id'>, selected: string[]) => void;
  addEntries: (entries: DraftEntry[]) => void;
  reset: () => void;
}

const initialDraft: OnboardingDraft = {
  firstName: '',
  currency: 'EUR',
  categoryIds: null,
  customCategories: [],
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
      toggleCategory: (id, selected) =>
        set({
          categoryIds: selected.includes(id)
            ? selected.filter((current) => current !== id)
            : [...selected, id],
        }),
      addCustomCategory: (category, selected) =>
        set((state) => {
          const id = `custom-${Date.now().toString(36)}`;
          return {
            customCategories: [...state.customCategories, { ...category, id }],
            categoryIds: [...selected, id],
          };
        }),
      addEntries: (entries) => set((state) => ({ entries: [...state.entries, ...entries] })),
      reset: () => set(initialDraft),
    }),
    { name: 'looop-onboarding', storage: persistStorage },
  ),
);
