import type { IconName } from '@/shared/ui/icon';

export type CategoryKey =
  | 'groceries'
  | 'dining'
  | 'cafe'
  | 'shopping'
  | 'transport'
  | 'drugstore'
  | 'housing'
  | 'health'
  | 'leisure'
  | 'kids'
  | 'fitness'
  | 'travel';

export interface CatalogCategory {
  key: CategoryKey;
  icon: IconName;
  hue: number;
  /** Lower-case words and merchants in all app languages used by the parser */
  keywords: string[];
  /** Pre-selected in onboarding */
  suggested?: boolean;
}

// Built-in categories. Names live in the locale files under `categories.<key>`
// so they follow the app language; hues match the design palette.
export const categoryCatalog: CatalogCategory[] = [
  {
    key: 'groceries',
    icon: 'basket',
    hue: 150,
    suggested: true,
    keywords: [
      'lebensmittel',
      'einkauf',
      'supermarkt',
      'rewe',
      'edeka',
      'lidl',
      'aldi',
      'netto',
      'penny',
      'kaufland',
      'groceries',
      'grocery',
      'supermarket',
      'tesco',
      'migros',
      'coop',
      'mercadona',
      'supermercado',
      'courses',
      'carrefour',
      'spesa',
      'esselunga',
      'mercado',
      'pingo doce',
      'continente',
    ],
  },
  {
    key: 'dining',
    icon: 'fork-knife',
    hue: 55,
    suggested: true,
    keywords: [
      'essen',
      'mittagessen',
      'abendessen',
      'restaurant',
      'pizza',
      'sushi',
      'döner',
      'burger',
      'lieferando',
      'lunch',
      'dinner',
      'takeaway',
      'comida',
      'cena',
      'almuerzo',
      'déjeuner',
      'dîner',
      'pranzo',
      'jantar',
      'almoço',
      'ifood',
    ],
  },
  {
    key: 'cafe',
    icon: 'coffee',
    hue: 75,
    suggested: true,
    keywords: [
      'café',
      'cafe',
      'kaffee',
      'coffee',
      'flat white',
      'latte',
      'cappuccino',
      'espresso',
      'starbucks',
      'bäcker',
      'bakery',
      'caffè',
      'cafezinho',
    ],
  },
  {
    key: 'shopping',
    icon: 'shopping-bag',
    hue: 330,
    suggested: true,
    keywords: [
      'shopping',
      'kleidung',
      'zara',
      'h&m',
      'amazon',
      'zalando',
      'clothes',
      'ropa',
      'vêtements',
      'vestiti',
      'roupa',
      'compras',
    ],
  },
  {
    key: 'transport',
    icon: 'car-simple',
    hue: 255,
    suggested: true,
    keywords: [
      'uber',
      'bolt',
      'taxi',
      'bvg',
      'mvg',
      'bahn',
      'db',
      'zug',
      'bus',
      'tanken',
      'benzin',
      'deutschlandticket',
      'ticket',
      'train',
      'fuel',
      'gas',
      'metro',
      'gasolina',
      'essence',
      'benzina',
      'combustível',
      'transporte',
      'transport',
    ],
  },
  {
    key: 'drugstore',
    icon: 'drop',
    hue: 320,
    keywords: [
      'dm',
      'rossmann',
      'müller',
      'drogerie',
      'drugstore',
      'pharmacy',
      'boots',
      'farmacia',
      'pharmacie',
      'drogaria',
    ],
  },
  {
    key: 'housing',
    icon: 'house-line',
    hue: 20,
    keywords: [
      'miete',
      'strom',
      'internet',
      'wohnen',
      'rent',
      'electricity',
      'alquiler',
      'loyer',
      'affitto',
      'aluguel',
      'renda',
    ],
  },
  {
    key: 'health',
    icon: 'first-aid',
    hue: 20,
    keywords: [
      'apotheke',
      'arzt',
      'gesundheit',
      'doctor',
      'health',
      'médico',
      'médecin',
      'medico',
      'saúde',
      'salud',
      'santé',
      'salute',
    ],
  },
  {
    key: 'leisure',
    icon: 'ticket',
    hue: 280,
    keywords: [
      'kino',
      'konzert',
      'netflix',
      'spotify',
      'freizeit',
      'cinema',
      'movie',
      'concert',
      'cine',
      'ocio',
      'loisirs',
      'cinéma',
      'tempo libero',
      'lazer',
    ],
  },
  {
    key: 'kids',
    icon: 'baby',
    hue: 200,
    keywords: [
      'kita',
      'windeln',
      'spielzeug',
      'kinder',
      'kids',
      'diapers',
      'toys',
      'niños',
      'enfants',
      'bambini',
      'crianças',
    ],
  },
  {
    key: 'fitness',
    icon: 'barbell',
    hue: 180,
    keywords: [
      'gym',
      'fitness',
      'yoga',
      'urban sports',
      'sport',
      'gimnasio',
      'salle',
      'palestra',
      'academia',
    ],
  },
  {
    key: 'travel',
    icon: 'airplane-tilt',
    hue: 230,
    keywords: [
      'flug',
      'flugtickets',
      'hotel',
      'airbnb',
      'urlaub',
      'reise',
      'flight',
      'travel',
      'vuelo',
      'viaje',
      'vol',
      'voyage',
      'volo',
      'viaggio',
      'voo',
      'viagem',
    ],
  },
];

export function findCatalogCategory(key: string | null | undefined) {
  return categoryCatalog.find((category) => category.key === key);
}

/** Icons and hues offered when creating a custom category (2e1). */
export const customIconChoices: IconName[] = [
  'paw-print',
  'airplane-tilt',
  'car',
  'game-controller',
  'heart',
  'gift',
  'books',
  'graduation-cap',
  'music-notes',
  'wrench',
  't-shirt',
  'train',
];

export const customHueChoices = [300, 150, 55, 25, 200, 250];
