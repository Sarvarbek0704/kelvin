import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { OrderService } from '../../src/modules/order/order.service';
import { CartService } from '../../src/modules/cart/cart.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { PaymentService } from '../../src/modules/payment/payment.service';
import { type NormalizedWebhookEvent } from '../../src/modules/payment/provider/provider.port';
import { BusinessRuleError, ConflictError, UnknownTransactionError } from '../../src/core/errors/domain.error';

/**
 * payment — uch himoya (docs/08): amount tekshiruvi, idempotentlik, double-entry
 * ledger. To'lov o'tgach order sagasi (PENDING_PAYMENT → PAID → CONFIRMED).
 */
describe('Payment (integration)', () => {
  let h: TestHarness;
  let orders: OrderService;
  let cart: CartService;
  let inventory: InventoryService;
  let payments: PaymentService;
  let warehouseId: string;
  let customerId: string;
  let productId: string;
  let priceListId: string;

  beforeAll(async () => {
    h = await createHarness();
    orders = h.app.get(OrderService);
    cart = h.app.get(CartService);
    inventory = h.app.get(InventoryService);
    payments = h.app.get(PaymentService);
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

  /** To'liq buyurtma (DRAFT): variant+narx+qoldiq → savat → checkout. */
  const makeOrder = async (amount: bigint, qty: number): Promise<{ orderId: string; total: bigint }> => {
    const v = await h.prisma.productVariant.create({
      data: { productId, sku: `SKU-${randomUUID()}`, axisValues: {} },
    });
    await h.prisma.price.create({ data: { priceListId, variantId: v.id, amount } });
    await inventory.receive({ variantId: v.id, warehouseId, quantity: qty + 5 });
    const c = await cart.getOrCreateForCustomer(customerId);
    await cart.addItem(c.id, v.id, qty);
    const order = await orders.checkout({ customerId, cartId: c.id, warehouseId });
    return { orderId: order.id, total: order.totalAmount };
  };

  it('createPayment → buyurtma PENDING_PAYMENT, to‘lov PENDING, amount = order total', async () => {
    const { orderId, total } = await makeOrder(100_000_000n, 2);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });

    expect(payment.status).toBe('PENDING');
    expect(payment.amount).toBe(total); // 200M
    expect((await orders.getById(orderId))?.status).toBe('PENDING_PAYMENT');
  });

  it('createPayment idempotent — bir kalit → bir to‘lov', async () => {
    const { orderId } = await makeOrder(100_000_000n, 1);
    const key = randomUUID();
    const a = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: key });
    const b = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: key });
    expect(a.id).toBe(b.id);
    expect(await h.prisma.payment.count({ where: { orderId } })).toBe(1);
  });

  it('⚠️ amount mismatch → FAILED, buyurtma PENDING_PAYMENT’da qoladi, ledger yo‘q', async () => {
    const { orderId } = await makeOrder(100_000_000n, 2); // total 200M
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });

    await expect(
      payments.confirmPayment({ paymentId: payment.id, amount: 100_000_000n }), // kam!
    ).rejects.toBeInstanceOf(BusinessRuleError);

    expect((await payments.getById(payment.id))?.status).toBe('FAILED');
    expect((await orders.getById(orderId))?.status).toBe('PENDING_PAYMENT');
    expect(await h.prisma.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(0);
    // ⚠️ Xavfsizlik hodisasi audit'da (docs/11).
    expect(
      await h.prisma.auditLog.count({ where: { action: 'PAYMENT_AMOUNT_MISMATCH', resourceId: payment.id } }),
    ).toBe(1);
  });

  it('⚠️ confirmPayment success → PAID + MUVOZANATLI ledger + order CONFIRMED + rezerv CONFIRMED', async () => {
    const { orderId, total } = await makeOrder(100_000_000n, 2); // 200M
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });

    const confirmed = await payments.confirmPayment({ paymentId: payment.id, amount: total });
    expect(confirmed.status).toBe('PAID');

    // Order sagasi: PENDING_PAYMENT → PAID → CONFIRMED.
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED');

    // Rezerv CONFIRMED (TTL bilan bo'shamaydi).
    const res = await h.prisma.stockReservation.findMany({ where: { orderId } });
    expect(res.every((r) => r.status === 'CONFIRMED')).toBe(true);

    // Double-entry ledger MUVOZANATLI: DEBIT === CREDIT === total.
    const entries = await h.prisma.ledgerEntry.findMany({ where: { paymentId: payment.id } });
    expect(entries).toHaveLength(2);
    const debit = entries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amount, 0n);
    const credit = entries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amount, 0n);
    expect(debit).toBe(total);
    expect(credit).toBe(total);
    expect(debit).toBe(credit);
    // Bitta transactionId ostida.
    expect(new Set(entries.map((e) => e.transactionId)).size).toBe(1);

    // ⚠️ Audit (docs/11): to'lov qabul qilindi.
    expect(
      await h.prisma.auditLog.count({ where: { action: 'PAYMENT_CAPTURED', resourceId: payment.id } }),
    ).toBe(1);

    // ⚠️ Bildirishnoma (saga oxirgi qadami): order_confirmed yuborildi.
    const notif = await h.prisma.notification.findFirst({ where: { templateKey: 'order_confirmed' } });
    expect(notif).not.toBeNull();
    expect(notif?.sentAt).not.toBeNull(); // LogAdapter → muvaffaqiyat
  });

  it('⚠️ confirmPayment idempotent — ikki marta → bitta ledger tranzaksiya', async () => {
    const { orderId, total } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });

    await payments.confirmPayment({ paymentId: payment.id, amount: total });
    const second = await payments.confirmPayment({ paymentId: payment.id, amount: total }); // webhook takrori
    expect(second.status).toBe('PAID');

    // Ledger IKKI marta yozilmagan (revenue ikki barobar bo'lmaydi).
    expect(await h.prisma.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(2);
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED');
  });

  // --- Webhook ingestion (docs/08 §5.5) -------------------------------------
  /** Normallashtirilgan webhook hodisasi (adapter parseWebhook natijasi). */
  const paidEvent = (paymentId: string, amount: bigint): NormalizedWebhookEvent => ({
    providerCode: 'click',
    providerEventId: randomUUID(),
    providerTransactionId: `click-tx-${randomUUID().slice(0, 8)}`,
    paymentId,
    occurredAt: new Date(), // replay oynasi ichida
    state: { status: 'paid', providerTransactionId: null, paidAmount: amount, paidAt: new Date(), raw: {} },
  });

  it('⚠️ webhook PAID → applyWebhookEvent → PAID + order CONFIRMED + muvozanatli ledger', async () => {
    const { orderId, total } = await makeOrder(100_000_000n, 2); // 200M
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });

    await payments.applyWebhookEvent(paidEvent(payment.id, total));

    expect((await payments.getById(payment.id))?.status).toBe('PAID');
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED');
    const entries = await h.prisma.ledgerEntry.findMany({ where: { paymentId: payment.id } });
    expect(entries).toHaveLength(2);
    const debit = entries.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amount, 0n);
    const credit = entries.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amount, 0n);
    expect(debit).toBe(total);
    expect(credit).toBe(total);
  });

  it('⚠️ webhook idempotent — ikki marta → bitta ledger tranzaksiya', async () => {
    const { orderId, total } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    const event = paidEvent(payment.id, total);

    await payments.applyWebhookEvent(event);
    await payments.applyWebhookEvent(event); // provayder javobni olmay qayta yubordi

    expect(await h.prisma.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(2);
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED');
  });

  it('⚠️ webhook noma‘lum to‘lov → UnknownTransactionError', async () => {
    await expect(
      payments.applyWebhookEvent(paidEvent(randomUUID(), 100_000_000n)),
    ).rejects.toBeInstanceOf(UnknownTransactionError);
  });

  it('⚠️ webhook summa mos emas → FAILED, ledger yo‘q (hujum himoyasi)', async () => {
    const { orderId } = await makeOrder(100_000_000n, 2); // total 200M
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });

    await expect(
      payments.applyWebhookEvent(paidEvent(payment.id, 100_000_000n)), // kam!
    ).rejects.toBeInstanceOf(BusinessRuleError);

    expect((await payments.getById(payment.id))?.status).toBe('FAILED');
    expect(await h.prisma.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(0);
  });

  // --- Qo'lda capture (docs/08 §4.4) — naqd/bank ----------------------------
  it('⚠️ qo‘lda capture (naqd) → PAID + order CONFIRMED (kassir/kuryer tasdiqi)', async () => {
    const { orderId } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CASH', idempotencyKey: randomUUID() });
    expect(payment.provider).toBe('CASH');

    const captured = await payments.captureManual(payment.id);
    expect(captured.status).toBe('PAID');
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED');
    // Muvozanatli ledger yozildi (naqd → courier hisobiga).
    expect(await h.prisma.ledgerEntry.count({ where: { paymentId: payment.id } })).toBe(2);
  });

  it('⚠️ webhook provayderni qo‘lda capture → rad (NOT_MANUAL_CAPTURE)', async () => {
    const { orderId } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    // CLICK — webhook tasdiqli: qo'lda "to'landi" deb belgilash TAQIQ (pul yo'qolishi).
    await expect(payments.captureManual(payment.id)).rejects.toBeInstanceOf(BusinessRuleError);
    expect((await payments.getById(payment.id))?.status).toBe('PENDING');
  });

  it('revenueStats — sof tushum = to‘langan − qaytarilgan (dashboard)', async () => {
    const before = await payments.revenueStats();
    const { orderId, total } = await makeOrder(100_000_000n, 2); // 200M
    const payment = await payments.createPayment({ orderId, provider: 'CASH', idempotencyKey: randomUUID() });
    await payments.captureManual(payment.id); // PAID

    const after = await payments.revenueStats();
    // Sof tushum aynan shu to'lov summasiga oshdi.
    expect(BigInt(after.net) - BigInt(before.net)).toBe(total);
    expect(BigInt(after.paidTotal) - BigInt(before.paidTotal)).toBe(total);
  });

  it('⚠️ DEV simulateWebhook — onlayn to‘lov MOCK yakunlanadi → PAID + order CONFIRMED', async () => {
    const { orderId } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    await payments.simulateWebhook(payment.id);
    expect((await payments.getById(payment.id))?.status).toBe('PAID');
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED');
  });

  it('⚠️ settlement — receivable→bank+komissiya (§6.5), idempotent', async () => {
    const { orderId, total } = await makeOrder(100_000_000n, 2); // 200M
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    await payments.confirmPayment({ paymentId: payment.id, amount: total });

    const fee = 2_000_000n; // 1% komissiya
    await payments.settle(payment.id, fee);

    const entries = await h.prisma.ledgerEntry.findMany({ where: { paymentId: payment.id } });
    // Settlement: DEBIT bank(net) + DEBIT provider_fee + CREDIT receivable.
    const bank = entries.find((e) => e.account === 'asset.cash.bank');
    const feeEntry = entries.find((e) => e.account === 'expense.provider_fee');
    const recvCredit = entries.find((e) => e.account === 'asset.receivable.provider' && e.direction === 'CREDIT');
    expect(bank?.amount).toBe(total - fee); // 198M net
    expect(feeEntry?.amount).toBe(fee);
    expect(recvCredit?.amount).toBe(total);

    // ⚠️ Idempotent — takror settlement rad.
    await expect(payments.settle(payment.id, fee)).rejects.toBeInstanceOf(ConflictError);
  });

  it('⚠️ TTL — muddati o‘tgan PENDING to‘lov EXPIRED (yangi qolmaydi)', async () => {
    const { orderId } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    // Yaratilishni 40 daqiqa orqaga surib qo'yamiz (TTL 30 daq).
    await h.prisma.payment.update({ where: { id: payment.id }, data: { createdAt: new Date(Date.now() - 40 * 60_000) } });

    const expired = await payments.expireStalePayments(30);
    expect(expired).toBeGreaterThanOrEqual(1);
    expect((await payments.getById(payment.id))?.status).toBe('EXPIRED');

    // Yangi PENDING (endigina yaratilgan) — tegilmaydi.
    const fresh = await payments.createPayment({ orderId: (await makeOrder(50_000_000n, 1)).orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    await payments.expireStalePayments(30);
    expect((await payments.getById(fresh.id))?.status).toBe('PENDING');
  });

  it('listByOrder — buyurtmaning to‘lovlari (admin ko‘rinishi)', async () => {
    const { orderId } = await makeOrder(100_000_000n, 1);
    const payment = await payments.createPayment({ orderId, provider: 'CASH', idempotencyKey: randomUUID() });
    const list = await payments.listByOrder(orderId);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(payment.id);
    expect(await payments.listByOrder(randomUUID())).toHaveLength(0);
  });

  /** To'langan (PAID) to'lov — refund testlari uchun. */
  const paidPayment = async (amount: bigint, qty: number): Promise<{ paymentId: string; orderId: string; total: bigint }> => {
    const { orderId, total } = await makeOrder(amount, qty);
    const payment = await payments.createPayment({ orderId, provider: 'CLICK', idempotencyKey: randomUUID() });
    await payments.confirmPayment({ paymentId: payment.id, amount: total });
    return { paymentId: payment.id, orderId, total };
  };

  it('⚠️ FULL refund → REFUNDED + teskari muvozanatli ledger + order CANCELLED + rezerv release', async () => {
    const { paymentId, orderId, total } = await paidPayment(100_000_000n, 2);

    const refund = await payments.refund({ paymentId, amount: total, reason: 'brak', idempotencyKey: randomUUID() });
    expect(refund.status).toBe('REFUNDED');
    expect((await payments.getById(paymentId))?.status).toBe('REFUNDED');

    // Teskari ledger: 4 yozuv jami (2 sotuv + 2 refund), umumiy balans 0.
    const all = await h.prisma.ledgerEntry.findMany({ where: { paymentId } });
    const debit = all.filter((e) => e.direction === 'DEBIT').reduce((s, e) => s + e.amount, 0n);
    const credit = all.filter((e) => e.direction === 'CREDIT').reduce((s, e) => s + e.amount, 0n);
    expect(debit).toBe(credit); // butun ledger muvozanatli

    // To'liq refund → buyurtma CANCELLED + rezerv release.
    expect((await orders.getById(orderId))?.status).toBe('CANCELLED');
    const res = await h.prisma.stockReservation.findMany({ where: { orderId } });
    expect(res.every((r) => r.status === 'RELEASED')).toBe(true);

    // ⚠️ Audit (docs/11): refund + buyurtma bekor.
    expect(await h.prisma.auditLog.count({ where: { action: 'PAYMENT_REFUNDED', resourceId: paymentId } })).toBe(1);
    expect(await h.prisma.auditLog.count({ where: { action: 'ORDER_CANCELLED', resourceId: orderId } })).toBe(1);
  });

  it('PARTIAL refund → PARTIALLY_REFUNDED, buyurtma CONFIRMED’da qoladi', async () => {
    const { paymentId, orderId, total } = await paidPayment(100_000_000n, 2); // 200M

    await payments.refund({ paymentId, amount: total / 2n, reason: 'qisman', idempotencyKey: randomUUID() });
    expect((await payments.getById(paymentId))?.status).toBe('PARTIALLY_REFUNDED');
    expect((await orders.getById(orderId))?.status).toBe('CONFIRMED'); // to'liq emas → bekor emas
  });

  it('refund idempotent — bir kalit → bir refund', async () => {
    const { paymentId, total } = await paidPayment(100_000_000n, 1);
    const key = randomUUID();
    const a = await payments.refund({ paymentId, amount: total, reason: 'x', idempotencyKey: key });
    const b = await payments.refund({ paymentId, amount: total, reason: 'x', idempotencyKey: key });
    expect(a.id).toBe(b.id);
    expect(await h.prisma.refund.count({ where: { paymentId } })).toBe(1);
  });

  it('⚠️ refund qolgandan oshiq → rad etiladi', async () => {
    const { paymentId, total } = await paidPayment(100_000_000n, 1);
    await expect(
      payments.refund({ paymentId, amount: total + 1n, reason: 'x', idempotencyKey: randomUUID() }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });
});
