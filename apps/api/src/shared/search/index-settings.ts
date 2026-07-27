import { type Settings } from 'meilisearch';

/**
 * Meilisearch 'products' indeks sozlamalari. docs/05 §4
 */
export const PRODUCTS_INDEX = 'products';

/** Tartib = VAZN: birinchisidagi moslik yuqoriroq baholanadi (§4.2). */
const searchableAttributes = [
  'name_uz',
  'name_ru',
  'name_uzc',
  'skus',
  'brand',
  'category_name_uz',
  'category_name_ru',
  'searchable_tokens', // ataylab past — transliteratsiya orqali moslik
];

/** Facet va filtr uchun. */
const filterableAttributes = [
  'status',
  'category_slug',
  'category_ancestors',
  'brand',
  'color_temperature',
  'socket_type',
  'light_source',
  'mount_type',
  'ip_satisfies',
  'voltage',
  'dimmable',
  'is_fragile',
  'luminous_flux_min',
  'luminous_flux_max',
  'power_min',
  'power_max',
  'cri_max',
];

const sortableAttributes = ['luminous_flux_min', 'power_min', 'cri_max', 'variant_count'];

/**
 * ⚠️ ENG MUHIM: texnik kodlarda typo tolerance ZARAR. "E27" va "E14" orasidagi
 *    Levenshtein 1 — mijoz noto'g'ri lampochka oladi (§4.1).
 */
const typoTolerance = {
  enabled: true,
  minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
  disableOnWords: [
    'e27',
    'e14',
    'gu10',
    'g9',
    'g4',
    'gx53',
    'ip20',
    'ip44',
    'ip54',
    'ip65',
    'ip67',
    'ip68',
    '2700k',
    '3000k',
    '4000k',
    '5000k',
    '6500k',
    '12v',
    '24v',
    '220v',
  ],
  disableOnAttributes: ['skus', 'socket_type', 'ip_satisfies'],
};

const rankingRules = ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'];

/**
 * Sinonimlar — IKKI TOMONLAMA EMAS, ikkalasini ham yozish shart (§4.3).
 * ⚠️ Boshlang'ich ro'yxat — taxmin; real sinonimlar qidiruv loglaridan o'sadi
 *    va admin panelida tahrirlanadi (kodda hardcode emas — hozircha seed).
 */
const synonyms: Record<string, string[]> = {
  qandil: ['люстра', 'lyustra', 'қандил'],
  люстра: ['qandil', 'lyustra', 'қандил'],
  chiroq: ['светильник', 'svetilnik', 'чироқ', 'лампа'],
  светильник: ['chiroq', 'svetilnik', 'лампа'],
  bra: ['бра', 'настенный'],
  spot: ['спот', 'точечный'],
  trek: ['трек', 'трековый'],
  torsher: ['торшер'],
};

export const PRODUCTS_SETTINGS: Settings = {
  searchableAttributes,
  filterableAttributes,
  sortableAttributes,
  typoTolerance,
  rankingRules,
  synonyms,
  // UI'da hech qachon ko'rsatilmaydigan maydonlar javobdan olib tashlanadi.
  displayedAttributes: [
    'id',
    'slug',
    'name_uz',
    'name_uzc',
    'name_ru',
    'brand',
    'category_slug',
    'variant_count',
    'is_fragile',
    'color_temperature',
    'socket_type',
    'ip_satisfies',
    'primary_image',
  ],
};
