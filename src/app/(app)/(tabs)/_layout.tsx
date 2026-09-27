import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { colors } from '@/shared/lib/theme';

// Content scrolls behind the tab bar: iOS insets each tab's first ScrollView
// at the bottom, Android pads the tab above the bar.
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs tintColor={colors.primary} labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="overview">
        <NativeTabs.Trigger.Label>{t('tabs.overview')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md={{ default: 'grid_view', selected: 'grid_view' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="entries">
        <NativeTabs.Trigger.Label>{t('tabs.entries')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'book.pages', selected: 'book.pages.fill' }}
          md={{ default: 'menu_book', selected: 'menu_book' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="check-ins">
        <NativeTabs.Trigger.Label>{t('tabs.checkIns')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'calendar.badge.clock', selected: 'calendar.badge.clock' }}
          md={{ default: 'event_upcoming', selected: 'event_upcoming' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md={{ default: 'account_circle', selected: 'account_circle' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
