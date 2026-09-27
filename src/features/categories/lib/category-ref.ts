// Entries and limits point at a preset ('transport') or at one of the user's own
// categories (a uuid). The app addresses both with a single category id.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CategoryColumns {
  category_id: string | null;
  preset_id: string | null;
}

/** The columns a category id is stored in. */
export function categoryColumns(id: string | null | undefined): CategoryColumns {
  if (!id) return { category_id: null, preset_id: null };
  return UUID.test(id)
    ? { category_id: id, preset_id: null }
    : { category_id: null, preset_id: id };
}

/** The category id of an entry or limit row. */
export function categoryIdOf(row: CategoryColumns) {
  return row.preset_id ?? row.category_id;
}
