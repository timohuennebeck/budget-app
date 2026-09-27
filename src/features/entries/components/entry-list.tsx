import { router } from 'expo-router';
import { View } from 'react-native';

import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { categoryIdOf } from '@/features/categories/lib/category-ref';
import { formatMoney } from '@/shared/lib/money';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

import type { Entry } from '../data/entries-api';
import { entryAmount, entrySubtitle, entryVisual } from '../lib/entry-display';
import type { DayGroup } from '../lib/entry-stats';
import { EntryRow } from './entry-row';

interface EntryRowsProps {
  entries: Entry[];
  categories: Map<string, CategoryDisplay>;
  currency: string;
  /** Second line; by default the category and time (or "Favorit") */
  subtitle?: (entry: Entry, category: CategoryDisplay | undefined) => string;
}

interface EntryListProps extends Omit<EntryRowsProps, 'entries' | 'subtitle'> {
  groups: DayGroup[];
}

/** One tappable row per entry, opening the entry. */
export function EntryRows({ entries, categories, currency, subtitle }: EntryRowsProps) {
  return entries.map((entry) => {
    const categoryId = categoryIdOf(entry);
    const category = categoryId ? categories.get(categoryId) : undefined;
    return (
      <EntryRow
        key={entry.id}
        {...entryVisual(entry.kind, category)}
        title={entry.title}
        subtitle={subtitle ? subtitle(entry, category) : entrySubtitle(entry, category?.name)}
        amount={entryAmount(entry, currency)}
        onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
      />
    );
  });
}

/** Entries grouped by day: the day and its total above one card per day. */
export function EntryList({ groups, categories, currency }: EntryListProps) {
  return (
    <View className="gap-3">
      {groups.map((group) => (
        <View key={group.key} className="gap-2">
          <View className="flex-row justify-between px-1.5">
            <Text size={13} weight="semibold" className="text-muted">
              {group.label}
            </Text>
            <Text size={13} weight="semibold" className="text-muted">
              {formatMoney(group.total, { currency, signed: true })}
            </Text>
          </View>
          <Card className="py-1">
            <EntryRows entries={group.entries} categories={categories} currency={currency} />
          </Card>
        </View>
      ))}
    </View>
  );
}
