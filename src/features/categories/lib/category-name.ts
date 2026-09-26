import { t } from 'i18next';

import { findCatalogCategory } from '../data/category-catalog';

interface NamedCategory {
  key: string | null;
  name: string;
}

// Built-in categories are translated by key so switching the app language
// renames them; custom categories keep the name the user typed.
export function categoryName(category: NamedCategory) {
  if (category.key && findCatalogCategory(category.key)) {
    return t(`categories.${category.key}` as 'categories.groceries');
  }
  return category.name;
}
