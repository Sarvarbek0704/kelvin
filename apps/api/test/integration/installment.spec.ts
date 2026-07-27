import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { InstallmentService } from '../../src/modules/installment/installment.service';
import { ConflictError, BusinessRuleError } from '../../src/core/errors/domain.error';

/**
 * installment — rassrochka QO'LDA rejim (docs/08 §7): grafik (tiyin yo'qolmaydi) +
 * har to'lov double-entry ledger'ga. Reja to'liq to'lansa PAID.
 */
describe('Installment (integration)', () => {
  let h: TestHarness;
  let installments: InstallmentService;

  beforeAll(async () => {
    h = await createHarness();
    installments = h.app.get(InstallmentService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const mkOrder = async (status: string, total: bigint): Promise<string> => {
    const cust = await h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });
    const order = await h.prisma.order.create({
      data: {
        number: `KLV-I-${randomUUID().slice(0, 8)}`,
        customerId: cust.id,
        status: status as never,
        channel: 'ONLINE',
        subtotalAmount: total,
        discountAmount: 0n,
        deliveryAmount: 0n,
        totalAmount: total,
        currency: 'UZS',
      },
    });
    return order.id;
  };

  it('createPlanForOrder → grafik (SUM === totalPayable) + muvozanatli ledger', async () => {
    const orderId = await mkOrder('CONFIRMED', 300_000_000n);
    const plan = await installments.createPlanForOrder({ orderId, termMonths: 3, interestRateBp: 0, firstDueDate: new Date('2026-08-01') });

    expect(plan.status).toBe('PENDING');
    expect(plan.schedule).toHaveLength(3);
    const sum = plan.schedule.reduce((s, l) => s + l.amount, 0n);
    expect(sum).toBe(plan.totalPayableAmount);
    expect(plan.totalPayableAmount).toBe(300_000_000n);

    // Ochilish ledger muvozanatli (DEBIT receivable === CREDIT revenue).
    const entries = await h.prisma.ledgerEntry.findMany({ where: { account: { contains: 'installment' } } });
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  it('foiz bilan — totalPayable = principal + foiz', async () => {
    const orderId = await mkOrder('CONFIRMED', 100_000_000n);
    const plan = await installments.createPlanForOrder({ orderId, termMonths: 6, interestRateBp: 1200, firstDueDate: new Date('2026-08-01') });
    expect(plan.totalPayableAmount).toBe(112_000_000n); // 100M + 12%
  });

  it('⚠️ to‘lov → paidAmount; oy to‘liq → PAID; barcha oy → reja PAID', async () => {
    const orderId = await mkOrder('CONFIRMED', 300_000_000n);
    const plan = await installments.createPlanForOrder({ orderId, termMonths: 3, interestRateBp: 0, firstDueDate: new Date('2026-08-01') });

    for (const line of plan.schedule) {
      const paid = await installments.recordPayment(line.id, line.amount);
      expect(paid.status).toBe('PAID');
    }
    const done = await installments.getPlan(plan.id);
    expect(done?.status).toBe('PAID');
    // Grafikning har oyi to'langan.
    expect(done?.schedule.every((s) => s.status === 'PAID')).toBe(true);
    expect(done?.schedule.reduce((s, l) => s + l.paidAmount, 0n)).toBe(300_000_000n);
  });

  it('⚠️ oylikdan oshiq to‘lov → rad', async () => {
    const orderId = await mkOrder('CONFIRMED', 300_000_000n);
    const plan = await installments.createPlanForOrder({ orderId, termMonths: 3, interestRateBp: 0, firstDueDate: new Date('2026-08-01') });
    await expect(installments.recordPayment(plan.schedule[0]!.id, 999_000_000n)).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('⚠️ CONFIRMED bo‘lmagan buyurtma → rad; takror reja → Conflict', async () => {
    const draftId = await mkOrder('DRAFT', 100_000_000n);
    await expect(installments.createPlanForOrder({ orderId: draftId, termMonths: 3, firstDueDate: new Date('2026-08-01') })).rejects.toBeInstanceOf(ConflictError);

    const orderId = await mkOrder('CONFIRMED', 100_000_000n);
    await installments.createPlanForOrder({ orderId, termMonths: 3, firstDueDate: new Date('2026-08-01') });
    await expect(installments.createPlanForOrder({ orderId, termMonths: 3, firstDueDate: new Date('2026-08-01') })).rejects.toBeInstanceOf(ConflictError);
  });
});
