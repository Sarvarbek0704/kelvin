import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { OrderService } from '../../src/modules/order/order.service';
import { CartService } from '../../src/modules/cart/cart.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { ConflictError, InsufficientStockError } from '../../src/core/errors/domain.error';

/**
 * order — checkout SAGA (rezerv + KOMPENSATSIYA + idempotentlik) va holat
 * mashinasi (docs/07 §2-3). Faza 3 DoD: "bir savat, ikki tab → 1 buyurtma".
 */
describe('Order (integration, checkout saga)', () => {
  let h: TestHarness;
  let orders: OrderService;
  let cart: CartService;
  let inventory: InventoryService;
  let warehouseId: string;
  let customerId: string;

  beforeAll(async () => {
    h = await createHarness();
    orders = h.app.get(OrderService);
    cart = h.app.get(CartService);
    inventory = h.app.get(InventoryService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  let productId: string;
  let priceListId: string;

  beforeEach(async () => {
    const c = await h.prisma.category.create({
      data: { slug: `c-${randomUUID()}`, name: { ru: 'Кат' }, path: '/c/' },
    });
    const p = await h.prisma.product.create({
      data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'Люстра' }, status: 'ACTIVE' },
    });
    const pl = await h.prisma.priceList.create({
      data: { code: `PL-${randomUUID()}`, name: { ru: 'Список' } },
    });
    const wh = await h.prisma.warehouse.create({
      data: { code: `W-${randomUUID()}`, name: { ru: 'Склад' }, isSellable: true, isActive: true },
    });
    const cust = await h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });
    productId = p.id;
    priceListId = pl.id;
    warehouseId = wh.id;
    customerId = cust.id;
  });

  /** Variant + narx + qoldiq (kirim). */
  const mkVariant = async (amount: bigint, stock: number): Promise<string> => {
    const v = await h.prisma.productVariant.create({
      data: { productId, sku: `SKU-${randomUUID()}`, axisValues: { color: 'gold' } },
    });
    await h.prisma.price.create({ data: { priceListId, variantId: v.id, amount } });
    if (stock > 0) {
      await inventory.receive({ variantId: v.id, warehouseId, quantity: stock });
    }
    return v.id;
  };

  const cartWith = async (
    items: readonly { variantId: string; quantity: number }[],
  ): Promise<string> => {
    const c = await cart.getOrCreateForCustomer(customerId);
    for (const it of items) {
      await cart.addItem(c.id, it.variantId, it.quantity);
    }
    return c.id;
  };

  it('checkout muvaffaqiyat: DRAFT buyurtma + snapshot + rezerv + savat o‘chdi', async () => {
    const v1 = await mkVariant(100_000_000n, 5);
    const cartId = await cartWith([{ variantId: v1, quantity: 2 }]);

    const order = await orders.checkout({ customerId, cartId, warehouseId });

    expect(order.status).toBe('DRAFT');
    expect(order.number).toMatch(/^KLV-\d{4}-\d{6}$/);
    expect(order.subtotalAmount).toBe(200_000_000n);
    expect(order.totalAmount).toBe(200_000_000n);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(2);

    // Rezerv buyurtmaga bog'landi, on_hand=5, reserved=2.
    const stock = await inventory.getStock(v1, warehouseId);
    expect(stock?.reserved).toBe(2);
    const res = await h.prisma.stockReservation.findMany({ where: { orderId: order.id } });
    expect(res).toHaveLength(1);
    expect(res[0]?.cartId).toBeNull(); // single_owner: order'ga ko'chdi

    // Savat da'vo qilindi (o'chdi).
    expect(await h.prisma.cart.findUnique({ where: { id: cartId } })).toBeNull();
  });

  it('checkout yetkazish zonasi bilan → deliveryAmount snapshot + total (delivery integratsiya)', async () => {
    const v1 = await mkVariant(100_000_000n, 5);
    const cartId = await cartWith([{ variantId: v1, quantity: 1 }]); // subtotal 100M
    const zone = await h.prisma.deliveryZone.create({
      data: { name: { ru: 'Зона' }, districts: ['X'], priceAmount: 3_000_000n, freeThresholdAmount: 500_000_000n },
    });

    const order = await orders.checkout({ customerId, cartId, warehouseId, deliveryZoneId: zone.id });
    expect(order.deliveryAmount).toBe(3_000_000n); // 100M < 500M threshold → narx
    expect(order.totalAmount).toBe(103_000_000n); // 100M + 3M yetkazish

    // freeThreshold'dan katta savat → bepul yetkazish (alohida variant, yetarli qoldiq).
    const v2 = await mkVariant(100_000_000n, 10);
    const cart2 = await cartWith([{ variantId: v2, quantity: 6 }]); // 600M >= 500M
    const order2 = await orders.checkout({ customerId, cartId: cart2, warehouseId, deliveryZoneId: zone.id });
    expect(order2.deliveryAmount).toBe(0n);
    expect(order2.totalAmount).toBe(600_000_000n);
  });

  it('listForCustomer — mijozning buyurtmalari (yangi birinchi)', async () => {
    const v1 = await mkVariant(100_000_000n, 10);
    const c1 = await cartWith([{ variantId: v1, quantity: 1 }]);
    const o1 = await orders.checkout({ customerId, cartId: c1, warehouseId });
    const v2 = await mkVariant(50_000_000n, 10);
    const c2 = await cartWith([{ variantId: v2, quantity: 2 }]);
    const o2 = await orders.checkout({ customerId, cartId: c2, warehouseId });

    const mine = await orders.listForCustomer(customerId);
    expect(mine.length).toBeGreaterThanOrEqual(2);
    const ids = mine.map((o) => o.id);
    expect(ids).toContain(o1.id);
    expect(ids).toContain(o2.id);
    // Yangi birinchi.
    expect(mine[0]?.id).toBe(o2.id);
  });

  it('listForAdmin — cursor + status filtri (docs/13 admin)', async () => {
    const v1 = await mkVariant(100_000_000n, 10);
    const o1 = await orders.checkout({ customerId, cartId: await cartWith([{ variantId: v1, quantity: 1 }]), warehouseId });
    const v2 = await mkVariant(50_000_000n, 10);
    const o2 = await orders.checkout({ customerId, cartId: await cartWith([{ variantId: v2, quantity: 1 }]), warehouseId });

    // Cursor: birinchi sahifa 1 ta → nextCursor bor.
    const page1 = await orders.listForAdmin({ limit: 1 });
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.id).toBe(o2.id); // uuid7 → eng yangi birinchi
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await orders.listForAdmin({ limit: 1, cursor: page1.nextCursor! });
    expect(page2.items[0]?.id).toBe(o1.id);

    // Status filtri: DRAFT'lar (checkout DRAFT qoldiradi).
    const drafts = await orders.listForAdmin({ status: 'DRAFT', limit: 50 });
    expect(drafts.items.every((o) => o.status === 'DRAFT')).toBe(true);
    expect(drafts.items.map((o) => o.id)).toEqual(expect.arrayContaining([o1.id, o2.id]));

    // Boshqa status — bu buyurtmalar chiqmaydi.
    const shipped = await orders.listForAdmin({ status: 'SHIPPED', limit: 50 });
    expect(shipped.items.map((o) => o.id)).not.toContain(o1.id);
  });

  it('getDetailForAdmin — mijoz kontakti + holat tarixi (timeline)', async () => {
    const v = await mkVariant(100_000_000n, 10);
    const order = await orders.checkout({ customerId, cartId: await cartWith([{ variantId: v, quantity: 1 }]), warehouseId });
    await orders.transitionTo(order.id, 'PENDING_PAYMENT', undefined, 'checkout');

    const detail = await orders.getDetailForAdmin(order.id);
    expect(detail).not.toBeNull();
    expect(detail?.customer?.phone).toMatch(/^\+p/); // beforeEach customer phone
    // Timeline: DRAFT (checkout) → PENDING_PAYMENT.
    expect(detail?.timeline.length).toBeGreaterThanOrEqual(2);
    expect(detail?.timeline.at(-1)?.toStatus).toBe('PENDING_PAYMENT');
    expect(detail?.allowedTransitions).toContain('PAID');

    expect(await orders.getDetailForAdmin(randomUUID())).toBeNull();
  });

  it('statsForAdmin — holat bo‘yicha son + jami (dashboard)', async () => {
    const v = await mkVariant(100_000_000n, 10);
    await orders.checkout({ customerId, cartId: await cartWith([{ variantId: v, quantity: 1 }]), warehouseId });
    const stats = await orders.statsForAdmin();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.byStatus.DRAFT).toBeGreaterThanOrEqual(1);
    expect(stats.total).toBe(Object.values(stats.byStatus).reduce((a, b) => a + b, 0));
  });

  it('⚠️ KOMPENSATSIYA: bir qator yetmasa — rezerv bo‘shatiladi, buyurtma yaratilmaydi', async () => {
    const v1 = await mkVariant(100_000_000n, 5); // yetarli
    const v2 = await mkVariant(50_000_000n, 1); // faqat 1 ta
    const cartId = await cartWith([
      { variantId: v1, quantity: 1 },
      { variantId: v2, quantity: 2 }, // 2 kerak, 1 bor → yetmaydi
    ]);

    await expect(orders.checkout({ customerId, cartId, warehouseId })).rejects.toBeInstanceOf(
      InsufficientStockError,
    );

    // v1 rezervi KOMPENSATSIYA bilan bo'shatildi (reserved=0), buyurtma yo'q.
    expect((await inventory.getStock(v1, warehouseId))?.reserved).toBe(0);
    expect((await inventory.getStock(v2, warehouseId))?.reserved).toBe(0);
    expect(await h.prisma.order.count({ where: { customerId } })).toBe(0);
    // Savat da'vo qilinmagan (reserv'dan oldin xato) — hali mavjud.
    expect(await h.prisma.cart.findUnique({ where: { id: cartId } })).not.toBeNull();
  });

  it('⚠️ IDEMPOTENTLIK: bir savat, 2 parallel checkout → ANIQ 1 buyurtma', async () => {
    const v1 = await mkVariant(100_000_000n, 10);
    const cartId = await cartWith([{ variantId: v1, quantity: 1 }]);

    const results = await Promise.allSettled([
      orders.checkout({ customerId, cartId, warehouseId }),
      orders.checkout({ customerId, cartId, warehouseId }),
    ]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0]!).reason).toBeInstanceOf(ConflictError);

    expect(await h.prisma.order.count({ where: { customerId } })).toBe(1);
    // Yutqazganning rezervi bo'shatildi → reserved=1 (faqat g'olibники).
    expect((await inventory.getStock(v1, warehouseId))?.reserved).toBe(1);
  });

  it('cancel → CANCELLED + rezerv release (tovar qayta sotiladi)', async () => {
    const v1 = await mkVariant(100_000_000n, 3);
    const cartId = await cartWith([{ variantId: v1, quantity: 2 }]);
    const order = await orders.checkout({ customerId, cartId, warehouseId });
    expect((await inventory.getStock(v1, warehouseId))?.reserved).toBe(2);

    const cancelled = await orders.cancel(order.id, undefined, 'test');
    expect(cancelled.status).toBe('CANCELLED');
    expect((await inventory.getStock(v1, warehouseId))?.reserved).toBe(0); // qayta sotiladi
    // ⚠️ Audit (docs/11): buyurtma bekor.
    expect(await h.prisma.auditLog.count({ where: { action: 'ORDER_CANCELLED', resourceId: order.id } })).toBe(1);
  });

  it('illegal o‘tish: DRAFT → SHIPPED → ConflictError (409)', async () => {
    const v1 = await mkVariant(100_000_000n, 3);
    const cartId = await cartWith([{ variantId: v1, quantity: 1 }]);
    const order = await orders.checkout({ customerId, cartId, warehouseId });

    await expect(orders.transitionTo(order.id, 'SHIPPED')).rejects.toBeInstanceOf(ConflictError);
  });

  it('⚠️ PACKED → rezerv consume: on_hand kamayadi + SALE movement (§2.2 #13)', async () => {
    const v1 = await mkVariant(100_000_000n, 5);
    const cartId = await cartWith([{ variantId: v1, quantity: 2 }]);
    const order = await orders.checkout({ customerId, cartId, warehouseId });

    // Holat mashinasi bo'ylab PACKED gacha.
    for (const to of ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PICKING', 'PACKED'] as const) {
      await orders.transitionTo(order.id, to);
    }

    const stock = await inventory.getStock(v1, warehouseId);
    expect(stock?.onHand).toBe(3); // 5 - 2 (iste'mol qilindi)
    expect(stock?.reserved).toBe(0);
    const sale = await h.prisma.stockMovement.findMany({ where: { variantId: v1, type: 'SALE' } });
    expect(sale).toHaveLength(1);
    expect(sale[0]?.quantity).toBe(-2);
  });
});
