import { useMutation } from '@tanstack/react-query';

import { type PlanId, restorePurchases, startTrial } from '../lib/purchases';

export function useStartTrial() {
  return useMutation({ mutationFn: (plan: PlanId) => startTrial(plan) });
}

export function useRestorePurchases() {
  return useMutation({ mutationFn: restorePurchases });
}
