import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { PricingService } from '../../src/modules/pricing/pricing.service';

/**
 * pricing — bazaviy narx yechish (PriceList priority/validity/tier) + Discount →
 * qoida + DETERMINIZM (docs/07 §7). Sof dvigatel core unit'da; bu yerda DB'dan
 * yechish va Discount mapping tekshiriladi.
 */
describe('Pricing (integration)', () => {
  let h: TestHarness;
  let pricing: PricingService;
  const at = new Date('2026-01-15T10:00:00Z');
  let variantId: string;
  let categoryId: string;

  beforeAll(async () => {
    h = await createHarness();
    pricing = h.app.get(PricingService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  beforeEach(async () => {
    const cat = await h.prisma.category.create({
      data: { slug: `c-${randomUUID()}`, name: { ru: 'Кат' }, path: '/c/' },
    });
    const product = await h.prisma.product.create({
      data: { categoryId: cat.id, slug: `p-${randomUUID()}`, name: { ru: 'Тов' }, status: 'ACTIVE' },
    });
    const variant = await h.prisma.productVariant.create({
      data: { productId: product.id, sku: `SKU-${randomUUID()}`, axisValues: {} },
    });
    categoryId = cat.id;
    variantId = variant.id;
  });

  const makeList = (priority: number, extra: Record<string, unknown> = {}): Promise<{ id: string }> =>
    h.prisma.priceList.create({
      data: { code: `PL-${randomUUID()}`, name: { ru: 'Список' }, priority, ...extra },
    });

  it('bazaviy narx: subtotal = unitPrice × qty', async () => {
    const pl = await makeList(0);
    await h.prisma.price.create({
      data: { priceListId: pl.id, variantId, amount: 120_000_000n },
    });

    const priced = await pricing.priceCart({ lines: [{ variantId, quantity: 2 }], at });
    expect(priced.subtotal).toBe(240_000_000n);
    expect(priced.totalAmount).toBe(240_000_000n);
  });

  it('PriceList priority — yuqorisi g‘olib', async () => {
    const low = await makeList(0);
    const high = await makeList(10);
    await h.prisma.price.create({ data: { priceListId: low.id, variantId, amount: 100_000_000n } });
    await h.prisma.price.create({ data: { priceListId: high.id, variantId, amount: 90_000_000n } });

    const priced = await pricing.priceCart({ lines: [{ variantId, quantity: 1 }], at });
    expect(priced.totalAmount).toBe(90_000_000n); // high priority ro'yxat
  });

  it('ulgurji tier — miqdorga mos eng yuqori minQuantity', async () => {
    const pl = await makeList(0);
    await h.prisma.price.create({ data: { priceListId: pl.id, variantId, amount: 100_000_000n, minQuantity: 1 } });
    await h.prisma.price.create({ data: { priceListId: pl.id, variantId, amount: 80_000_000n, minQuantity: 10 } });

    const one = await pricing.priceCart({ lines: [{ variantId, quantity: 5 }], at });
    expect(one.lines[0]?.unitPrice).toBe(100_000_000n); // 5 < 10 → tier 1

    const bulk = await pricing.priceCart({ lines: [{ variantId, quantity: 12 }], at });
    expect(bulk.lines[0]?.unitPrice).toBe(80_000_000n); // 12 >= 10 → ulgurji
  });

  it('validity oynasi — muddati o‘tgan ro‘yxat ishlatilmaydi', async () => {
    const expired = await makeList(100, {
      validFrom: new Date('2020-01-01'),
      validTo: new Date('2020-12-31'),
    });
    const current = await makeList(0);
    await h.prisma.price.create({ data: { priceListId: expired.id, variantId, amount: 1n } });
    await h.prisma.price.create({ data: { priceListId: current.id, variantId, amount: 90_000_000n } });

    const priced = await pricing.priceCart({ lines: [{ variantId, quantity: 1 }], at });
    expect(priced.totalAmount).toBe(90_000_000n); // muddati o'tgan (priority 100) e'tiborga olinmaydi
  });

  it('foizli Discount qo‘llanadi (PROMO_CODE — kod mos kelsagina)', async () => {
    const pl = await makeList(0);
    await h.prisma.price.create({ data: { priceListId: pl.id, variantId, amount: 120_000_000n } });
    await h.prisma.discount.create({
      data: { code: 'KELVIN10', name: { ru: '-10%' }, kind: 'PERCENTAGE', value: 1000n },
    });

    const noCode = await pricing.priceCart({ lines: [{ variantId, quantity: 1 }], at });
    expect(noCode.totalAmount).toBe(120_000_000n); // kod yo'q → qo'llanmaydi

    const withCode = await pricing.priceCart({
      lines: [{ variantId, quantity: 1 }],
      at,
      promoCode: 'KELVIN10',
    });
    expect(withCode.totalAmount).toBe(108_000_000n); // -10%
    expect(withCode.trace.some((t) => t.ruleId !== 'base' && t.delta < 0n)).toBe(true);
  });

  it('kategoriya aksiyasi — savatda shu kategoriya bo‘lsa qo‘llanadi', async () => {
    const pl = await makeList(0);
    await h.prisma.price.create({ data: { priceListId: pl.id, variantId, amount: 100_000_000n } });
    await h.prisma.discount.create({
      data: {
        name: { ru: 'Кат -20%' },
        kind: 'PERCENTAGE',
        value: 2000n,
        conditions: { categoryIds: [categoryId] },
      },
    });

    const priced = await pricing.priceCart({
      lines: [{ variantId, quantity: 1 }],
      at,
      categoryIdByVariant: { [variantId]: categoryId },
    });
    expect(priced.totalAmount).toBe(80_000_000n); // -20%
  });

  it('narx yo‘q variant → NotFoundError', async () => {
    await expect(pricing.priceCart({ lines: [{ variantId, quantity: 1 }], at })).rejects.toThrow();
  });

  it('DETERMINIZM: bir xil savat → bir xil narx (20 marta, DB orqali)', async () => {
    const pl = await makeList(0);
    await h.prisma.price.create({ data: { priceListId: pl.id, variantId, amount: 123_456_700n } });
    await h.prisma.discount.create({
      data: { name: { ru: '-7%' }, kind: 'PERCENTAGE', value: 700n },
    });

    const results = await Promise.all(
      Array.from({ length: 20 }, () => pricing.priceCart({ lines: [{ variantId, quantity: 3 }], at })),
    );
    const first = results[0]!.totalAmount;
    for (const r of results) {
      expect(r.totalAmount).toBe(first);
    }
  });
});
