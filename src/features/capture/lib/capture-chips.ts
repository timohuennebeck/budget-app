// The capture text as chips: finished entries plus the one being typed,
// stored as lines ("40€ Lebensmittel\n12€ Uber\nKaf") so amounts with a
// decimal comma survive. Both parsers split entries on line breaks.

export interface CaptureChips {
  chips: string[];
  current: string;
}

export function splitChips(text: string): CaptureChips {
  const lines = text.split('\n');
  const current = lines.pop() ?? '';
  return { chips: lines.filter((line) => line.trim()), current };
}

export function joinChips({ chips, current }: CaptureChips) {
  return [...chips, current].join('\n');
}

// A comma ends an entry, except right after a digit where it may be a
// decimal comma ("3,50"); that one only counts once a space follows.
function separatorAt(value: string, index: number) {
  if (value[index] !== ',') return false;
  return !/\d/.test(value[index - 1] ?? '') || value[index + 1] === ' ';
}

/** Turns typed or pasted input into chips wherever it has a separator. */
export function addInput(chips: string[], value: string): CaptureChips {
  const next = [...chips];
  let rest = value;
  for (let index = 0; index < rest.length; index++) {
    if (rest[index] === '\n' || separatorAt(rest, index)) {
      const entry = rest.slice(0, index).trim();
      if (entry) next.push(entry);
      rest = rest.slice(index + 1).trimStart();
      index = -1;
    }
  }
  // Leading spaces (", " after a chip) would only get in the way of Backspace.
  return { chips: next, current: rest.trimStart() };
}

/** Plain text (e.g. a prefilled search term) in the chip format. */
export function toCaptureText(value: string) {
  return joinChips(addInput([], value));
}
