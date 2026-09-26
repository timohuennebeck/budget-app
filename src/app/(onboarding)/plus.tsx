import { router } from 'expo-router';

import { PaywallScreen } from '@/features/paywall/components/paywall-screen';

export default function OnboardingPaywall() {
  return <PaywallScreen onClose={() => router.replace('/done')} />;
}
