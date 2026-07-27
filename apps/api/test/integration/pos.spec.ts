import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { PosService } from '../../src/modules/pos/pos.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { ConflictError } from '../../src/core/errors/domain.error';

/**
 * pos — kassa (docs/15 §10): smena + sotuv (oversell himoyasi reserve→consume) +
 * ledger. Yopilishda kassa farqi (kutilgan = ochilish + naqd sotuvlar).
 */
describe('POS (integration)', () => {
  let h: TestHarness;
  let pos: PosService;
  let inventory: InventoryService;
  let userId: string;
  let warehouseId: string;
  let priceListId: string;

  beforeAll(async () => {
    h = await createHarness();
    pos = h.app.get(PosService);
    inventory = h.app.get(InventoryService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  beforeEach(async () => {
    const user = await h.prisma.user.create({ data: { email: `pos-${randomUUID()}@k.uz`, passwordHash: 'x', status: 'ACTIVE' } });
    const wh = await h.prisma.warehouse.create({ data: { code: `W-${randomUUID()}`, name: { ru: 'Zal' }, isSellable: true, isActive: true } });
    const pl = await h.prisma.priceList.create({ data: { code: `PL-${randomUUID()}`, name: { ru: 'L' } } });
    userId = user.id;
    warehouseId = wh.id;
    priceListId = pl.id;
  });

  const mkVariant = async (amount: bigint, stock: number): Promise<string> => {
    const c = await h.prisma.category.create({ data: { slug: `c-${randomUUID()}`, name: { ru: 'K' }, path: '/c/' } });
    const p = await h.prisma.product.create({ data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'T' }, status: 'ACTIVE' } });
    const v = await h.prisma.productVariant.create({ data: { productId: p.id, sku: `SKU-${randomUUID()}`, axisValues: {} } });
    await h.prisma.price.create({ data: { priceListId, variantId: v.id, amount } });
    await inventory.receive({ variantId: v.id, warehouseId, quantity: stock });
    return v.id;
  };

  it('⚠️ TO‘LIQ OQIM: smena ochish → sotuv (qoldiq kamayadi + ledger) → smena yopish (farq)', async () => {
    const shift = await pos.openShift(userId, 10_000_000n); // 100k so'm kassa
    expect(shift.status).toBe('OPEN');

    const variantId = await mkVariant(50_000_000n, 10); // 500k so'm, 10 dona
    const tx = await pos.createSale({ userId, paymentMethod: 'CASH', warehouseId, items: [{ variantId, quantity: 2 }] });
    expect(tx.totalAmount).toBe(100_000_000n); // 2 × 500k
    expect(tx.items).toHaveLength(1);

    // Qoldiq kamaydi (10 → 8).
    const stock = await inventory.getStock(variantId, warehouseId);
    expect(stock?.onHand).toBe(8);
    expect(stock?.reserved).toBe(0); // consume qildi

    // Ledger muvozanatli (POS sotuvi).
    const entries = await h.prisma.ledgerEntry.findMany({ where: { account: 'revenue.product' } });
    expect(entries.length).toBeGreaterThanOrEqual(1);

    // Smena yopish: kutilgan = 100k so'm ochilish + 1M so'm naqd sotuv = 1.1M so'm
    // (110_000_000 tiyin). Haqiqiy 1.1M → farq 0.
    const closed = await pos.closeShift(shift.id, userId, 110_000_000n);
    expect(closed.status).toBe('CLOSED');
    expect(closed.cashDifferenceAmount).toBe(0n);
  });

  it('⚠️ smenasiz sotuv → rad', async () => {
    const variantId = await mkVariant(50_000_000n, 5);
    await expect(pos.createSale({ userId, paymentMethod: 'CASH', warehouseId, items: [{ variantId, quantity: 1 }] })).rejects.toBeInstanceOf(ConflictError);
  });

  it('⚠️ ikki ochiq smena → rad', async () => {
    await pos.openShift(userId, 0n);
    await expect(pos.openShift(userId, 0n)).rejects.toBeInstanceOf(ConflictError);
  });

  it('⚠️ kassa farqi — kam pul qolsa manfiy', async () => {
    const shift = await pos.openShift(userId, 10_000_000n);
    const variantId = await mkVariant(50_000_000n, 5);
    await pos.createSale({ userId, paymentMethod: 'CASH', warehouseId, items: [{ variantId, quantity: 1 }] });
    // Kutilgan = 100k + 500k = 600k; kassada 550k → farq −50k (kamomad).
    const closed = await pos.closeShift(shift.id, userId, 55_000_000n);
    expect(closed.cashDifferenceAmount).toBe(-5_000_000n);
  });
});
