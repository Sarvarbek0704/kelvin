import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';
import { SegmentService } from '../../src/modules/crm/segment.service';

/**
 * analytics (ABC/xulosa) + crm segment (RFM) — ORDER_PORT agregatidan (docs/10
 * §9.3, §9.6-9.7). To'langan+ buyurtmalardan hisoblanadi.
 */
describe('Analytics + RFM (integration)', () => {
  let h: TestHarness;
  let analytics: AnalyticsService;
  let segments: SegmentService;

  beforeAll(async () => {
    h = await createHarness();
    analytics = h.app.get(AnalyticsService);
    segments = h.app.get(SegmentService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  /** Mijoz uchun PAID buyurtma (product varianti + total). */
  const mkPaidOrder = async (customerId: string, productId: string, total: bigint): Promise<void> => {
    const v = await h.prisma.productVariant.create({ data: { productId, sku: `SKU-${randomUUID()}`, axisValues: {} } });
    await h.prisma.order.create({
      data: {
        number: `KLV-A-${randomUUID().slice(0, 8)}`,
        customerId,
        status: 'PAID',
        channel: 'ONLINE',
        subtotalAmount: total,
        discountAmount: 0n,
        deliveryAmount: 0n,
        totalAmount: total,
        currency: 'UZS',
        items: { create: { variantId: v.id, sku: v.sku, productName: {}, variantAxis: {}, attributesSnapshot: {}, quantity: 1, unitAmount: total, totalAmount: total, currency: 'UZS' } },
      },
    });
  };

  const mkProduct = async (): Promise<string> => {
    const c = await h.prisma.category.create({ data: { slug: `c-${randomUUID()}`, name: { ru: 'K' }, path: '/c/' } });
    const p = await h.prisma.product.create({ data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'T' }, status: 'ACTIVE' } });
    return p.id;
  };

  it('salesSummary — son/aylanma/o‘rtacha chek', async () => {
    const cust = await h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });
    const prod = await mkProduct();
    await mkPaidOrder(cust.id, prod, 100_000_000n);
    await mkPaidOrder(cust.id, prod, 300_000_000n);

    const s = await analytics.salesSummary();
    expect(s.orderCount).toBeGreaterThanOrEqual(2);
    expect(s.totalRevenue).toBeGreaterThanOrEqual(400_000_000n);
    expect(s.averageOrderValue).toBe(s.totalRevenue / BigInt(s.orderCount));
  });

  it('⚠️ ABC tahlil — mahsulotlar aylanma bo‘yicha A/B/C', async () => {
    const cust = await h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });
    const big = await mkProduct();
    const small = await mkProduct();
    await mkPaidOrder(cust.id, big, 900_000_000n); // katta aylanma → A
    await mkPaidOrder(cust.id, small, 10_000_000n);

    const abc = await analytics.abcAnalysis();
    const bigRow = abc.find((r) => r.productId === big);
    expect(bigRow?.abcClass).toBe('A'); // eng katta → A
    expect(abc.every((r) => ['A', 'B', 'C'].includes(r.abcClass))).toBe(true);
  });

  it('⚠️ RFM recompute — rfm-auto segment a‘zolari (skor bilan)', async () => {
    const c1 = await h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });
    const prod = await mkProduct();
    await mkPaidOrder(c1.id, prod, 500_000_000n);

    const res = await segments.recomputeRfm();
    expect(res.memberCount).toBeGreaterThanOrEqual(1);
    const members = await segments.listMembers(res.segmentId);
    const mine = members.find((m) => m.customerId === c1.id);
    expect(mine?.rfmScore).toMatch(/^\d-\d-\d$/); // "R-F-M"
  });
});
