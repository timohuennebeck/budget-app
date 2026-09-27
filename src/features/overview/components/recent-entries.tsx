import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { EntryRows } from '@/features/entries/components/entry-list';
import type { Entry } from '@/features/entries/data/entries-api';
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
      <EntryRows
        entries={entries.slice(0, COUNT)}
        categories={categories}
        currency={currency}
        subtitle={(entry) => {
          const date = new Date(entry.occurred_at);
          return `${formatDayMonth(date)} · ${formatTime(date)}`;
        }}
      />
    </Card>
  );
}
