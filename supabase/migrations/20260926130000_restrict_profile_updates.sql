-- The update policy on profiles let a user change every column of their own
-- row, including `plan` (free → plus without paying). Limit the app to the
-- columns it edits; the plan is set by the purchase backend (service role).
revoke update on public.profiles from anon, authenticated;

grant update (
  first_name,
  currency,
  locale,
  birth_date,
  budget_mode,
  monthly_budget,
  month_start_day,
  reminder_enabled,
  reminder_time,
  reminder_repeat,
  onboarded_at
) on public.profiles to authenticated;
