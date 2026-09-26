-- English is the app's source and fallback language, so new profiles
-- default to it instead of German when the sign-up sends no locale.
alter table public.profiles alter column locale set default 'en';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, currency, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'currency', 'EUR'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  );
  return new;
end;
$$;
