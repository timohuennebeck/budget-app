import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { useAuth } from '@/features/auth/lib/auth-provider';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { StatusHero } from '@/shared/components/status-hero';
import { InitialAvatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

import { useProfile } from '../hooks/use-profile';

/** Abmelden (2m): staying signed in is the primary action. */
export function LogoutScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const signOut = useSignOut();
  const name = profile?.first_name ?? '';

  return (
    <Screen
      footer={
        <View>
          <Button label={t('profile.staySignedIn')} onPress={() => router.back()} />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('profile.signOut')}
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
        </View>
      }>
      <ScreenHeader title={t('profile.signOut')} />
      <StatusHero
        className="mt-[30px]"
        pose="door-wave"
        pipSize={176}
        title={t('profile.signOutTitle', { name })}
        subtitle={t('profile.signOutSubtitle')}
      />
      <Card className="mt-6 flex-row items-center gap-3 border-line-strong px-[18px] py-4">
        <InitialAvatar name={name} size={44} />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text size={16.5} weight="semibold">
            {name}
          </Text>
          <Text size={14} className="text-muted-soft" numberOfLines={1}>
            {session?.user.email}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
