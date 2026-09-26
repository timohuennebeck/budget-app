// Progress shown in the onboarding header ("3 von 9"). Capture, widget and
// paywall steps sit outside the count, like in the design.
export const ONBOARDING_STEPS = {
  name: 1,
  currency: 2,
  categories: 3,
  budget: 4,
  notifications: 5,
  reminder: 6,
  actionButton: 7,
  birthday: 8,
  signUp: 9,
} as const;

export const ONBOARDING_TOTAL = 9;
