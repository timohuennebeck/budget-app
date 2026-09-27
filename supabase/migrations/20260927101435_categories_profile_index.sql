-- The (profile_id, preset_id) unique key used to cover this foreign key.
create index categories_profile_id_idx on public.categories (profile_id, sort_order);
