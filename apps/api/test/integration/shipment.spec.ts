import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { OrderService } from '../../src/modules/order/order.service';
import { CartService } from '../../src/modules/cart/cart.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { AddressService } from '../../src/modules/customer/address.service';
import { DeliveryService } from '../../src/modules/delivery/delivery.service';
import { ShipmentService } from '../../src/modules/shipment/shipment.service';
import { BusinessRuleError, ConflictError, SlotUnavailableError } from '../../src/core/errors/domain.error';

/**
 * shipment — jo'natma: CONFIRMED buyurtma + manzil egaligi + ATOMIK slot bron +
 * holat mashinasi (docs/07 §3.3). Order↔Delivery sikldan qochib alohida modul.
 */
describe('Shipment (integration)', () => {
  let h: TestHarness;
  let orders: OrderService;
  let cart: CartService;
  let inventory: InventoryService;
  let addresses: AddressService;
  let delivery: DeliveryService;
  let shipments: ShipmentService;

  let customerId: string;
  let warehouseId: string;
  let addressId: string;
  let slotId: string;

  beforeAll(async () => {
    h = await createHarness();
    orders = h.app.get(OrderService);
    cart = h.app.get(CartService);
    inventory = h.app.get(InventoryService);
    addresses = h.app.get(AddressService);
    delivery = h.app.get(DeliveryService);
    shipments = h.app.get(ShipmentService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  let productId: string;
  let priceListId: string;

  beforeEach(async () => {
    const c = await h.prisma.category.create({ data: { slug: `c-${randomUUID()}`, name: { ru: 'K' }, path: '/c/' } });
    const p = await h.prisma.product.create({ data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'T' }, status: 'ACTIVE' } });
    const pl = await h.prisma.priceList.create({ data: { code: `PL-${randomUUID()}`, name: { ru: 'L' } } });
    const wh = await h.prisma.warehouse.create({ data: { code: `W-${randomUUID()}`, name: { ru: 'S' }, isSellable: true } });
    const cust = await h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });
    productId = p.id;
    priceListId = pl.id;
    warehouseId = wh.id;
    customerId = cust.id;

    const addr = await addresses.create(customerId, { region: 'Toshkent', city: 'Toshkent', street: 'A 1' });
    addressId = addr.id;
    const zone = await delivery.createZone({ name: { ru: 'Z' }, districts: ['X'], priceAmount: 3_000_000n });
    const slot = await delivery.createSlot({ zoneId: zone.id, date: new Date('2026-09-01'), startTime: '09:00', endTime: '12:00', capacity: 1 });
    slotId = slot.id;
  });

  /** CONFIRMED buyurtma yaratadi (checkout → pending → paid → confirmed). */
  const confirmedOrder = async (): Promise<string> => {
    const v = await h.prisma.productVariant.create({ data: { productId, sku: `SKU-${randomUUID()}`, axisValues: {} } });
    await h.prisma.price.create({ data: { priceListId, variantId: v.id, amount: 100_000_000n } });
    await inventory.receive({ variantId: v.id, warehouseId, quantity: 5 });
    const c = await cart.getOrCreateForCustomer(customerId);
    await cart.addItem(c.id, v.id, 1);
    const order = await orders.checkout({ customerId, cartId: c.id, warehouseId });
    await orders.markPendingPayment(order.id);
    await orders.onPaymentSucceeded(order.id); // → PAID → CONFIRMED
    return order.id;
  };

  const mkCourier = async (): Promise<string> => {
    const user = await h.prisma.user.create({ data: { email: `crr-${randomUUID()}@k.uz`, passwordHash: 'x', status: 'ACTIVE' } });
    const crr = await h.prisma.courier.create({ data: { userId: user.id, fullName: 'Aliyev', phone: '+998901112233' } });
    return crr.id;
  };

  it('⚠️ TO‘LIQ OQIM: jo‘natma yaratish → slot bron → assign → transit → deliver', async () => {
    const orderId = await confirmedOrder();

    const shipment = await shipments.createForOrder({ orderId, addressId, slotId });
    expect(shipment.status).toBe('PENDING');
    expect(shipment.slotId).toBe(slotId);

    // Slot bron qilindi (capacity 1 → to'ldi).
    expect((await h.prisma.deliverySlot.findUnique({ where: { id: slotId } }))?.booked).toBe(1);

    const crr = await mkCourier();
    const assigned = await shipments.assignCourier(shipment.id, crr, 'KLV-SHIP-TEST');
    expect(assigned.status).toBe('ASSIGNED');
    expect(assigned.trackingNumber).toBe('KLV-SHIP-TEST');

    expect((await shipments.markInTransit(shipment.id)).status).toBe('IN_TRANSIT');
    const delivered = await shipments.markDelivered(shipment.id);
    expect(delivered.status).toBe('DELIVERED');
    expect(delivered.deliveredAt).not.toBeNull();
  });

  it('listByOrder + listCouriers (admin ko‘rinishi)', async () => {
    const orderId = await confirmedOrder();
    await shipments.createForOrder({ orderId, addressId, slotId });

    const byOrder = await shipments.listByOrder(orderId);
    expect(byOrder).toHaveLength(1);
    expect(byOrder[0]?.orderId).toBe(orderId);
    expect(await shipments.listByOrder(randomUUID())).toHaveLength(0);

    await mkCourier();
    const couriers = await shipments.listCouriers();
    expect(couriers.length).toBeGreaterThanOrEqual(1);
    expect(couriers[0]).toHaveProperty('fullName');
    expect(couriers[0]).toHaveProperty('phone');
  });

  it('CONFIRMED bo‘lmagan buyurtma → jo‘natma yaratilmaydi (ConflictError)', async () => {
    const v = await h.prisma.productVariant.create({ data: { productId, sku: `SKU-${randomUUID()}`, axisValues: {} } });
    await h.prisma.price.create({ data: { priceListId, variantId: v.id, amount: 100_000_000n } });
    await inventory.receive({ variantId: v.id, warehouseId, quantity: 5 });
    const c = await cart.getOrCreateForCustomer(customerId);
    await cart.addItem(c.id, v.id, 1);
    const order = await orders.checkout({ customerId, cartId: c.id, warehouseId }); // DRAFT

    await expect(shipments.createForOrder({ orderId: order.id, addressId })).rejects.toBeInstanceOf(ConflictError);
  });

  it('⚠️ begona mijoz manzili → INVALID_ADDRESS (BusinessRuleError)', async () => {
    const orderId = await confirmedOrder();
    const otherCust = await h.prisma.customer.create({ data: { phone: `+o${randomUUID().slice(0, 8)}` } });
    const otherAddr = await addresses.create(otherCust.id, { region: 'T', city: 'T', street: 'X 1' });

    await expect(
      shipments.createForOrder({ orderId, addressId: otherAddr.id, slotId }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
    // Slot bron qilinmadi (manzil tekshiruvi bron'dan oldin).
    expect((await h.prisma.deliverySlot.findUnique({ where: { id: slotId } }))?.booked).toBe(0);
  });

  it('⚠️ slot to‘la → jo‘natma yaratilmaydi (SlotUnavailable, bron kompensatsiya shart emas)', async () => {
    const orderId1 = await confirmedOrder();
    await shipments.createForOrder({ orderId: orderId1, addressId, slotId }); // slot to'ldi (capacity 1)

    const orderId2 = await confirmedOrder();
    const addr2 = addressId; // o'sha mijoz manzili
    await expect(
      shipments.createForOrder({ orderId: orderId2, addressId: addr2, slotId }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it('bitta buyurtma → bitta jo‘natma (takror → ConflictError)', async () => {
    const orderId = await confirmedOrder();
    await shipments.createForOrder({ orderId, addressId, slotId });
    await expect(shipments.createForOrder({ orderId, addressId })).rejects.toBeInstanceOf(ConflictError);
  });
});
