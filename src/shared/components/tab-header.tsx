import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { colors, shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

// The fixed header pieces shared by Einträge and Check-ins: the month pill,
// the big title with its stat, and the row of filter chips.

/** "September ⌄" pill that opens the month sheet. */
export function MonthPill({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="h-10 flex-row items-center px-1">
      <Pressable
        onPress={onPress}
        haptic="none"
        accessibilityLabel={t('entries.chooseMonth')}
        className="flex-row items-center gap-2 rounded-full bg-surface px-3.5 py-[9px]"
        style={shadows.card}>
        <Text size={15} weight="semibold" tracking={-0.01} className="capitalize">
          {label}
        </Text>
        <Icon name="caret-down" size={11} color={colors.primary} />
      </Pressable>
    </View>
  );
}

interface TabTitleProps {
  title: string;
  /** Bold figure after the title, followed by " · count" */
  value?: string;
  count?: number;
}

export function TabTitle({ title, value, count }: TabTitleProps) {
  return (
    <View className="mt-[22px] flex-row items-baseline justify-between px-1">
      <Text size={34} weight="semibold" tracking={-0.04} leading={1.05}>
        {title}
      </Text>
      {value !== undefined ? (
        <Text size={14.5} className="text-muted">
          <Text size={14.5} weight="semibold">
            {value}
          </Text>
          {` · ${count}`}
        </Text>
      ) : null}
    </View>
  );
}

/** Horizontally scrolling filter chips, running edge to edge. */
export function ChipRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('-mx-4', className)}
      // Fixed height: on web a horizontal ScrollView inside a growing
      // column otherwise stretches and pushes the list off-screen.
      style={{ height: 36, flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
      {children}
    </ScrollView>
  );
}
