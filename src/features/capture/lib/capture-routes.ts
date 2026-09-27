import type { Href } from 'expo-router';

import type { CaptureMode } from '../data/capture-store';

type CaptureStep =
  | 'index'
  | 'camera'
  | 'voice'
  | 'processing'
  | 'review'
  | 'edit/[id]'
  | 'select-category'
  | 'saved'
  | 'receipt-error';

// The capture flow runs under /first-entry during onboarding and /capture in
// the app; screens build their links through here.
export function captureHref(
  mode: CaptureMode,
  step: CaptureStep,
  params?: Record<string, string>,
): Href {
  const base = mode === 'onboarding' ? '/first-entry' : '/capture';
  const pathname = step === 'index' ? base : `${base}/${step}`;
  return (params ? { pathname, params } : pathname) as Href;
}
