export interface TimeValue {
  hour: number;
  minute: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function parseTime(value: string): TimeValue {
  const [hour, minute] = value.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function formatTimeValue({ hour, minute }: TimeValue) {
  return `${pad(hour)}:${pad(minute)}`;
}
