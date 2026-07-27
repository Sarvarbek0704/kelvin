/**
 * Meilisearch hujjatini mahsulot ma'lumotidan yasash — sof mapping.
 *
 * ⚠️ Hujjat MAHSULOT darajasida, lekin atributlar VARIANTLARdan agregatlanadi:
 *    - `ip_satisfies` = barcha variantlar ipSatisfies BIRLASHMASI (mahsulot IP
 *      filtriga chiqadi, agar HAR QANDAY varianti qanoatlantirsa)
 *    - `color_temperature`, `socket_type` = distinct qiymatlar massivi (facet)
 *    - diapazonli (flux/power) = min/max maydonlar (RANGE filtr)
 *
 * Sof TypeScript (ADR-0001). docs/05-catalog-and-search.md §4
 */
import { expandWritingVariants } from './translit';

interface Loc {
  'uz-Latn'?: string;
  'uz-Cyrl'?: string;
  ru?: string;
}

/** Kartochka rasmi — asosiy media (galereyaning birinchisi). */
export interface IndexableImage {
  readonly url: string;
  /** Responsive variantlar: { "webp_400": "...", "webp_800": "..." }. */
  readonly derivatives: Record<string, string> | null;
  readonly alt: Loc | null;
}

/** Indeksda saqlanadigan rasm — alt tillari yassilangan (name_* bilan bir xil uslub). */
export interface SearchImage {
  readonly url: string;
  readonly derivatives: Record<string, string> | null;
  readonly alt_uz: string;
  readonly alt_ru: string;
}

export interface IndexableVariant {
  readonly sku: string;
  readonly axisValues: Record<string, string>;
  readonly ipSatisfies: readonly string[];
  readonly colorTemperature: number | null;
  readonly socketType: string | null;
  readonly luminousFlux: number | null;
  readonly power: number | null;
  readonly cri: number | null;
  readonly voltage: number | null;
  readonly beamAngle: number | null;
  readonly dimmable: boolean;
  readonly lightSource: string | null;
  readonly mountType: string | null;
}

export interface IndexableProduct {
  readonly id: string;
  readonly slug: string;
  readonly status: string;
  readonly name: Loc;
  readonly brand: string | null;
  readonly isFragile: boolean;
  readonly category: { readonly slug: string; readonly path: string; readonly name: Loc };
  readonly variants: readonly IndexableVariant[];
  /** Asosiy rasm (isPrimary → sortOrder bo'yicha birinchisi); yo'q bo'lsa null. */
  readonly primaryImage: IndexableImage | null;
}

export interface SearchDocument {
  id: string;
  slug: string;
  status: string;
  name_uz: string;
  name_uzc: string;
  name_ru: string;
  brand: string | null;
  category_slug: string;
  category_path: string;
  /** Path bo'ylab barcha ajdod slug'lar — subtree filtri uchun (Meili prefix bilmaydi). */
  category_ancestors: string[];
  category_name_uz: string;
  category_name_ru: string;
  skus: string[];
  /** UI'da HECH QACHON ko'rsatilmaydi — faqat qidiruv uchun. */
  searchable_tokens: string[];
  is_fragile: boolean;
  variant_count: number;
  /** Kartochka rasmi — UI'da ko'rsatiladi, qidiruvda ishtirok etmaydi. */
  primary_image: SearchImage | null;
  // --- Facet maydonlari (variantlardan agregat) ---
  color_temperature: number[];
  socket_type: string[];
  light_source: string[];
  mount_type: string[];
  ip_satisfies: string[];
  voltage: number[];
  dimmable: boolean;
  // --- RANGE maydonlari (min/max) ---
  luminous_flux_min: number | null;
  luminous_flux_max: number | null;
  power_min: number | null;
  power_max: number | null;
  cri_max: number | null;
}

function distinct<T>(values: readonly (T | null)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== null))];
}

function minOf(values: readonly (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length > 0 ? Math.min(...nums) : null;
}

function maxOf(values: readonly (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length > 0 ? Math.max(...nums) : null;
}

function toSearchImage(image: IndexableImage | null): SearchImage | null {
  if (image === null) {
    return null;
  }
  return {
    url: image.url,
    derivatives: image.derivatives,
    alt_uz: image.alt?.['uz-Latn'] ?? '',
    alt_ru: image.alt?.ru ?? '',
  };
}

export function buildSearchDocument(product: IndexableProduct): SearchDocument {
  const v = product.variants;
  const nameUz = product.name['uz-Latn'] ?? '';
  const nameRu = product.name.ru ?? '';
  const catUz = product.category.name['uz-Latn'] ?? '';
  const catRu = product.category.name.ru ?? '';

  // searchable_tokens — nom, brend, kategoriya barcha yozilish variantlari.
  const tokens = new Set<string>();
  for (const source of [nameUz, nameRu, product.brand ?? '', catUz, catRu]) {
    for (const t of expandWritingVariants(source)) {
      tokens.add(t);
    }
  }

  return {
    id: product.id,
    slug: product.slug,
    status: product.status,
    name_uz: nameUz,
    name_uzc: product.name['uz-Cyrl'] ?? '',
    name_ru: nameRu,
    brand: product.brand,
    category_slug: product.category.slug,
    category_path: product.category.path,
    category_ancestors: product.category.path.split('/').filter((s) => s.length > 0),
    category_name_uz: catUz,
    category_name_ru: catRu,
    skus: v.map((x) => x.sku),
    searchable_tokens: [...tokens],
    is_fragile: product.isFragile,
    variant_count: v.length,
    primary_image: toSearchImage(product.primaryImage),
    color_temperature: distinct(v.map((x) => x.colorTemperature)),
    socket_type: distinct(v.map((x) => x.socketType)),
    light_source: distinct(v.map((x) => x.lightSource)),
    mount_type: distinct(v.map((x) => x.mountType)),
    ip_satisfies: [...new Set(v.flatMap((x) => [...x.ipSatisfies]))],
    voltage: distinct(v.map((x) => x.voltage)),
    dimmable: v.some((x) => x.dimmable),
    luminous_flux_min: minOf(v.map((x) => x.luminousFlux)),
    luminous_flux_max: maxOf(v.map((x) => x.luminousFlux)),
    power_min: minOf(v.map((x) => x.power)),
    power_max: maxOf(v.map((x) => x.power)),
    cri_max: maxOf(v.map((x) => x.cri)),
  };
}
