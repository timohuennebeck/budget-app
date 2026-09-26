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

function formatter(currency: string, compact: boolean, amount: number) {
  const hideFraction = compact && Number.isInteger(amount);
  return new Intl.NumberFormat(i18n.language || 'de', {
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
export function formatMoneyParts(amount: number, { currency, signed }: FormatOptions): MoneyParts {
  const parts = formatter(currency, false, Math.abs(amount)).formatToParts(Math.abs(amount));
  const splitAt = parts.findIndex((part) => part.type === 'decimal');
  const head = splitAt === -1 ? parts : parts.slice(0, splitAt);
  const tail = splitAt === -1 ? [] : parts.slice(splitAt);

  const currencyFirst = parts[0]?.type === 'currency';
  const whole = head.map((part) => part.value).join('');
  const rest = tail.map((part) => part.value).join('');

  if (currencyFirst) {
    return { whole: signFor(amount, signed) + whole + rest, rest: '' };
  }
  return { whole: signFor(amount, signed) + whole.trim(), rest };
}

export function currencySymbol(currency: string) {
  const parts = new Intl.NumberFormat(i18n.language || 'de', {
    style: 'currency',
    currency,
  }).formatToParts(0);
  return parts.find((part) => part.type === 'currency')?.value ?? currency;
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
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
