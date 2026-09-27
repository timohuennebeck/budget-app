-- Covering indexes the performance advisor asked for: the composite
-- (category_id, profile_id) foreign key on entries, and categories.preset_key.
drop index if exists public.entries_category_id_idx;
create index entries_category_idx on public.entries (category_id, profile_id);
create index categories_preset_key_idx on public.categories (preset_key);
