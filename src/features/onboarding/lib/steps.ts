// Progress shown in the onboarding header ("3 von 10"). The capture sub-steps
// (camera, voice, processing, saved) and the paywall sit outside the count.
export const ONBOARDING_STEPS = {
  name: 1,
  currency: 2,
  firstEntry: 3,
  budget: 4,
  notifications: 5,
  reminder: 6,
  actionButton: 7,
  widget: 8,
  birthday: 9,
  signUp: 10,
} as const;

export const ONBOARDING_TOTAL = 10;
