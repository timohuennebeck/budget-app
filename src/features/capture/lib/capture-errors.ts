/**
 * parse-capture failures (by HTTP status) where trying again won't help: no
 * account yet, or the daily AI limit. Anything else is worth a retry.
 */
const BLOCKING_ERRORS = { '401': 'account', '429': 'limit' } as const;

export type BlockingError = (typeof BLOCKING_ERRORS)[keyof typeof BLOCKING_ERRORS];

export function blockingError(code: string | undefined): BlockingError | undefined {
  return code ? BLOCKING_ERRORS[code as keyof typeof BLOCKING_ERRORS] : undefined;
}
