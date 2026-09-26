import { useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/ui/text';

import { WheelColumn, WheelFrame } from './wheel-picker';

export interface TimeValue {
  hour: number;
  minute: number;
}

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  minuteStep?: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

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

export function parseTime(value: string): TimeValue {
  const [hour, minute] = value.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function formatTimeValue({ hour, minute }: TimeValue) {
  return `${pad(hour)}:${pad(minute)}`;
}
