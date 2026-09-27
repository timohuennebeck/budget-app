import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { colors } from '@/shared/lib/theme';

// Each tab wraps itself in TabScreen, which applies the tab bar inset on both
// platforms; iOS would otherwise only inset the first ScrollView and leave
// the capture dock on Start behind the tab bar.
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs tintColor={colors.primary} labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger disableAutomaticContentInsets name="overview">
        <NativeTabs.Trigger.Label>{t('tabs.overview')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
          md={{ default: 'pie_chart', selected: 'pie_chart' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableAutomaticContentInsets name="entries">
        <NativeTabs.Trigger.Label>{t('tabs.entries')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
          md={{ default: 'receipt_long', selected: 'receipt_long' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableAutomaticContentInsets name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md={{ default: 'account_circle', selected: 'account_circle' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
