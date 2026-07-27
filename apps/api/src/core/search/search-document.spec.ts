import { buildSearchDocument, type IndexableProduct } from './search-document';

const variant = (
  over: Partial<IndexableProduct['variants'][number]>,
): IndexableProduct['variants'][number] => ({
  sku: 'X',
  axisValues: {},
  ipSatisfies: [],
  colorTemperature: null,
  socketType: null,
  luminousFlux: null,
  power: null,
  cri: null,
  voltage: null,
  beamAngle: null,
  dimmable: false,
  lightSource: null,
  mountType: null,
  ...over,
});

const product: IndexableProduct = {
  id: 'p1',
  slug: 'aurora',
  status: 'ACTIVE',
  name: { 'uz-Latn': 'Aurora qandil', ru: 'Люстра Aurora' },
  brand: 'Kelvin',
  isFragile: true,
  category: { slug: 'hrustalnye', path: '/lyustry/hrustalnye/', name: { ru: 'Хрустальные' } },
  variants: [
    variant({
      sku: 'AUR-GOLD-6',
      colorTemperature: 3000,
      socketType: 'E27',
      ipSatisfies: ['IP20', 'IP44'],
      luminousFlux: 2000,
      cri: 80,
    }),
    variant({
      sku: 'AUR-CHR-8',
      colorTemperature: 4000,
      socketType: 'E27',
      ipSatisfies: ['IP20'],
      luminousFlux: 3500,
      cri: 90,
      dimmable: true,
    }),
  ],
  primaryImage: {
    url: 'https://cdn.kelvin.uz/aurora.webp',
    derivatives: { webp_400: '.../400.webp', webp_800: '.../800.webp' },
    alt: { 'uz-Latn': 'Aurora qandil', ru: 'Люстра Aurora' },
  },
};

describe('buildSearchDocument', () => {
  const doc = buildSearchDocument(product);

  it('nom va kategoriya maydonlari', () => {
    expect(doc.name_uz).toBe('Aurora qandil');
    expect(doc.name_ru).toBe('Люстра Aurora');
    expect(doc.category_slug).toBe('hrustalnye');
  });

  it('category_ancestors — path segmentlari (subtree filtri)', () => {
    expect(doc.category_ancestors).toEqual(['lyustry', 'hrustalnye']);
  });

  it('color_temperature — distinct massiv (facet)', () => {
    expect(new Set(doc.color_temperature)).toEqual(new Set([3000, 4000]));
  });

  it('socket_type — distinct (takror E27 bir marta)', () => {
    expect(doc.socket_type).toEqual(['E27']);
  });

  it('ip_satisfies — barcha variantlar BIRLASHMASI', () => {
    expect(new Set(doc.ip_satisfies)).toEqual(new Set(['IP20', 'IP44']));
  });

  it('luminous_flux min/max (RANGE)', () => {
    expect(doc.luminous_flux_min).toBe(2000);
    expect(doc.luminous_flux_max).toBe(3500);
  });

  it('cri_max, dimmable (biror variant), variant_count', () => {
    expect(doc.cri_max).toBe(90);
    expect(doc.dimmable).toBe(true);
    expect(doc.variant_count).toBe(2);
  });

  it('searchable_tokens — ko‘p tilli variantlar (UI ko‘rmaydi)', () => {
    // "qandil" lotin va uz-kirill variantlari bo'lishi kerak
    expect(doc.searchable_tokens).toContain('aurora qandil');
    expect(doc.searchable_tokens.some((t) => t.includes('қандил'))).toBe(true);
    expect(doc.skus).toEqual(['AUR-GOLD-6', 'AUR-CHR-8']);
  });

  it('primary_image — url/derivatives saqlanadi, alt tillari yassilanadi', () => {
    expect(doc.primary_image).toEqual({
      url: 'https://cdn.kelvin.uz/aurora.webp',
      derivatives: { webp_400: '.../400.webp', webp_800: '.../800.webp' },
      alt_uz: 'Aurora qandil',
      alt_ru: 'Люстра Aurora',
    });
  });

  it('primary_image — media yo‘q bo‘lsa null', () => {
    const doc2 = buildSearchDocument({ ...product, primaryImage: null });
    expect(doc2.primary_image).toBeNull();
  });
});
