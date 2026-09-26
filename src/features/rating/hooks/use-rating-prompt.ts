import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useEntryDates } from '@/features/entries/hooks/use-entries';
import { persistStorage } from '@/shared/lib/persist-storage';

const ENTRIES_BEFORE_ASKING = 10;

interface RatingState {
  asked: boolean;
  markAsked: () => void;
}

const useRatingStore = create<RatingState>()(
  persist((set) => ({ asked: false, markAsked: () => set({ asked: true }) }), {
    name: 'looop-rating',
    storage: persistStorage,
  }),
);

/** Ask for a rating once, after the user has captured a few entries. */
export function useRatingPrompt() {
  const asked = useRatingStore((state) => state.asked);
  const markAsked = useRatingStore((state) => state.markAsked);
  const { data: dates = [] } = useEntryDates(!asked);
  return { shouldAsk: !asked && dates.length >= ENTRIES_BEFORE_ASKING, markAsked };
}
