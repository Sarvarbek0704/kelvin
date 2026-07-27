import { createHarness, type TestHarness } from './helpers/harness';

/**
 * DB darajasidagi invariantlar — trigger va CHECK constraint.
 *
 * "Haqiqiy kafolat — constraint, test emas." Bu test constraint'ning
 * O'ZINI tekshiradi. docs/14-testing-strategy.md §4.3, docs/11 §11
 */
describe('DB invariantlari (integration)', () => {
  let h: TestHarness;

  beforeAll(async () => {
    h = await createHarness();
  });

  afterAll(async () => {
    await h.teardown();
  });

  it('audit_logs — UPDATE va DELETE trigger bilan bloklanadi (immutable)', async () => {
    const log = await h.prisma.auditLog.create({
      data: { action: 'TEST_ACTION', resourceType: 'Test' },
    });

    await expect(
      h.prisma.auditLog.update({ where: { id: log.id }, data: { action: 'TAMPERED' } }),
    ).rejects.toThrow();

    await expect(h.prisma.auditLog.delete({ where: { id: log.id } })).rejects.toThrow();

    // Yozuv o'zgarmagan.
    const still = await h.prisma.auditLog.findUnique({ where: { id: log.id } });
    expect(still?.action).toBe('TEST_ACTION');
  });

  it('stock_items — manfiy qoldiq CHECK constraint bilan bloklanadi', async () => {
    const category = await h.prisma.category.create({
      data: { slug: `cat-${Date.now().toString()}`, name: { ru: 'X' }, path: '/x/' },
    });
    const product = await h.prisma.product.create({
      data: { categoryId: category.id, slug: `p-${Date.now().toString()}`, name: { ru: 'P' } },
    });
    const variant = await h.prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-${Date.now().toString()}`,
        axisValues: {},
        ipSatisfies: [],
      },
    });
    const warehouse = await h.prisma.warehouse.create({
      data: { code: `W-${Date.now().toString()}`, name: { ru: 'W' } },
    });
    const stock = await h.prisma.stockItem.create({
      data: { variantId: variant.id, warehouseId: warehouse.id, onHand: 5, reserved: 0 },
    });

    // on_hand manfiy → CHECK buzadi.
    await expect(
      h.prisma.stockItem.update({ where: { id: stock.id }, data: { onHand: -1 } }),
    ).rejects.toThrow();

    // reserved > on_hand → CHECK buzadi.
    await expect(
      h.prisma.stockItem.update({ where: { id: stock.id }, data: { reserved: 99 } }),
    ).rejects.toThrow();
  });
});
