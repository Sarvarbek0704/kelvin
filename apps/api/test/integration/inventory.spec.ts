import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { InsufficientStockError, NotFoundError } from '../../src/core/errors/domain.error';

/**
 * inventory — oversell'ga qarshi eng nozik test (docs/06 §2, docs/14 §4.3).
 *
 * ⚠️ Yuragi: 100 parallel rezerv, 1 tovar → ANIQ 1 muvaffaqiyat. Bu test
 *    atomik shartli UPDATE to'g'ri ishlashini REAL PostgreSQL bilan isbotlaydi
 *    (mock DB race'ni ko'rsatmaydi).
 */
describe('Inventory (integration, oversell)', () => {
  let h: TestHarness;
  let inventory: InventoryService;
  let variantId: string;
  let warehouseId: string;

  beforeAll(async () => {
    h = await createHarness();
    inventory = h.app.get(InventoryService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  // Har testda toza variant + ombor (izolyatsiya).
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
    const warehouse = await h.prisma.warehouse.create({
      data: { code: `W-${randomUUID()}`, name: { ru: 'Склад' } },
    });
    variantId = variant.id;
    warehouseId = warehouse.id;
  });

  it('listWarehouses — faol omborlar (tanlash ro‘yxati)', async () => {
    const list = await inventory.listWarehouses();
    expect(list.map((w) => w.id)).toContain(warehouseId);
  });

  it('stats — kam qoldiq (available ≤ reorderPoint) sanaladi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 3 });
    // reorderPoint = 5, available = 3 → kam qoldiq.
    await h.prisma.stockItem.update({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      data: { reorderPoint: 5 },
    });
    const stats = await inventory.stats();
    expect(stats.totalItems).toBeGreaterThanOrEqual(1);
    expect(stats.lowStock).toBeGreaterThanOrEqual(1);
  });

  it('listStockOverview — boyitilgan qatorlar (sku/ombor) + available hisobi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 10 });
    await inventory.reserve({ variantId, warehouseId, quantity: 3, cartId: randomUUID() });

    const page = await inventory.listStockOverview({ warehouseId, limit: 50 });
    const row = page.items.find((r) => r.variantId === variantId);
    expect(row).toBeDefined();
    expect(row?.sku).toMatch(/^SKU-/);
    expect(row?.warehouseCode).toMatch(/^W-/);
    expect(row?.onHand).toBe(10);
    expect(row?.reserved).toBe(3);
    expect(row?.available).toBe(7); // onHand - reserved (saqlanmaydi)
  });

  it('⚠️ 100 parallel rezerv, 1 tovar → ANIQ 1 muvaffaqiyat (oversell yo‘q)', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 1 });

    const N = 100;
    const results = await Promise.allSettled(
      Array.from({ length: N }, () =>
        inventory.reserve({ variantId, warehouseId, quantity: 1, cartId: randomUUID() }),
      ),
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(N - 1);

    // ⚠️ Rad etilganlar TO'G'RI sabab bilan — deadlock/timeout emas.
    for (const f of failed) {
      expect(f.reason).toBeInstanceOf(InsufficientStockError);
    }

    // Yakuniy holat: on_hand=1, reserved=1, available=0.
    const item = await inventory.getStock(variantId, warehouseId);
    expect(item?.onHand).toBe(1);
    expect(item?.reserved).toBe(1);
  });

  it('receive → movement ledger yoziladi, on_hand oshadi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 10, note: 'kirim' });
    const item = await inventory.getStock(variantId, warehouseId);
    expect(item?.onHand).toBe(10);
    expect(item?.reserved).toBe(0);

    const movements = await h.prisma.stockMovement.findMany({ where: { variantId } });
    expect(movements).toHaveLength(1);
    expect(movements[0]?.type).toBe('PURCHASE_RECEIPT');
    expect(movements[0]?.quantity).toBe(10);
    // ⚠️ Audit (docs/11): qoldiq kirimi.
    expect(await h.prisma.auditLog.count({ where: { action: 'STOCK_RECEIVED' } })).toBeGreaterThanOrEqual(1);
  });

  it('inventarizatsiya: fizik sanoq < tizim → manfiy ADJUSTMENT + on_hand tuzatiladi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 10 });
    const item = await inventory.adjustStock({ variantId, warehouseId, physicalCount: 8, reason: 'shrinkage' });
    expect(item.onHand).toBe(8);

    const adj = await h.prisma.stockMovement.findMany({ where: { variantId, type: 'ADJUSTMENT' } });
    expect(adj).toHaveLength(1);
    expect(adj[0]?.quantity).toBe(-2); // 8 - 10
    expect(adj[0]?.referenceType).toBe('inventory_count');
    // ⚠️ Audit (docs/11): qoldiq tuzatishi (sabab majburiy).
    expect(await h.prisma.auditLog.count({ where: { action: 'STOCK_ADJUSTED', resourceId: item.id } })).toBe(1);
  });

  it('inventarizatsiya: fizik sanoq = tizim → farq yo‘q, movement yozilmaydi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 7 });
    await inventory.adjustStock({ variantId, warehouseId, physicalCount: 7, reason: 'ok' });
    expect(await h.prisma.stockMovement.count({ where: { variantId, type: 'ADJUSTMENT' } })).toBe(0);
  });

  it('⚠️ SANOQ PAYTIDA SOTUV → qoldiq mos qoladi (§8.2): sotuv yo‘qolmaydi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 10 });
    // Sanoq boshlandi (10 ko'rindi), lekin submit'gacha 1 dona sotildi (consume).
    const r = await inventory.reserve({ variantId, warehouseId, quantity: 1, cartId: randomUUID() });
    await inventory.consume(r.id); // on_hand 10 → 9 + SALE movement
    expect((await inventory.getStock(variantId, warehouseId))?.onHand).toBe(9);

    // Sanoqchi 8 dona sanadi va submit qildi → adjust joriy 9'dan hisoblaydi (variance -1).
    const item = await inventory.adjustStock({ variantId, warehouseId, physicalCount: 8, reason: 'count' });
    expect(item.onHand).toBe(8); // fizik sanoq bilan mos

    // Sotuv YO'QOLMADI: SALE ham, ADJUSTMENT ham bor.
    expect(await h.prisma.stockMovement.count({ where: { variantId, type: 'SALE' } })).toBe(1);
    const adj = await h.prisma.stockMovement.findMany({ where: { variantId, type: 'ADJUSTMENT' } });
    expect(adj[0]?.quantity).toBe(-1); // 8 - 9 (sotuv hisobga olingan)
  });

  it('mavjud bo‘lmagan qoldiqni tuzatish → NotFoundError', async () => {
    await expect(
      inventory.adjustStock({ variantId, warehouseId, physicalCount: 5, reason: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('reserve → available kamayadi; release → qayta sotiladi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 3 });
    const r1 = await inventory.reserve({ variantId, warehouseId, quantity: 2, cartId: randomUUID() });

    let item = await inventory.getStock(variantId, warehouseId);
    expect(item?.reserved).toBe(2); // available = 1

    await inventory.release(r1.id);
    item = await inventory.getStock(variantId, warehouseId);
    expect(item?.reserved).toBe(0); // available = 3 qayta

    const released = await h.prisma.stockReservation.findUnique({ where: { id: r1.id } });
    expect(released?.status).toBe('RELEASED');
  });

  it('release idempotent — ikki marta bo‘shatish reserved‘ni buzmaydi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 1 });
    const r = await inventory.reserve({ variantId, warehouseId, quantity: 1, cartId: randomUUID() });
    await inventory.release(r.id);
    await inventory.release(r.id); // no-op

    const item = await inventory.getStock(variantId, warehouseId);
    expect(item?.reserved).toBe(0);
  });

  it('consume → on_hand va reserved kamayadi + SALE movement, rezerv CONSUMED', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 5 });
    const r = await inventory.reserve({ variantId, warehouseId, quantity: 2, cartId: randomUUID() });
    await inventory.consume(r.id);

    const item = await inventory.getStock(variantId, warehouseId);
    expect(item?.onHand).toBe(3);
    expect(item?.reserved).toBe(0);

    const reservation = await h.prisma.stockReservation.findUnique({ where: { id: r.id } });
    expect(reservation?.status).toBe('CONSUMED');

    const sale = await h.prisma.stockMovement.findMany({ where: { variantId, type: 'SALE' } });
    expect(sale).toHaveLength(1);
    expect(sale[0]?.quantity).toBe(-2);
  });

  it('yetarli qoldiq yo‘q → InsufficientStockError', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 1 });
    await expect(
      inventory.reserve({ variantId, warehouseId, quantity: 2, cartId: randomUUID() }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    const item = await inventory.getStock(variantId, warehouseId);
    expect(item?.reserved).toBe(0); // o'zgarmadi
  });

  it('egasi aniq bitta bo‘lishi kerak (cart XOR order) — ikkalasi → rad', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 1 });
    await expect(
      inventory.reserve({ variantId, warehouseId, quantity: 1, cartId: randomUUID(), orderId: randomUUID() }),
    ).rejects.toThrow();
    await expect(inventory.reserve({ variantId, warehouseId, quantity: 1 })).rejects.toThrow();
  });

  it('TTL: muddati tugagan PENDING rezerv releaseExpired bilan bo‘shaydi', async () => {
    await inventory.receive({ variantId, warehouseId, quantity: 2 });
    const r = await inventory.reserve({ variantId, warehouseId, quantity: 1, cartId: randomUUID() });

    // Muddatini o'tmishga surib qo'yamiz.
    await h.prisma.stockReservation.update({
      where: { id: r.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const released = await inventory.releaseExpired();
    expect(released).toBeGreaterThanOrEqual(1);

    const item = await inventory.getStock(variantId, warehouseId);
    expect(item?.reserved).toBe(0);
    const reservation = await h.prisma.stockReservation.findUnique({ where: { id: r.id } });
    expect(reservation?.status).toBe('EXPIRED');
  });
});
