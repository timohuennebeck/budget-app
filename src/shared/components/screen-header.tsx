import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';

export interface ScreenHeaderProps {
  title?: string;
  /** `back` shows a chevron, `close` an ×, `none` hides the button */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  trailing?: ReactNode;
  /** Replaces the centred title, e.g. a progress bar */
  children?: ReactNode;
  translucent?: boolean;
  className?: string;
}

export function ScreenHeader({
  title,
  leading = 'back',
  onLeadingPress,
  trailing,
  children,
  translucent,
  className,
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  const onPress = onLeadingPress ?? (() => router.back());

  return (
    <View className={cn('h-[34px] flex-row items-center gap-3.5', className)}>
      {leading === 'none' ? (
        <View className="w-[34px]" />
      ) : (
        <IconButton
          icon={leading === 'back' ? 'caret-left' : 'x'}
          variant={translucent ? 'translucent' : 'field'}
          iconSize={14}
          accessibilityLabel={leading === 'back' ? t('common.back') : t('common.close')}
          onPress={onPress}
        />
      )}
      {children ?? (
        <View className="flex-1 items-center">
          {title ? (
            <Text size={15} weight="semibold">
              {title}
            </Text>
          ) : null}
        </View>
      )}
      <View className="min-w-[34px] items-end">{trailing}</View>
    </View>
  );
}
