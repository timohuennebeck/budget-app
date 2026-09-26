import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

interface ListGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Grouped settings card with an uppercase caption and hairline dividers. */
export function ListGroup({ title, children, className }: ListGroupProps) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className={className}>
      {title ? (
        <Text variant="overline" className="mb-2 px-1">
          {title}
        </Text>
      ) : null}
      <View className="rounded-3xl border border-line bg-surface">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View className="mx-[18px] h-px bg-line" /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  accessory?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

export function ListRow({
  title,
  subtitle,
  value,
  accessory,
  onPress,
  destructive,
  chevron = !destructive,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={title}
      className={cn('flex-row items-center gap-3 px-[18px] py-[15px]', !onPress && 'opacity-100')}>
      <View className="min-w-0 flex-1">
        <Text size={16} weight="medium" className={destructive ? 'text-danger' : undefined}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={13.5} className="mt-0.5 text-subtle">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text size={15} className="text-muted-soft">
          {value}
        </Text>
      ) : null}
      {accessory}
      {chevron ? <Icon name="caret-right" size={11} color={colors.chevron} /> : null}
    </Pressable>
  );
}
