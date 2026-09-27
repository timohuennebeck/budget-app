import type { ParseKeys } from 'i18next';
import { View } from 'react-native';
import { Trans } from 'react-i18next';

import { Text } from '@/shared/ui/text';

/** Numbered how-to steps; `<b>` in a translation renders bold. */
export function NumberedSteps<Key extends ParseKeys>({ steps }: { steps: readonly Key[] }) {
  return (
    <View className="mt-[22px] gap-3">
      {steps.map((key, index) => (
        <View key={key} className="flex-row items-center gap-3">
          <View className="size-[26px] items-center justify-center rounded-full bg-primary-soft">
            <Text size={13} weight="bold" className="text-primary">
              {index + 1}
            </Text>
          </View>
          <Text size={15} className="flex-1 text-ink-soft">
            <Trans i18nKey={key} components={{ b: <Text size={15} weight="semibold" /> }} />
          </Text>
        </View>
      ))}
    </View>
  );
}
