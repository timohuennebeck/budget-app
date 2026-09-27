import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useCaptureStore } from '@/features/capture/data/capture-store';
import { useCaptureCategories } from '@/features/capture/hooks/use-capture-categories';
import { captureHref } from '@/features/capture/lib/capture-routes';
import { useRecentEntries } from '@/features/entries/hooks/use-entries';

import { readPayments } from '../lib/wallet-inbox';
import { paymentDrafts } from '../lib/wallet-payment';

/**
 * Turns Apple Pay payments noted by the Shortcuts automation into drafts and
 * opens the review, when the app starts or comes back to the foreground.
 * Payments stay in the inbox until they are saved or removed, so closing
 * the review brings them back next time.
 */
export function useWalletInbox() {
  const categories = useCaptureCategories('app');
  const { data: recent, isSuccess } = useRecentEntries();
  const latest = useRef({ categories, recent });
  const ready = isSuccess && categories.length > 0;

  useEffect(() => {
    latest.current = { categories, recent };
  });

  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const check = async () => {
      const { categories, recent = [] } = latest.current;
      // Never interrupt a capture that's open, even under /limit.
      if (busy || useCaptureStore.getState().open) return;
      busy = true;
      try {
        const payments = await readPayments();
        if (!payments.length) return;
        const store = useCaptureStore.getState();
        store.start();
        store.addDrafts(paymentDrafts(payments, categories, recent));
        router.push(captureHref('app', 'review'));
      } finally {
        busy = false;
      }
    };
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [ready]);
}
