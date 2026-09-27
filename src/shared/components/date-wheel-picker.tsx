import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import i18n from 'i18next';
import { Platform } from 'react-native';

import { formatDayLabel } from '@/shared/lib/dates';
import { colors } from '@/shared/lib/theme';

import { PickerField } from './picker-field';

interface DateWheelPickerProps {
  value: Date;
  onChange: (value: Date) => void;
  minYear?: number;
  maxYear?: number;
}

// The system date picker: wheels on iOS, a dialog on Android (web has its own
// wheels in date-wheel-picker.web.tsx).
export function DateWheelPicker({
  value,
  onChange,
  minYear = 1930,
  maxYear = new Date().getFullYear(),
}: DateWheelPickerProps) {
  const minimumDate = new Date(minYear, 0, 1);
  const maximumDate = new Date(maxYear, 11, 31);
  const handle = (_event: DateTimePickerEvent, next?: Date) => {
    if (next) onChange(next);
  };

  if (Platform.OS === 'android') {
    return (
      <PickerField
        label={formatDayLabel(value)}
        onPress={() =>
          DateTimePickerAndroid.open({
            value,
            mode: 'date',
            minimumDate,
            maximumDate,
            onChange: handle,
          })
        }
      />
    );
  }
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="spinner"
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      locale={i18n.language}
      themeVariant="light"
      textColor={colors.ink}
      onChange={handle}
      style={{ alignSelf: 'stretch' }}
    />
  );
}
