import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { addDays, startOfDay } from '@/shared/lib/dates';

/**
 * Today at midnight. Moves on at midnight and when the app comes back to the
 * foreground, so tabs that stay mounted switch to the new day and month.
 */
export function useToday() {
  const [today, setToday] = useState(() => startOfDay(new Date()));
  useEffect(() => {
    const refresh = () => {
      const next = startOfDay(new Date());
      setToday((current) => (next.getTime() === current.getTime() ? current : next));
    };
    const timer = setTimeout(refresh, addDays(today, 1).getTime() - Date.now() + 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [today]);
  return today;
}
