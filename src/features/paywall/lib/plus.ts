import type { Profile } from '@/features/profile/data/profile-api';

/** Plus is active while the expiry RevenueCat reported is in the future. */
export function hasPlus(profile: Pick<Profile, 'plus_expires_at'> | undefined, now = new Date()) {
  return !!profile?.plus_expires_at && new Date(profile.plus_expires_at) > now;
}
