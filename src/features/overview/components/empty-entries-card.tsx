import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyCard } from '@/shared/components/empty-card';
import { Chip } from '@/shared/ui/chip';

const EXAMPLES = ['12 € Uber', '40 € REWE'];

/** First run on Start (3a): explains capturing and offers examples. */
export function EmptyEntriesCard() {
  const { t } = useTranslation();
  return (
    <EmptyCard
      pose="write"
      title={t('overview.emptyTitle')}
      subtitle={t('overview.emptySubtitle')}
      className="mt-[26px] pb-5">
      <View className="mt-4 flex-row flex-wrap justify-center gap-2">
        {EXAMPLES.map((example) => (
          <Chip
            key={example}
            label={example}
            variant="tint"
            size="sm"
            onPress={() => router.push({ pathname: '/capture', params: { text: example } })}
          />
        ))}
      </View>
    </EmptyCard>
  );
}
