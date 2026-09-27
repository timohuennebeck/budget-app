import { router } from 'expo-router';

import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { categoryIdOf } from '@/features/categories/lib/category-ref';
import { EntryRow } from '@/features/entries/components/entry-row';
import type { Entry } from '@/features/entries/data/entries-api';
import { entryAmount, entryVisual } from '@/features/entries/lib/entry-display';
import { formatDayMonth, formatTime } from '@/shared/lib/dates';
import { Card } from '@/shared/ui/card';

interface RecentEntriesProps {
  /** Newest first */
  entries: Entry[];
  categories: Map<string, CategoryDisplay>;
  currency: string;
}

const COUNT = 3;

/** The last three entries on Start, dated instead of grouped by day. */
export function RecentEntries({ entries, categories, currency }: RecentEntriesProps) {
  return (
    <Card className="py-1">
      {entries.slice(0, COUNT).map((entry) => {
        const categoryId = categoryIdOf(entry);
        const category = categoryId ? categories.get(categoryId) : undefined;
        const date = new Date(entry.occurred_at);
        return (
          <EntryRow
            key={entry.id}
            {...entryVisual(entry.kind, category)}
            title={entry.title}
            subtitle={`${formatDayMonth(date)} · ${formatTime(date)}`}
            amount={entryAmount(entry, currency)}
            onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
          />
        );
      })}
    </Card>
  );
}
