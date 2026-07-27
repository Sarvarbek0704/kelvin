import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { ProcurementService } from '../../src/modules/procurement/procurement.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { BusinessRuleError, ConflictError } from '../../src/core/errors/domain.error';

/**
 * procurement — ta'minot (docs/15 §8, Faza 6): Supplier + PurchaseOrder + qabul.
 * ⚠️ Qabul → INVENTORY_PORT.receiveStock: stock TIZIMGA shu yerdan kiradi.
 */
describe('Procurement (integration)', () => {
  let h: TestHarness;
  let procurement: ProcurementService;
  let inventory: InventoryService;
  let warehouseId: string;
  let variantId: string;

  beforeAll(async () => {
    h = await createHarness();
    procurement = h.app.get(ProcurementService);
    inventory = h.app.get(InventoryService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  beforeEach(async () => {
    const c = await h.prisma.category.create({
      data: { slug: `c-${randomUUID()}`, name: { ru: 'Кат' }, path: '/c/' },
    });
    const p = await h.prisma.product.create({
      data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'Тов' }, status: 'ACTIVE' },
    });
    const v = await h.prisma.productVariant.create({
      data: { productId: p.id, sku: `SKU-${randomUUID()}`, axisValues: {} },
    });
    const wh = await h.prisma.warehouse.create({
      data: { code: `W-${randomUUID()}`, name: { ru: 'Склад' } },
    });
    variantId = v.id;
    warehouseId = wh.id;
  });

  const mkSupplier = (): Promise<{ id: string }> =>
    procurement.createSupplier({ name: 'ACME Light', code: `ACME-${randomUUID().slice(0, 8)}` });

  it('createPurchaseOrder → DRAFT, totalAmount hisoblanadi, PO raqami', async () => {
    const supplier = await mkSupplier();
    const po = await procurement.createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId,
      items: [{ variantId, quantityOrdered: 10, unitCostAmount: 150_000_000n }],
    });
    expect(po.status).toBe('DRAFT');
    expect(po.number).toMatch(/^PO-\d{4}-\d{6}$/);
    expect(po.totalAmount).toBe(1_500_000_000n); // 10 × 150M
    expect(po.items).toHaveLength(1);
  });

  it('listPurchaseOrders — cursor (yangi birinchi)', async () => {
    const supplier = await mkSupplier();
    const po1 = await procurement.createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId,
      items: [{ variantId, quantityOrdered: 1, unitCostAmount: 100_000_000n }],
    });
    const po2 = await procurement.createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId,
      items: [{ variantId, quantityOrdered: 2, unitCostAmount: 100_000_000n }],
    });
    const page1 = await procurement.listPurchaseOrders({ limit: 1 });
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.id).toBe(po2.id); // uuid7 → eng yangi
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await procurement.listPurchaseOrders({ limit: 1, cursor: page1.nextCursor! });
    expect(page2.items[0]?.id).toBe(po1.id);
  });

  it('⚠️ TO‘LIQ OQIM: create → submit → receive → qoldiq oshadi + movement PO havolasi bilan', async () => {
    const supplier = await mkSupplier();
    const po = await procurement.createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId,
      items: [{ variantId, quantityOrdered: 25, unitCostAmount: 80_000_000n }],
    });

    const ordered = await procurement.submit(po.id);
    expect(ordered.status).toBe('ORDERED');

    const received = await procurement.receive(po.id);
    expect(received.status).toBe('RECEIVED');
    expect(received.items[0]?.quantityReceived).toBe(25);

    // Qoldiq oshdi.
    const stock = await inventory.getStock(variantId, warehouseId);
    expect(stock?.onHand).toBe(25);

    // Movement PO havolasi bilan.
    const mv = await h.prisma.stockMovement.findMany({ where: { variantId, type: 'PURCHASE_RECEIPT' } });
    expect(mv).toHaveLength(1);
    expect(mv[0]?.quantity).toBe(25);
    expect(mv[0]?.referenceType).toBe('purchase_order');
    expect(mv[0]?.referenceId).toBe(po.id);
  });

  it('illegal o‘tish: DRAFT’ni to‘g‘ridan-to‘g‘ri receive → ConflictError', async () => {
    const supplier = await mkSupplier();
    const po = await procurement.createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId,
      items: [{ variantId, quantityOrdered: 5, unitCostAmount: 10_000_000n }],
    });
    await expect(procurement.receive(po.id)).rejects.toBeInstanceOf(ConflictError);
    // Qoldiq oshmadi (qabul bo'lmadi).
    expect(await inventory.getStock(variantId, warehouseId)).toBeNull();
  });

  it('bo‘sh items → BusinessRuleError', async () => {
    const supplier = await mkSupplier();
    await expect(
      procurement.createPurchaseOrder({ supplierId: supplier.id, warehouseId, items: [] }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('cancel: DRAFT → CANCELLED, keyin receive illegal', async () => {
    const supplier = await mkSupplier();
    const po = await procurement.createPurchaseOrder({
      supplierId: supplier.id,
      warehouseId,
      items: [{ variantId, quantityOrdered: 3, unitCostAmount: 5_000_000n }],
    });
    const cancelled = await procurement.cancel(po.id);
    expect(cancelled.status).toBe('CANCELLED');
    await expect(procurement.submit(po.id)).rejects.toBeInstanceOf(ConflictError);
  });
});
