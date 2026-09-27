import { File, Paths } from 'expo-file-system';

import { type WalletPayment, parsePayments } from './wallet-payment';

// Apple Pay payments the "Zahlung eintragen" App Intent noted while the app
// was closed (plugins/capture-intent/LogPaymentIntent.swift writes the file).
const inbox = () => new File(Paths.document, 'wallet-payments.json');

export async function readPayments(): Promise<WalletPayment[]> {
  const file = inbox();
  if (!file.exists) return [];
  try {
    return parsePayments(JSON.parse(await file.text()));
  } catch {
    return [];
  }
}

/** Drops payments once they are saved or discarded. */
export async function removePayments(ids: string[]) {
  if (!ids.length) return;
  const remaining = (await readPayments()).filter((payment) => !ids.includes(payment.id));
  const file = inbox();
  if (remaining.length) file.write(JSON.stringify(remaining));
  else if (file.exists) file.delete();
}
