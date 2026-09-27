import { ProfileScreen } from '@/features/profile/components/profile-screen';
import { TabScreen } from '@/shared/components/tab-screen';

export default function ProfileScreenRoute() {
  return (
    <TabScreen>
      <ProfileScreen />
    </TabScreen>
  );
}
