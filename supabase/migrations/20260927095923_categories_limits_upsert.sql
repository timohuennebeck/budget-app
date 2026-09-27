-- The app upserts limits; PostgREST's upsert also sets the conflict columns.
-- RLS keeps profile_id on the owner and the composite FK keeps category_id
-- on their own categories.
grant update (profile_id, category_id, preset_id) on public.categories_limits to authenticated;
