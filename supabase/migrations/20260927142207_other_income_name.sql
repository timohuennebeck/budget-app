-- "Sonstiges" existed for both expenses and income, so lists that show both
-- kinds (the Einträge filter chips) had it twice. The income one now says so.
update public.categories_presets set names = '{"de": "Sonstige Einnahmen", "en": "Other income", "es": "Otros ingresos", "fr": "Autres revenus", "it": "Altre entrate", "pt": "Outros rendimentos", "pt-BR": "Outras receitas"}'::jsonb
where id = 'other_income';
