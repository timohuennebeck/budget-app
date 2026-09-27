import { useLocalSearchParams } from 'expo-router';

import { PeriodPickerScreen } from '@/features/entries/components/period-picker-screen';
import type { PeriodTarget } from '@/features/entries/data/period-store';

export default function SelectPeriodRoute() {
  const { target } = useLocalSearchParams<{ target: PeriodTarget }>();
  return <PeriodPickerScreen target={target === 'check-ins' ? 'check-ins' : 'entries'} />;
}
