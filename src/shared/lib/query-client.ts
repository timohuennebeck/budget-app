import { MutationCache, QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
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
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.meta?.optimistic) return;
      // The database enforces the free plan; show the limit screen, not an error.
      if (error.message.includes('entry_limit_reached')) return router.push('/limit');
      haptics.error();
      Alert.alert(i18n.t('common.saveFailedTitle'), i18n.t('common.saveFailedMessage'));
    },
  }),
});
