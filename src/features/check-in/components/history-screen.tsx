import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryPill } from '@/features/categories/components/category-pill';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ListGroup } from '@/shared/components/list-group';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { StatusHero } from '@/shared/components/status-hero';
import { addDays, formatWeekRange, fromISODate } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { Text } from '@/shared/ui/text';

import { useCheckIns } from '../hooks/use-check-ins';
import { guessAccuracy } from '../lib/check-in-window';

/** Past weekly check-ins with guess, actual and accuracy. */
export function HistoryScreen() {
  const { t } = useTranslation();
  const { data: checkIns = [] } = useCheckIns();
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';

  return (
    <Screen scroll>
      <ScreenHeader title={t('checkIn.history')} />
      {checkIns.length === 0 ? (
        <StatusHero
          className="mt-16"
          pose="clock"
          title={t('checkIn.historyEmpty')}
          subtitle={t('checkIn.historyEmptySubtitle')}
        />
      ) : (
        <ListGroup className="mt-6">
          {checkIns.map((checkIn) => {
            const start = fromISODate(checkIn.week_start);
            const accuracy =
              checkIn.guess === null
                ? null
                : Math.round(
                    guessAccuracy(Number(checkIn.guess), Number(checkIn.actual ?? 0)) * 100,
                  );
            return (
              <View key={checkIn.id} className="flex-row items-center gap-3 px-[18px] py-[15px]">
                <View className="flex-1">
                  <Text size={16} weight="medium">
                    {formatWeekRange({ start, end: addDays(start, 7) })}
                  </Text>
                  <Text size={13.5} className="mt-0.5 text-subtle">
                    {checkIn.guess === null
                      ? t('checkIn.skipped')
                      : `${formatMoney(Number(checkIn.guess), { currency, compact: true })} → ${formatMoney(Number(checkIn.actual ?? 0), { currency })}`}
                  </Text>
                </View>
                {accuracy !== null ? (
                  <CategoryPill
                    hue={accuracy >= 85 ? 150 : 25}
                    label={t('checkIn.accuracy', { percent: accuracy })}
                  />
                ) : null}
              </View>
            );
          })}
        </ListGroup>
      )}
    </Screen>
  );
}
