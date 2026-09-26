export type PlanId = 'monthly' | 'yearly';

/** Plus is priced in euros only (app_config.plus_pricing), whatever the profile currency. */
export const PLUS_CURRENCY = 'EUR';

// Placeholder for RevenueCat. Keep this surface (startTrial / restore) so the
// paywall screens don't change when the real SDK is wired in.
export async function startTrial(plan: PlanId): Promise<{ active: boolean; plan: PlanId }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { active: false, plan };
}

export async function restorePurchases(): Promise<{ active: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { active: false };
}
