import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/lib/supabase';

export interface AppConfig {
  freeMonthlyEntries: number;
  checkInMinEntries: number;
  checkInCloseRatio: number;
  plusPricing: { monthly: number; yearly: number; trialDays: number };
  peerAverages: { monthly: number; categories: Record<string, number> };
  supportEmail: string;
}

// Used until the app_config table has loaded (and when offline).
const defaultAppConfig: AppConfig = {
  freeMonthlyEntries: 15,
  checkInMinEntries: 3,
  checkInCloseRatio: 0.85,
  plusPricing: { monthly: 6.99, yearly: 59.88, trialDays: 7 },
  peerAverages: { monthly: 1150, categories: {} },
  supportEmail: 'hilfe@looop.app',
};

async function fetchAppConfig(): Promise<AppConfig> {
  const { data, error } = await supabase.from('app_config').select('key, value');
  if (error) throw error;
  const values = Object.fromEntries(data.map((row) => [row.key, row.value])) as Record<string, any>;
  const pricing = values.plus_pricing ?? {};

  return {
    freeMonthlyEntries: Number(values.free_monthly_entries ?? defaultAppConfig.freeMonthlyEntries),
    checkInMinEntries: Number(values.check_in_min_entries ?? defaultAppConfig.checkInMinEntries),
    checkInCloseRatio: Number(values.check_in_close_ratio ?? defaultAppConfig.checkInCloseRatio),
    plusPricing: {
      monthly: Number(pricing.monthly ?? defaultAppConfig.plusPricing.monthly),
      yearly: Number(pricing.yearly ?? defaultAppConfig.plusPricing.yearly),
      trialDays: Number(pricing.trial_days ?? defaultAppConfig.plusPricing.trialDays),
    },
    peerAverages: values.peer_averages ?? defaultAppConfig.peerAverages,
    supportEmail: String(values.support_email ?? defaultAppConfig.supportEmail),
  };
}

export function useAppConfig(): AppConfig {
  const { data } = useQuery({
    queryKey: ['app-config'],
    queryFn: fetchAppConfig,
    staleTime: Infinity,
  });
  return data ?? defaultAppConfig;
}
