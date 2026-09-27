import { EntriesScreen } from '@/features/entries/components/entries-screen';
import { TabScreen } from '@/shared/components/tab-screen';

export default function EntriesScreenRoute() {
  return (
    <TabScreen>
      <EntriesScreen />
    </TabScreen>
  );
}
