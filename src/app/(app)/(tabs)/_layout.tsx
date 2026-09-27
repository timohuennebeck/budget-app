import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { colors } from '@/shared/lib/theme';

// Content scrolls behind the tab bar: iOS insets each tab's first ScrollView
// (top and bottom), Android pads the tab above the bar. Floating content
// like the capture dock on Start keeps clear of the bar itself.
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs tintColor={colors.primary} labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="overview">
        <NativeTabs.Trigger.Label>{t('tabs.overview')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
          md={{ default: 'pie_chart', selected: 'pie_chart' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="entries">
        <NativeTabs.Trigger.Label>{t('tabs.entries')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
          md={{ default: 'receipt_long', selected: 'receipt_long' }}
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
