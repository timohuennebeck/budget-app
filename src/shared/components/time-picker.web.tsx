import { useMemo } from 'react';
import { View } from 'react-native';

import type { TimeValue } from '@/shared/lib/time-value';
import { Text } from '@/shared/ui/text';

import { WheelColumn, WheelFrame } from './wheel-picker';

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  minuteStep?: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

// Web: scroll wheels. iOS and Android use the native picker (time-picker.tsx).
export function TimePicker({ value, onChange, minuteStep = 15 }: TimePickerProps) {
  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, hour) => ({ label: pad(hour), value: hour })),
    [],
  );
  const minutes = useMemo(
    () =>
      Array.from({ length: 60 / minuteStep }, (_, index) => ({
        label: pad(index * minuteStep),
        value: index * minuteStep,
      })),
    [minuteStep],
  );

  return (
    <WheelFrame tone="time">
      <WheelColumn
        tone="time"
        align="end"
        items={hours}
        value={value.hour}
        onChange={(hour) => onChange({ ...value, hour })}
      />
      <View className="w-3.5 items-center justify-center">
        <Text size={27}>:</Text>
      </View>
      <WheelColumn
        tone="time"
        align="start"
        items={minutes}
        value={value.minute}
        onChange={(minute) => onChange({ ...value, minute })}
      />
    </WheelFrame>
  );
}
