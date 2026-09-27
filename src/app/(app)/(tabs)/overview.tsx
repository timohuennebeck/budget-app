import { OverviewScreen } from '@/features/overview/components/overview-screen';
import { TabScreen } from '@/shared/components/tab-screen';

export default function OverviewScreenRoute() {
  return (
    <TabScreen>
      <OverviewScreen />
    </TabScreen>
  );
}
