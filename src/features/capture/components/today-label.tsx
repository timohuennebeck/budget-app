import { formatShortDate } from '@/shared/lib/dates';
import { Text } from '@/shared/ui/text';

/** Today's date in the capture headers, e.g. "Do., 25. Sep." */
export function TodayLabel() {
  return (
    <Text size={15} className="text-muted-soft">
      {formatShortDate(new Date())}
    </Text>
  );
}
