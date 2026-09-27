// Progress shown in the onboarding header ("3 von 11"). The capture sub-steps
// (camera, voice, processing, saved) and the paywall sit outside the count.
export const ONBOARDING_STEPS = {
  name: 1,
  currency: 2,
  firstEntry: 3,
  categories: 4,
  budget: 5,
  notifications: 6,
  reminder: 7,
  actionButton: 8,
  widget: 9,
  birthday: 10,
  signUp: 11,
} as const;

export const ONBOARDING_TOTAL = 11;
