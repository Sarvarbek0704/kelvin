import { type Server } from 'node:http';
import request from 'supertest';

import { createHarness, type TestHarness } from './helpers/harness';
import { MeiliService } from '../../src/shared/search/meili.service';
import { SearchIndexerService } from '../../src/modules/catalog/product/search-indexer.service';
import { computeIpSatisfies } from '../../src/core/catalog/ip-rating';

/**
 * Faceted qidiruv — REAL PostgreSQL + Meilisearch.
 * Indekslash, facet count, IP filtr (materializatsiya), o'zini istisno qilish.
 * docs/05-catalog-and-search.md §3, §4
 */
describe('Search (integration, Meilisearch)', () => {
  let h: TestHarness;

  beforeAll(async () => {
    h = await createHarness({ search: true });

    const cat = await h.prisma.category.create({
      data: { slug: 'lyustry', name: { ru: 'Люстры' }, path: '/lyustry/' },
    });

    // A: 3000K, E27, IP65 (→ IP44 ni qanoatlantiradi)
    const a = await h.prisma.product.create({
      data: {
        categoryId: cat.id,
        slug: 'aurora',
        name: { 'uz-Latn': 'Aurora qandil', ru: 'Люстра Aurora' },
        status: 'ACTIVE',
      },
    });
    await h.prisma.productVariant.create({
      data: {
        productId: a.id,
        sku: 'AUR-1',
        axisValues: {},
        colorTemperature: 3000,
        socketType: 'E27',
        ipRating: 'IP65',
        ipSatisfies: computeIpSatisfies('IP65'),
      },
    });

    // B: 4000K, GU10, IP20 (IP44 ni QANOATLANTIRMAYDI)
    const b = await h.prisma.product.create({
      data: {
        categoryId: cat.id,
        slug: 'bolt',
        name: { 'uz-Latn': 'Bolt spot', ru: 'Спот Bolt' },
        status: 'ACTIVE',
      },
    });
    await h.prisma.productVariant.create({
      data: {
        productId: b.id,
        sku: 'BLT-1',
        axisValues: {},
        colorTemperature: 4000,
        socketType: 'GU10',
        ipRating: 'IP20',
        ipSatisfies: computeIpSatisfies('IP20'),
      },
    });

    // A uchun asosiy rasm (B rasmsiz — primary_image null bo'lishini tekshiramiz).
    await h.prisma.media.create({
      data: {
        productId: a.id,
        kind: 'IMAGE',
        url: 'https://cdn.kelvin.uz/aurora.webp',
        derivatives: { webp_400: 'https://cdn.kelvin.uz/aurora-400.webp' },
        alt: { 'uz-Latn': 'Aurora qandil', ru: 'Люстра Aurora' },
        isPrimary: true,
      },
    });

    const indexer = h.app.get(SearchIndexerService);
    await indexer.indexProduct(a.id);
    await indexer.indexProduct(b.id);
    await h.app.get(MeiliService).waitForTasks();
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const agent = (): request.Agent => request(h.app.getHttpServer() as Server);

  it('bo‘sh so‘rov — barcha ACTIVE mahsulotlar + facet', async () => {
    const res = await agent().get('/api/v1/search');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.facets.color_temperature).toEqual({ '3000': 1, '4000': 1 });
    expect(res.body.facets.socket_type.E27).toBe(1);
  });

  it('matn qidiruvi (nom bo‘yicha)', async () => {
    const res = await agent().get('/api/v1/search?q=aurora');
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('aurora');
  });

  it('primary_image — rasmli mahsulot rasmni qaytaradi, rasmsizi null', async () => {
    const res = await agent().get('/api/v1/search?q=aurora');
    expect(res.body.items[0].primary_image).toEqual({
      url: 'https://cdn.kelvin.uz/aurora.webp',
      derivatives: { webp_400: 'https://cdn.kelvin.uz/aurora-400.webp' },
      alt_uz: 'Aurora qandil',
      alt_ru: 'Люстра Aurora',
    });
    const resB = await agent().get('/api/v1/search?q=bolt');
    expect(resB.body.items[0].primary_image).toBeNull();
  });

  it('⚠️ searchable_tokens mijozga chiqmaydi (attributesToRetrieve)', async () => {
    const res = await agent().get('/api/v1/search?q=aurora');
    expect(res.body.items[0].searchable_tokens).toBeUndefined();
    expect(res.body.items[0].name_uzc).toBeUndefined();
  });

  it('color_temperature filtri (MULTI)', async () => {
    const res = await agent().get('/api/v1/search?ct=3000');
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('aurora');
  });

  it('⚠️ IP filtr materializatsiyasi: ip=IP44 → faqat IP65 mahsulot', async () => {
    const res = await agent().get('/api/v1/search?ip=IP44');
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('aurora');
    // IP67 talabini HECH BIRI qanoatlantirmaydi (IP65 ⊉ IP67)
    const res67 = await agent().get('/api/v1/search?ip=IP67');
    expect(res67.body.total).toBe(0);
  });

  it('⚠️ O‘ZINI ISTISNO QILISH: ct=3000 tanlansa ham facet 4000 ni ko‘rsatadi', async () => {
    const res = await agent().get('/api/v1/search?ct=3000');
    // Natijalar faqat 3000, LEKIN facet count 4000 ni ham ko'rsatadi
    // ("3000 ni yechib 4000 tanlasam nechta?" = 1). §3.1
    expect(res.body.facets.color_temperature).toEqual({ '3000': 1, '4000': 1 });
    // socket_type esa joriy filtr (ct=3000) doirasida — faqat E27
    expect(res.body.facets.socket_type).toEqual({ E27: 1 });
  });

  it('kategoriya subtree filtri', async () => {
    const res = await agent().get('/api/v1/search?category=lyustry');
    expect(res.body.total).toBe(2);
    const none = await agent().get('/api/v1/search?category=nonexistent');
    expect(none.body.total).toBe(0);
  });

  it('⚠️ reindexAll — indeks yo‘qolsa PostgreSQL’dan qayta quriladi (docs/05 §3.3)', async () => {
    const meili = h.app.get(MeiliService);
    const indexer = h.app.get(SearchIndexerService);

    // Indeksni tozalash → qidiruv bo'sh.
    await meili.clear();
    await meili.waitForTasks();
    expect((await agent().get('/api/v1/search')).body.total).toBe(0);

    // Qayta qurish → ikkala ACTIVE mahsulot qaytadi.
    const result = await indexer.reindexAll();
    expect(result.indexed).toBe(2);
    await meili.waitForTasks();
    expect((await agent().get('/api/v1/search')).body.total).toBe(2);
  });
});
