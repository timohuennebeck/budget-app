import { create } from 'zustand';

type Intent = 'capture' | null;

interface PendingIntentState {
  intent: Intent;
  set: (intent: Intent) => void;
  consume: () => Intent;
}

// Carries "open the capture flow" from the last onboarding step into the
// app, whose routes only exist once the profile is marked as onboarded.
export const usePendingIntent = create<PendingIntentState>((set, get) => ({
  intent: null,
  set: (intent) => set({ intent }),
  consume: () => {
    const { intent } = get();
    set({ intent: null });
    return intent;
  },
}));
