import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { categoryCatalog } from '@/features/categories/data/category-catalog';
import type { DraftEntry } from '@/features/capture/lib/types';
import type { Enums } from '@/shared/lib/database.types';
import { persistStorage } from '@/shared/lib/persist-storage';

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
  /** Selected catalog keys and custom category ids, in display order */
  categoryIds: string[];
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
}

interface OnboardingState extends OnboardingDraft {
  update: (patch: Partial<OnboardingDraft>) => void;
  toggleCategory: (id: string) => void;
  addCustomCategory: (category: Omit<CustomCategoryDraft, 'id'>) => void;
  addEntries: (entries: DraftEntry[]) => void;
  reset: () => void;
}

const initialDraft: OnboardingDraft = {
  firstName: '',
  currency: 'EUR',
  categoryIds: categoryCatalog
    .filter((category) => category.suggested)
    .map((category) => category.key),
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
};

// Answers collected before an account exists. Persisted so closing the app
// mid-onboarding resumes where the user left off; cleared once the data has
// been written to Supabase after sign-up.
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialDraft,
      update: (patch) => set(patch),
      toggleCategory: (id) =>
        set((state) => ({
          categoryIds: state.categoryIds.includes(id)
            ? state.categoryIds.filter((current) => current !== id)
            : [...state.categoryIds, id],
        })),
      addCustomCategory: (category) =>
        set((state) => {
          const id = `custom-${Date.now().toString(36)}`;
          return {
            customCategories: [...state.customCategories, { ...category, id }],
            categoryIds: [...state.categoryIds, id],
          };
        }),
      addEntries: (entries) => set((state) => ({ entries: [...state.entries, ...entries] })),
      reset: () => set(initialDraft),
    }),
    { name: 'looop-onboarding', storage: persistStorage },
  ),
);
