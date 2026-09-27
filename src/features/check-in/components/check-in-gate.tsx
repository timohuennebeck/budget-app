import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

import { useAppConfig } from '@/shared/hooks/use-app-config';

import { useCheckInState } from '../hooks/use-check-in-state';
import { FewEntriesScreen } from './few-entries-screen';

/** Entry point: ask to fill gaps first when the week has too few entries. */
export function CheckInGate() {
  const { checkInMinEntries } = useAppConfig();
  const { expenseCount, status, isLoading } = useCheckInState();
  // A late notification tap finds no open check-in; the tab shows when the
  // next one opens instead of saving a guess for an unfinished week.
  const closed = status === 'locked' || status === 'missed';
  useEffect(() => {
    if (!isLoading && closed) router.dismissTo('/check-ins');
  }, [isLoading, closed]);

  if (isLoading || closed) return null;
  if (status === 'done') return <Redirect href="/check-in/result" />;
  if (expenseCount < checkInMinEntries) return <FewEntriesScreen />;
  return <Redirect href="/check-in/guess" />;
}
