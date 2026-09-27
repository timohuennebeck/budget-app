// Progress shown in the onboarding header ("3 von 11"). The capture sub-steps
// (camera, voice, processing, review, saved) and the paywall sit outside it.
export const ONBOARDING_STEPS = {
  name: 1,
  currency: 2,
  firstEntry: 3,
  budget: 4,
  notifications: 5,
  reminder: 6,
  actionButton: 7,
  applePay: 8,
  widget: 9,
  birthday: 10,
  signUp: 11,
} as const;

export const ONBOARDING_TOTAL = 11;
