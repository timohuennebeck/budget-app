import { useMonthlyEntryCount } from '@/features/entries/hooks/use-entries';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useAppConfig } from '@/shared/hooks/use-app-config';

/** How many entries a free user has left this budget month. */
export function useEntryAllowance() {
  const { data: profile } = useProfile();
  const { freeMonthlyEntries } = useAppConfig();
  const { data: used = 0 } = useMonthlyEntryCount(profile?.month_start_day ?? 1);
  const unlimited = profile?.plan === 'plus';
  const remaining = unlimited ? Infinity : Math.max(0, freeMonthlyEntries - used);

  return {
    unlimited,
    limit: freeMonthlyEntries,
    remaining,
    canAdd: (count = 1) => unlimited || remaining >= count,
  };
}
