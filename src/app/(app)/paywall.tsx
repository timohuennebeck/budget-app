import { router } from 'expo-router';

import { PaywallScreen } from '@/features/paywall/components/paywall-screen';

export default function PaywallRoute() {
  return <PaywallScreen onClose={() => router.back()} />;
}
