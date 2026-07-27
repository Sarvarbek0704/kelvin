import { Injectable } from '@nestjs/common';
import {
  type FacetDistribution,
  type FacetStat,
  type SearchItem,
  type SearchResponse,
  type SortOption,
} from '@kelvin/contracts';

import { MeiliService } from '../../shared/search/meili.service';
import { normalizeQuery } from '../../core/search/translit';

export interface SearchQuery {
  q?: string;
  category?: string;
  colorTemperature?: number[];
  socketType?: string[];
  lightSource?: string[];
  mountType?: string[];
  voltage?: number[];
  brand?: string[];
  ip?: string;
  dimmable?: boolean;
  fluxMin?: number;
  fluxMax?: number;
  sort?: SortOption;
  page?: number;
  perPage?: number;
}

/** MULTI facet guruhlari (o'zini istisno qilish uchun kalitlar). */
const MULTI_FACETS = [
  'color_temperature',
  'socket_type',
  'light_source',
  'mount_type',
  'voltage',
  'brand',
] as const;
const ALL_FACETS = [...MULTI_FACETS, 'ip_satisfies', 'dimmable'] as const;

const STAT_FACETS = ['luminous_flux_min', 'luminous_flux_max', 'cri_max'];

/**
 * Mijozga qaytariladigan maydonlar (SearchItem). ⚠️ `searchable_tokens` VA boshqa
 * ichki maydonlar chiqmasligi uchun aniq ro'yxat — hujjatning hammasi emas.
 */
const ITEM_ATTRIBUTES = [
  'id',
  'slug',
  'name_uz',
  'name_ru',
  'brand',
  'category_slug',
  'variant_count',
  'is_fragile',
  'primary_image',
  'color_temperature',
  'socket_type',
  'ip_satisfies',
];

const SORT_MAP: Record<SortOption, string[] | undefined> = {
  relevance: undefined,
  flux_asc: ['luminous_flux_min:asc'],
  flux_desc: ['luminous_flux_max:desc'],
  cri_desc: ['cri_max:desc'],
  new: undefined,
};

@Injectable()
export class SearchService {
  constructor(private readonly meili: MeiliService) {}

  private quote(value: string): string {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  /** Meilisearch filtr bandlarini quradi. `exclude` — o'zini istisno qilish uchun. */
  private buildFilter(q: SearchQuery, exclude?: string): string[] {
    const clauses: string[] = ['status = "ACTIVE"'];

    if (q.category !== undefined) {
      clauses.push(`category_ancestors = ${this.quote(q.category)}`);
    }

    const multi = (
      key: string,
      values: (string | number)[] | undefined,
      numeric: boolean,
    ): void => {
      if (exclude === key || values === undefined || values.length === 0) {
        return;
      }
      const parts = values.map((v) => `${key} = ${numeric ? String(v) : this.quote(String(v))}`);
      clauses.push(`(${parts.join(' OR ')})`);
    };

    multi('color_temperature', q.colorTemperature, true);
    multi('socket_type', q.socketType, false);
    multi('light_source', q.lightSource, false);
    multi('mount_type', q.mountType, false);
    multi('voltage', q.voltage, true);
    multi('brand', q.brand, false);

    // IP — HIERARCHICAL "kamida": materializatsiya orqali contains.
    if (exclude !== 'ip_satisfies' && q.ip !== undefined) {
      clauses.push(`ip_satisfies = ${this.quote(q.ip)}`);
    }
    if (exclude !== 'dimmable' && q.dimmable !== undefined) {
      clauses.push(`dimmable = ${String(q.dimmable)}`);
    }

    // RANGE flux — mahsulot [min,max] oralig'i so'ralgan [a,b] bilan kesishsa.
    if (exclude !== 'luminous_flux') {
      if (q.fluxMin !== undefined) {
        clauses.push(`luminous_flux_max >= ${String(q.fluxMin)}`);
      }
      if (q.fluxMax !== undefined) {
        clauses.push(`luminous_flux_min <= ${String(q.fluxMax)}`);
      }
    }

    return clauses;
  }

  private hasSelection(q: SearchQuery, facet: string): boolean {
    switch (facet) {
      case 'color_temperature':
        return (q.colorTemperature?.length ?? 0) > 0;
      case 'socket_type':
        return (q.socketType?.length ?? 0) > 0;
      case 'light_source':
        return (q.lightSource?.length ?? 0) > 0;
      case 'mount_type':
        return (q.mountType?.length ?? 0) > 0;
      case 'voltage':
        return (q.voltage?.length ?? 0) > 0;
      case 'brand':
        return (q.brand?.length ?? 0) > 0;
      case 'ip_satisfies':
        return q.ip !== undefined;
      case 'dimmable':
        return q.dimmable !== undefined;
      default:
        return false;
    }
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    const page = Math.max(query.page ?? 1, 1);
    const perPage = Math.min(Math.max(query.perPage ?? 24, 1), 96);
    const q = query.q !== undefined ? normalizeQuery(query.q) : '';
    const sort = SORT_MAP[query.sort ?? 'relevance'];

    // 1. Asosiy so'rov — natijalar + total + barcha facet (tanlanmagan guruhlar
    //    uchun to'g'ri) + stats.
    const main = await this.meili.search(q, {
      filter: this.buildFilter(query),
      facets: [...ALL_FACETS, ...STAT_FACETS],
      attributesToRetrieve: ITEM_ATTRIBUTES,
      limit: perPage,
      offset: (page - 1) * perPage,
      ...(sort !== undefined && { sort }),
    });

    const facets: FacetDistribution = { ...(main.facetDistribution ?? {}) };

    // 2. Tanlangan guruhlar uchun o'zini istisno qiluvchi so'rov (§3.1).
    const selected = ALL_FACETS.filter((f) => this.hasSelection(query, f));
    await Promise.all(
      selected.map(async (facet) => {
        const ex = await this.meili.search(q, {
          filter: this.buildFilter(query, facet),
          facets: [facet],
          limit: 0,
        });
        facets[facet] = ex.facetDistribution?.[facet] ?? {};
      }),
    );

    // 3. Facet stats (RANGE sliderlar).
    const facetStats: Record<string, FacetStat> = {};
    const stats = main.facetStats ?? {};
    const fluxMin = stats.luminous_flux_min;
    const fluxMax = stats.luminous_flux_max;
    if (fluxMin !== undefined || fluxMax !== undefined) {
      facetStats.luminous_flux = {
        min: fluxMin?.min ?? 0,
        max: fluxMax?.max ?? fluxMin?.max ?? 0,
      };
    }
    if (stats.cri_max !== undefined) {
      facetStats.cri = { min: stats.cri_max.min, max: stats.cri_max.max };
    }

    return {
      items: main.hits as unknown as SearchItem[],
      total: main.estimatedTotalHits ?? 0,
      page,
      perPage,
      facets,
      facetStats,
    };
  }
}
