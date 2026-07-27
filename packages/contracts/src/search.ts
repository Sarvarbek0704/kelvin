/**
 * Faceted search — so'rov va javob shakli. docs/05 §3
 */

export type SortOption = 'relevance' | 'flux_asc' | 'flux_desc' | 'cri_desc' | 'new';

/** Kartochka rasmi — asosiy media (alt tillari yassilangan, name_* kabi). */
export interface SearchImage {
  readonly url: string;
  /** Responsive variantlar: { "webp_400": "...", "webp_800": "..." }. */
  readonly derivatives: Record<string, string> | null;
  readonly alt_uz: string;
  readonly alt_ru: string;
}

export interface SearchItem {
  readonly id: string;
  readonly slug: string;
  readonly name_uz: string;
  readonly name_ru: string;
  readonly brand: string | null;
  readonly category_slug: string;
  readonly variant_count: number;
  readonly is_fragile: boolean;
  readonly primary_image: SearchImage | null;
  readonly color_temperature: number[];
  readonly socket_type: string[];
  readonly ip_satisfies: string[];
}

/** Facet qiymati → natijalar soni. */
export type FacetDistribution = Record<string, Record<string, number>>;

export interface FacetStat {
  readonly min: number;
  readonly max: number;
}

export interface SearchResponse {
  readonly items: readonly SearchItem[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  /**
   * Har filtr qiymati uchun natijalar soni. ⚠️ "O'zini istisno qilish":
   * bir atribut ichida o'sha atributning filtri chiqarib tashlanadi (§3.1).
   */
  readonly facets: FacetDistribution;
  /** RANGE sliderlar uchun joriy natijalar chegaralari. */
  readonly facetStats: Record<string, FacetStat>;
}
