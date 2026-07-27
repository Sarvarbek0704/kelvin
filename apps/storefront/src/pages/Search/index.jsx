import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components';
import { api, label } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import {
  Container,
  Crumbs,
  Select,
  Skeleton,
  FilterChip,
  Checkbox,
  Toggle,
  Button,
  PageDot,
  IconSearch,
  IconFilter,
  IconClose,
} from '../../components/ui';
import {
  SearchWrap,
  HeadRow,
  ContentGrid,
  Sidebar,
  FilterHead,
  FacetGroup,
  TempFacet,
  RangeWrap,
  Chips,
  ResultsGrid,
  Pager,
  EmptyWrap,
  MobileFilterBar,
  SheetScrim,
  Sheet,
} from './Search.styled';

const IP_ORDER = ['IP20', 'IP44', 'IP54', 'IP65', 'IP67'];
const CT_ORDER = [2700, 3000, 4000, 5000, 6500];

// Filtr param → facet kaliti va sarlavha kaliti (checkbox guruhlari)
const CHECK_FACETS = [
  { param: 'socket', facet: 'socket_type', titleKey: 'search.facet_socket' },
  { param: 'light', facet: 'light_source', titleKey: 'search.facet_light' },
  { param: 'mount', facet: 'mount_type', titleKey: 'search.facet_mount' },
  { param: 'voltage', facet: 'voltage', titleKey: 'search.facet_voltage' },
  { param: 'brand', facet: 'brand', titleKey: 'search.facet_brand' },
];

const SORT_OPTIONS = [
  { value: 'relevance', labelKey: 'search.sort_relevance' },
  { value: 'new', labelKey: 'search.sort_new' },
  { value: 'flux_desc', labelKey: 'search.sort_flux_desc' },
  { value: 'flux_asc', labelKey: 'search.sort_flux_asc' },
  { value: 'cri_desc', labelKey: 'search.sort_cri' },
];

/** Ikki dastali flux (lm) slideri — qo'yib yuborilganda paramga yoziladi. */
function FluxRange({ bounds, valueMin, valueMax, onCommit }) {
  // Ota komponent `key` orqali remount qiladi — sinxron effekt kerak emas.
  const [lo, setLo] = useState(valueMin ?? bounds.min);
  const [hi, setHi] = useState(valueMax ?? bounds.max);

  const span = Math.max(1, bounds.max - bounds.min);
  const pct = (v) => ((v - bounds.min) / span) * 100;
  const commit = () => onCommit(lo, hi);

  return (
    <RangeWrap>
      <div className="track">
        <div className="fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
          onPointerUp={commit}
          onKeyUp={commit}
          aria-label="Световой поток от"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
          onPointerUp={commit}
          onKeyUp={commit}
          aria-label="Световой поток до"
        />
      </div>
      <div className="ends">
        <span>{lo.toLocaleString('ru-RU')} lm</span>
        <span>{hi.toLocaleString('ru-RU')} lm</span>
      </div>
    </RangeWrap>
  );
}

function Search() {
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation();
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const queryString = params.toString();
  const { data, isLoading } = useQuery({
    queryKey: ['search', queryString],
    queryFn: () => api.get(`/search?${queryString}`),
  });

  // Kategoriya nomi (H1) — jonli daraxtdan slug bo'yicha
  const { data: tree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories'),
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === undefined || value === '' || value === null) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const toggleMulti = (key, value) => {
    const current = (params.get(key) ?? '').split(',').filter(Boolean);
    const idx = current.indexOf(String(value));
    if (idx >= 0) current.splice(idx, 1);
    else current.push(String(value));
    setParam(key, current.join(','));
  };

  const isChecked = (key, value) =>
    (params.get(key) ?? '').split(',').filter(Boolean).includes(String(value));

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (params.get('q')) next.set('q', params.get('q'));
    if (params.get('category')) next.set('category', params.get('category'));
    setParams(next);
  };

  const facets = data?.facets ?? {};
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const perPage = data?.perPage ?? 24;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const ctFacet = facets.color_temperature ?? {};
  const ipFacet = facets.ip_satisfies ?? {};
  const dimFacet = facets.dimmable ?? {};
  const fluxBounds = data?.facetStats?.flux;

  // Sarlavha: kategoriya > qidiruv so'zi > umumiy katalog
  const categorySlug = params.get('category');
  const roots = Array.isArray(tree) ? tree : [];
  const category = roots.find((c) => c.slug === categorySlug);
  const title = category
    ? label(category.name)
    : params.get('q')
      ? `«${params.get('q')}»`
      : t('search.all_products');

  // Aktiv filtr chiplari
  const activeChips = [
    ...(params.get('q') ? [{ key: 'q', label: `«${params.get('q')}»`, clear: () => setParam('q', undefined) }] : []),
    ...(params.get('ct') ?? '')
      .split(',')
      .filter(Boolean)
      .map((v) => ({ key: `ct-${v}`, label: `${v}K`, clear: () => toggleMulti('ct', v) })),
    ...(params.get('ip') ? [{ key: 'ip', label: params.get('ip'), clear: () => setParam('ip', undefined) }] : []),
    ...CHECK_FACETS.flatMap(({ param }) =>
      (params.get(param) ?? '')
        .split(',')
        .filter(Boolean)
        .map((v) => ({ key: `${param}-${v}`, label: v, clear: () => toggleMulti(param, v) })),
    ),
    ...(params.get('dim') === '1'
      ? [{ key: 'dim', label: t('search.dimmable'), clear: () => setParam('dim', undefined) }]
      : []),
    ...(params.get('fluxMin') || params.get('fluxMax')
      ? [
          {
            key: 'flux',
            label: 'lm',
            clear: () => {
              setParam('fluxMin', undefined);
              setParam('fluxMax', undefined);
            },
          },
        ]
      : []),
  ];
  const filterCount = activeChips.filter((c) => c.key !== 'q').length;

  // Filtr paneli — desktop sidebar VA mobil sheet ichida bir xil
  const filterPanel = (
    <>
      <FacetGroup>
        <div className="facet-label">{t('search.facet_temp')}</div>
        <TempFacet>
          <div className="swatch-row">
            {CT_ORDER.filter((k) => k in ctFacet || isChecked('ct', k)).map((k) => (
              <button
                key={k}
                type="button"
                className={`swatch${isChecked('ct', k) ? ' active' : ''}`}
                style={{ background: theme.temp[k] ?? theme.color.deep }}
                disabled={(ctFacet[k] ?? 0) === 0 && !isChecked('ct', k)}
                aria-label={`${k}K`}
                aria-pressed={isChecked('ct', k)}
                onClick={() => toggleMulti('ct', k)}
              />
            ))}
          </div>
          <div className="ends">
            <span>2700K</span>
            <span>6500K</span>
          </div>
        </TempFacet>
      </FacetGroup>

      {Object.keys(ipFacet).length > 0 && (
        <FacetGroup>
          <div className="facet-label">
            {t('search.facet_ip')} <span className="hint">{t('search.facet_ip_hint')}</span>
          </div>
          <div className="options">
            {IP_ORDER.filter((ip) => ip in ipFacet).map((ip) => {
              const count = ipFacet[ip] ?? 0;
              const checked = params.get('ip') === ip;
              return (
                <div className="opt-row" key={ip}>
                  <Checkbox
                    checked={checked}
                    disabled={count === 0 && !checked}
                    onChange={() => setParam('ip', checked ? undefined : ip)}
                  >
                    {ip}
                  </Checkbox>
                  <span className={`count${count === 0 ? ' zero' : ''}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </FacetGroup>
      )}

      {CHECK_FACETS.map(({ param, facet, titleKey }) => {
        const dist = facets[facet] ?? {};
        const keys = Object.keys(dist).sort();
        if (keys.length === 0) return null;
        return (
          <FacetGroup key={param}>
            <div className="facet-label">{t(titleKey)}</div>
            <div className="options">
              {keys.map((v) => {
                const count = dist[v] ?? 0;
                const checked = isChecked(param, v);
                return (
                  <div className="opt-row" key={v}>
                    <Checkbox
                      checked={checked}
                      disabled={count === 0 && !checked}
                      onChange={() => toggleMulti(param, v)}
                    >
                      {v}
                    </Checkbox>
                    <span className={`count${count === 0 ? ' zero' : ''}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </FacetGroup>
        );
      })}

      {fluxBounds && fluxBounds.max > fluxBounds.min && (
        <FacetGroup>
          <div className="facet-label">{t('search.facet_flux')}</div>
          <FluxRange
            key={`${params.get('fluxMin') ?? ''}-${params.get('fluxMax') ?? ''}-${fluxBounds.min}-${fluxBounds.max}`}
            bounds={fluxBounds}
            valueMin={params.get('fluxMin') ? Number(params.get('fluxMin')) : undefined}
            valueMax={params.get('fluxMax') ? Number(params.get('fluxMax')) : undefined}
            onCommit={(lo, hi) => {
              const next = new URLSearchParams(params);
              if (lo > fluxBounds.min) next.set('fluxMin', String(lo));
              else next.delete('fluxMin');
              if (hi < fluxBounds.max) next.set('fluxMax', String(hi));
              else next.delete('fluxMax');
              next.delete('page');
              setParams(next);
            }}
          />
        </FacetGroup>
      )}

      <FacetGroup>
        <div className="toggle-row">
          <span>
            {t('search.dimmable')} {dimFacet.true !== undefined && `· ${dimFacet.true}`}
          </span>
          <Toggle
            on={params.get('dim') === '1'}
            label={t('search.dimmable')}
            onChange={(on) => setParam('dim', on ? '1' : undefined)}
          />
        </div>
      </FacetGroup>
    </>
  );

  // Sahifalash tugmalari (1 … n)
  const pageItems = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pageItems.push(i);
    else if (pageItems[pageItems.length - 1] !== '…') pageItems.push('…');
  }

  return (
    <Container>
      <SearchWrap>
        <HeadRow>
          <div className="crumbs-row">
            <Crumbs>
              <Link to="/">{t('common.home')}</Link>
              <span>/</span>
              <Link to="/catalog">{t('nav.catalog')}</Link>
              <span>/</span>
              <span className="current">{title}</span>
            </Crumbs>
          </div>
          <div className="title-row">
            <div>
              <h1>{title}</h1>
              <div className="count">
                {isLoading ? t('product.loading') : t('search.found', { count: total })}
              </div>
            </div>
            <div className="sort">
              {t('search.sort')}
              <Select
                value={params.get('sort') ?? 'relevance'}
                onChange={(e) =>
                  setParam('sort', e.target.value === 'relevance' ? undefined : e.target.value)
                }
                aria-label={t('search.sort')}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="bar" />
        </HeadRow>

        <ContentGrid>
          <Sidebar>
            <FilterHead>
              <div className="title">{t('search.filters')}</div>
              <button type="button" onClick={clearFilters}>
                {t('search.reset')}
              </button>
            </FilterHead>
            {filterPanel}
          </Sidebar>

          <div>
            {activeChips.length > 0 && (
              <Chips>
                {activeChips.map((chip) => (
                  <FilterChip key={chip.key} type="button" onClick={chip.clear}>
                    {chip.label} <span className="x">×</span>
                  </FilterChip>
                ))}
                <button type="button" className="clear" onClick={clearFilters}>
                  {t('search.clear_all')}
                </button>
              </Chips>
            )}

            {isLoading ? (
              <ResultsGrid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton $h="0" style={{ aspectRatio: '4 / 5', height: 'auto' }} $r="14px" />
                    <Skeleton $w="45%" $h="10px" style={{ margin: '12px 0' }} />
                    <Skeleton $w="80%" $h="18px" />
                  </div>
                ))}
              </ResultsGrid>
            ) : items.length === 0 ? (
              <EmptyWrap>
                <div className="icon">
                  <IconSearch size={34} />
                </div>
                <div className="title">{t('search.empty_title')}</div>
                <div className="text">
                  {filterCount > 0 ? t('search.empty_filters') : t('search.empty_query')}
                </div>
                <div className="actions">
                  {filterCount > 0 && (
                    <Button type="button" $size="sm" onClick={clearFilters}>
                      {t('search.reset_all')}
                    </Button>
                  )}
                  <Button type="button" $size="sm" $variant="outline" as={Link} to="/catalog">
                    {t('common.to_catalog')}
                  </Button>
                </div>
              </EmptyWrap>
            ) : (
              <ResultsGrid>
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    slug={p.slug}
                    name={label({ ru: p.name_ru, 'uz-Latn': p.name_uz })}
                    brand={p.brand}
                    image={p.primary_image}
                    temps={(p.color_temperature ?? []).slice(0, 3)}
                  />
                ))}
              </ResultsGrid>
            )}

            {totalPages > 1 && (
              <Pager>
                <PageDot
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setParam('page', String(page - 1))}
                  aria-label="Назад"
                >
                  ‹
                </PageDot>
                {pageItems.map((p, i) =>
                  p === '…' ? (
                    <span className="dots" key={`dots-${i}`}>
                      …
                    </span>
                  ) : (
                    <PageDot
                      key={p}
                      type="button"
                      $active={p === page}
                      onClick={() => p !== page && setParam('page', String(p))}
                    >
                      {p}
                    </PageDot>
                  ),
                )}
                <PageDot
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setParam('page', String(page + 1))}
                  aria-label="Вперёд"
                >
                  ›
                </PageDot>
              </Pager>
            )}
          </div>
        </ContentGrid>
      </SearchWrap>

      <MobileFilterBar>
        <button type="button" onClick={() => setSheetOpen(true)}>
          <IconFilter size={18} />
          {t('search.filter')}
          {filterCount > 0 && ` (${filterCount})`}
          <span className="sep" />
          {t('search.show')} {total}
        </button>
      </MobileFilterBar>

      <SheetScrim $open={sheetOpen} onClick={() => setSheetOpen(false)} />
      <Sheet $open={sheetOpen} aria-hidden={!sheetOpen}>
        <div className="grip">
          <span />
        </div>
        <div className="sheet-head">
          <div className="title">{t('search.filters')}</div>
          <button type="button" aria-label="✕" onClick={() => setSheetOpen(false)}>
            <IconClose size={22} />
          </button>
        </div>
        <div className="sheet-body">{filterPanel}</div>
        <div className="sheet-foot">
          <Button type="button" $variant="outline" onClick={clearFilters}>
            {t('search.reset')}
          </Button>
          <Button type="button" className="show" onClick={() => setSheetOpen(false)}>
            {t('search.show')} {total}
          </Button>
        </div>
      </Sheet>
    </Container>
  );
}

export default Search;
