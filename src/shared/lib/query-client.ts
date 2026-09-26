import { MutationCache, QueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import i18n from '@/shared/i18n';

import { haptics } from './haptics';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** The change was shown before the server confirmed it and got rolled back */
      optimistic?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
  // Optimistic mutations roll themselves back; tell the user it didn't stick.
  mutationCache: new MutationCache({
    onError: (_error, _variables, _context, mutation) => {
      if (!mutation.meta?.optimistic) return;
      haptics.error();
      Alert.alert(i18n.t('common.saveFailedTitle'), i18n.t('common.saveFailedMessage'));
    },
  }),
});
