import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/shared/ui/card';
import { Chip } from '@/shared/ui/chip';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

const EXAMPLES = ['12 € Uber', '40 € REWE'];

/** First run on Start (3a): explains capturing and offers examples. */
export function EmptyEntriesCard() {
  const { t } = useTranslation();
  return (
    <Card className="mt-[26px] items-center rounded-[28px] px-5 pt-[22px] pb-5">
      <Pip pose="write" size={120} />
      <Text variant="heading" className="mt-3">
        {t('overview.emptyTitle')}
      </Text>
      <Text size={15} leading={1.45} className="mt-2 max-w-[280px] text-center text-muted-soft">
        {t('overview.emptySubtitle')}
      </Text>
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
    </Card>
  );
}
