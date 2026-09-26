import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StatusHero } from '@/shared/components/status-hero';
import { Button } from '@/shared/ui/button';

/** No search results (3b) with a shortcut to capture the term as an entry. */
export function EmptySearch({ query, onCapture }: { query: string; onCapture: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-between gap-6 pt-10">
      <StatusHero
        pose="magnifier"
        pipSize={160}
        title={t('entries.noResultsTitle')}
        subtitle={t('entries.noResults', { query })}
      />
      <Button label={t('entries.captureQuery', { query })} onPress={onCapture} />
    </View>
  );
}
