import { useShallow } from 'zustand/react/shallow';

import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { useCurrency, useProfile } from '@/features/profile/hooks/use-profile';

import type { CaptureMode } from '../data/capture-store';

/** Name and currency for copy and amounts, from the draft or the profile. */
export function useCaptureContext(mode: CaptureMode) {
  const draft = useOnboardingStore(
    useShallow((state) => ({ firstName: state.firstName, currency: state.currency })),
  );
  const { data: profile } = useProfile();
  const currency = useCurrency();
  if (mode === 'onboarding') return draft;
  return { firstName: profile?.first_name ?? '', currency };
}
