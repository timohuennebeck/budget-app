import * as Device from 'expo-device';

// Display corner radius (pt) by iPhone model id, so floating sheets can sit
// concentric with the screen corners. Apple doesn't expose it publicly.
const RADIUS_BY_MODEL: Record<string, number> = {
  // X, XS, XS Max, 11 Pro, 11 Pro Max
  'iPhone10,3': 39,
  'iPhone10,6': 39,
  'iPhone11,2': 39,
  'iPhone11,4': 39,
  'iPhone11,6': 39,
  'iPhone12,3': 39,
  'iPhone12,5': 39,
  // XR, 11
  'iPhone11,8': 41.5,
  'iPhone12,1': 41.5,
  // 12 mini, 13 mini
  'iPhone13,1': 44,
  'iPhone14,4': 44,
  // 12, 12 Pro, 12 Pro Max, 13, 13 Pro, 13 Pro Max, 14, 14 Plus, 16e
  'iPhone13,2': 47.33,
  'iPhone13,3': 47.33,
  'iPhone13,4': 47.33,
  'iPhone14,5': 47.33,
  'iPhone14,2': 47.33,
  'iPhone14,3': 47.33,
  'iPhone14,7': 47.33,
  'iPhone14,8': 47.33,
  'iPhone17,5': 47.33,
  // 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16, 16 Plus
  'iPhone15,2': 55,
  'iPhone15,3': 55,
  'iPhone15,4': 55,
  'iPhone15,5': 55,
  'iPhone16,1': 55,
  'iPhone16,2': 55,
  'iPhone17,3': 55,
  'iPhone17,4': 55,
  // 16 Pro, 16 Pro Max
  'iPhone17,1': 62,
  'iPhone17,2': 62,
};

/** The screen's corner radius; newer, unknown iPhones get the latest value. */
export function displayCornerRadius() {
  const model = Device.modelId ?? '';
  if (model in RADIUS_BY_MODEL) return RADIUS_BY_MODEL[model];
  const major = Number(/^iPhone(\d+),/.exec(model)?.[1]);
  return major >= 18 ? 62 : 55;
}
