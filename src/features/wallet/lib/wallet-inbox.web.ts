import { type WalletPayment, parsePayments } from './wallet-payment';

// No Apple Pay on web; localStorage stands in so the flow can be tried in
// the browser build.
const KEY = 'looop-wallet-payments';

export async function readPayments(): Promise<WalletPayment[]> {
  try {
    return parsePayments(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

export async function removePayments(ids: string[]) {
  const remaining = (await readPayments()).filter((payment) => !ids.includes(payment.id));
  localStorage.setItem(KEY, JSON.stringify(remaining));
}
