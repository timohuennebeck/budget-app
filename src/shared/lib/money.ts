import i18n from 'i18next';

export interface MoneyParts {
  /** Sign and integer part, e.g. "−5.884" */
  whole: string;
  /** Decimal separator, fraction and currency, e.g. ",50 €" */
  rest: string;
}

interface FormatOptions {
  currency: string;
  /** Prefix a sign: "−" for negative values, "+" when `signed` is true */
  signed?: boolean;
  /** Hide ",00" for whole amounts */
  compact?: boolean;
}

const MINUS = '−';

function locale() {
  return i18n.language || 'en';
}

function formatter(currency: string, compact: boolean, amount: number) {
  const hideFraction = compact && Number.isInteger(amount);
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: hideFraction ? 0 : 2,
    maximumFractionDigits: hideFraction ? 0 : 2,
  });
}

function signFor(amount: number, signed?: boolean) {
  if (amount < 0) return MINUS;
  if (signed && amount > 0) return '+';
  return '';
}

export function formatMoney(amount: number, { currency, signed, compact }: FormatOptions) {
  const value = formatter(currency, !!compact, Math.abs(amount)).format(Math.abs(amount));
  return signFor(amount, signed) + value;
}

// Splits "5.884,50 €" into a large whole part and a smaller remainder so the
// hero amounts can render the cents at a reduced size like the design.
// Works on the formatted string: formatToParts isn't reliable in Hermes.
export function formatMoneyParts(amount: number, currency: string): MoneyParts {
  const text = formatter(currency, false, Math.abs(amount)).format(Math.abs(amount));
  const decimal = new Intl.NumberFormat(locale()).format(1.5).charAt(1);
  // The decimal separator is the one followed by the two fraction digits.
  const splitAt = text.search(new RegExp(`\\${decimal}\\d{2}(?!\\d)`));
  const currencyFirst = !/^\d/.test(text);

  if (splitAt === -1 || currencyFirst) return { whole: signFor(amount) + text, rest: '' };
  return { whole: signFor(amount) + text.slice(0, splitAt).trim(), rest: text.slice(splitAt) };
}

// The currencies the app offers; Intl would print "CHF" where the design
// uses "Fr.", and formatToParts isn't reliable in Hermes.
const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr.' };

export function currencySymbol(currency: string) {
  return SYMBOLS[currency] ?? currency;
}

/** Editable amount without currency or grouping: "12,50" (de) or "12.50" (en). */
export function formatAmountInput(amount: number) {
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(amount);
}

// Accepts "12", "12,50", "12.50" and "1.234,56" and returns a number.
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^\d.,-]/g, '');
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSeparator = lastComma > lastDot ? ',' : '.';
  const fraction = cleaned.length - Math.max(lastComma, lastDot) - 1;
  const hasDecimals = Math.max(lastComma, lastDot) !== -1 && fraction > 0 && fraction <= 2;

  let normalized = cleaned;
  if (hasDecimals) {
    const thousands = decimalSeparator === ',' ? /\./g : /,/g;
    normalized = cleaned.replace(thousands, '').replace(decimalSeparator, '.');
  } else {
    normalized = cleaned.replace(/[.,]/g, '');
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? roundMoney(value) : null;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/** Rounds to the nearest multiple of `step`, but never below one step. */
export function roundToStep(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}
