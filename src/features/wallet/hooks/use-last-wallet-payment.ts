import { useQuery } from '@tanstack/react-query';

import { entryQueries } from '@/features/entries/data/entries-queries';

/** When the last Apple Pay payment arrived; proof the automation works. */
export function useLastWalletPayment(enabled = true) {
  return useQuery({ ...entryQueries.lastWallet, enabled });
}
