import { Redirect } from 'expo-router';

import { useAppConfig } from '@/shared/hooks/use-app-config';

import { useCheckInState } from '../hooks/use-check-in-state';
import { FewEntriesScreen } from './few-entries-screen';

/** Entry point: ask to fill gaps first when the week has too few entries. */
export function CheckInGate() {
  const { checkInMinEntries } = useAppConfig();
  const { expenseCount, status, isLoading } = useCheckInState();
  if (isLoading) return null;
  if (status === 'done') return <Redirect href="/check-in/result" />;
  if (expenseCount < checkInMinEntries) return <FewEntriesScreen />;
  return <Redirect href="/check-in/guess" />;
}
