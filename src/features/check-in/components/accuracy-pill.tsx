import { useTranslation } from 'react-i18next';

import { CategoryPill } from '@/features/categories/components/category-pill';
import { useAppConfig } from '@/shared/hooks/use-app-config';

interface AccuracyPillProps {
  /** 0…1, see guessAccuracy */
  accuracy: number;
  size?: 'sm' | 'md';
}

/** Accuracy of a guess: green once it counts as close, orange otherwise. */
export function AccuracyPill({ accuracy, size }: AccuracyPillProps) {
  const { t } = useTranslation();
  const { checkInCloseRatio } = useAppConfig();
  return (
    <CategoryPill
      size={size}
      hue={accuracy >= checkInCloseRatio ? 150 : 25}
      label={t('checkIn.accuracy', { percent: Math.round(accuracy * 100) })}
    />
  );
}
