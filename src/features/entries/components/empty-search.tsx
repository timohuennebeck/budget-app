import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StatusHero } from '@/shared/components/status-hero';

/** No search results (3b). */
export function EmptySearch({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 pt-10">
      <StatusHero
        pose="magnifier"
        pipSize={160}
        title={t('entries.noResultsTitle')}
        subtitle={t('entries.noResults', { query })}
      />
    </View>
  );
}
