import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import i18n from 'i18next';
import { Platform } from 'react-native';

import { colors } from '@/shared/lib/theme';
import { formatTimeValue, type TimeValue } from '@/shared/lib/time-value';

import { PickerField } from './picker-field';

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  minuteStep?: 1 | 5 | 10 | 15 | 30;
}

// The system time picker: wheels on iOS, a dialog on Android (web has its own
// wheels in time-picker.web.tsx).
export function TimePicker({ value, onChange, minuteStep = 15 }: TimePickerProps) {
  const date = new Date(2000, 0, 1, value.hour, value.minute);
  const handle = (_event: DateTimePickerEvent, next?: Date) => {
    if (next) onChange({ hour: next.getHours(), minute: next.getMinutes() });
  };

  if (Platform.OS === 'android') {
    return (
      <PickerField
        label={formatTimeValue(value)}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: date,
            mode: 'time',
            is24Hour: true,
            onChange: handle,
          })
        }
      />
    );
  }
  return (
    <DateTimePicker
      value={date}
      mode="time"
      display="spinner"
      minuteInterval={minuteStep}
      locale={i18n.language}
      themeVariant="light"
      textColor={colors.ink}
      onChange={handle}
      style={{ alignSelf: 'stretch' }}
    />
  );
}
