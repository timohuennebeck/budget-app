import { useEntriesUsed } from '@/features/entries/hooks/use-entries';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useAppConfig } from '@/shared/hooks/use-app-config';

import { hasPlus } from '../lib/plus';

/** How many entries a free user has left this budget month. */
export function useEntriesAllowance() {
  const { data: profile } = useProfile();
  const { freeEntries } = useAppConfig();
  const { data: used = 0 } = useEntriesUsed(profile?.month_start_day ?? 1);
  const unlimited = hasPlus(profile);
  const remaining = unlimited ? Infinity : Math.max(0, freeEntries - used);

  return {
    unlimited,
    limit: freeEntries,
    remaining,
    canAdd: (count = 1) => unlimited || remaining >= count,
  };
}
