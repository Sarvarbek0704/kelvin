import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  UnknownTransactionError,
} from '../../core/errors/domain.error';
import { canTransition } from '../../core/payment/payment-state';
import { buildRefundLedger, buildSaleLedger, buildSettlementLedger, isBalanced, landingAccountFor, ACCOUNTS } from '../../core/payment/ledger';
import { assertFresh } from '../../core/payment/webhook-security';
import { AuditService } from '../../shared/audit/audit.service';
import { ORDER_PORT, type OrderPort } from '../order/order.port';
import { fromDbProvider, toDbProvider, type NormalizedWebhookEvent, type PaymentProviderCode } from './provider/provider.port';
import { PaymentProviderRegistry } from './provider/provider.registry';
import { PaymentRepository, type PaymentRow, type RefundRow } from './payment.repository';

export interface CreatePaymentInput {
  readonly orderId: string;
  readonly provider: string;
  /** Mijoz/klient bergan kalit — takror to'lov yaratishni oldini oladi. */
  readonly idempotencyKey: string;
}

export interface ConfirmPaymentInput {
  readonly paymentId: string;
  /** Provayder xabar qilgan summa — buyurtma summasiga TENG bo'lishi shart. */
  readonly amount: bigint;
  readonly providerTransactionId?: string;
}

export interface RefundInput {
  readonly paymentId: string;
  readonly amount: bigint;
  readonly reason: string;
  readonly idempotencyKey: string;
}

/**
 * payment — to'lov (docs/08). ⚠️ Uch himoya: (1) amount tekshiruvi (kam to'lov
 * PAID qilmaydi, §4.3), (2) idempotentlik (webhook takrori — CAS + idempotencyKey,
 * §5), (3) double-entry ledger (§6). To'lov o'tgach order sagasi ishga tushadi.
 *
 * ⚠️ Real Click/Payme adapterlari HALI YOZILMAGAN (docs/08 §2.5) — bu yerda
 *    manual/webhook capture oqimi (naqd/bank/test uchun to'liq).
 */
@Injectable()
export class PaymentService {
  private readonly log = new Logger(PaymentService.name);

  constructor(
    private readonly repo: PaymentRepository,
    @Inject(ORDER_PORT) private readonly orders: OrderPort,
    private readonly registry: PaymentProviderRegistry,
    private readonly audit: AuditService,
  ) {}

  getById(id: string): Promise<PaymentRow | null> {
    return this.repo.findById(id);
  }

  /** Buyurtmaning to'lovlari (admin ko'rinishi). */
  listByOrder(orderId: string): Promise<PaymentRow[]> {
    return this.repo.findByOrder(orderId);
  }

  /**
   * Muddati o'tgan PENDING to'lovlarni EXPIRED qilish (docs/08 §4 — invoice TTL).
   * ⚠️ Rezervlar alohida sweeper bilan bo'shaydi; buyurtma PENDING_PAYMENT'da qoladi
   *    (mijoz yangi to'lov yaratishi mumkin). Cron chaqiradi.
   */
  async expireStalePayments(ttlMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - ttlMinutes * 60_000);
    const count = await this.repo.expireStale(cutoff);
    if (count > 0) {
      this.log.log(`Muddati o‘tgan to‘lov EXPIRED: ${String(count)}`);
    }
    return count;
  }

  /** Dashboard tushumi — to'langan/qaytarilgan/sof (TIYIN string). */
  async revenueStats(): Promise<{ paidTotal: string; refundedTotal: string; net: string }> {
    const { paidTotal, refundedTotal } = await this.repo.revenueStats();
    return {
      paidTotal: paidTotal.toString(),
      refundedTotal: refundedTotal.toString(),
      net: (paidTotal - refundedTotal).toString(),
    };
  }

  /** To'lov yaratish (PENDING) — buyurtma PENDING_PAYMENT'ga o'tadi. Idempotent. */
  async createPayment(input: CreatePaymentInput): Promise<PaymentRow> {
    const existing = await this.repo.findByIdempotencyKey(input.idempotencyKey);
    if (existing !== null) {
      return existing; // idempotent: bir kalit → bir to'lov
    }
    const order = await this.orders.getPayableOrder(input.orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', input.orderId);
    }
    await this.orders.markPendingPayment(input.orderId);
    return await this.repo.create({
      orderId: input.orderId,
      provider: input.provider,
      amount: order.totalAmount,
      currency: order.currency,
      idempotencyKey: input.idempotencyKey,
    });
  }

  /**
   * To'lovni tasdiqlash (webhook/manual capture). ⚠️ amount tekshiriladi;
   * takror (PAID) — jim OK; muvaffaqiyatda ledger + order sagasi.
   */
  async confirmPayment(input: ConfirmPaymentInput): Promise<PaymentRow> {
    const payment = await this.repo.findById(input.paymentId);
    if (payment === null) {
      throw new NotFoundError('To‘lov', input.paymentId);
    }
    if (payment.status === 'PAID') {
      return payment; // webhook takrori — idempotent
    }
    if (!canTransition(payment.status, 'PAID')) {
      throw new ConflictError('To‘lov bu holatda tasdiqlanmaydi', { status: payment.status });
    }

    // ⚠️ (1) Summa tekshiruvi — kam to'lov PAID qilmaydi (§4.3, hujum vektori).
    if (input.amount !== payment.amount) {
      await this.repo.casTransition(payment.id, payment.status, 'FAILED', {
        failureReason: 'AMOUNT_MISMATCH',
      });
      // ⚠️ Xavfsizlik hodisasi — audit (docs/11 §11): summa mos kelmadi.
      await this.audit.record({
        action: 'PAYMENT_AMOUNT_MISMATCH',
        resourceType: 'Payment',
        resourceId: payment.id,
        after: { expected: payment.amount.toString(), got: input.amount.toString() },
      });
      throw new BusinessRuleError('AMOUNT_MISMATCH', 'To‘lov summasi buyurtma summasiga teng emas', {
        expected: payment.amount.toString(),
        got: input.amount.toString(),
      });
    }

    // (3) Muvozanatli ledger — CAS bilan bitta tranzaksiyada.
    const entries = buildSaleLedger(payment.provider, payment.amount);
    if (!isBalanced(entries)) {
      throw new Error('Ledger nomuvozanat — invariant buzildi'); // kod bug'i
    }
    const paid = await this.repo.markPaidWithLedger(
      payment.id,
      payment.orderId,
      { paidAt: new Date(), ...(input.providerTransactionId !== undefined && { providerTransactionId: input.providerTransactionId }) },
      randomUUID(),
      entries,
    );
    if (!paid) {
      // (2) Konkurent tasdiq — kimdir oldin PAID qildi → idempotent OK.
      const fresh = await this.repo.findById(payment.id);
      if (fresh?.status === 'PAID') {
        return fresh;
      }
      throw new ConflictError('To‘lov holati o‘zgardi');
    }

    // ⚠️ Audit (docs/11 §11): to'lov qabul qilindi (pul harakati).
    await this.audit.record({
      action: 'PAYMENT_CAPTURED',
      resourceType: 'Payment',
      resourceId: payment.id,
      after: { status: 'PAID', amount: payment.amount.toString(), provider: payment.provider },
    });

    // To'lov o'tdi → order sagasi (PENDING_PAYMENT → PAID → CONFIRMED + rezerv).
    await this.orders.onPaymentSucceeded(payment.orderId);
    this.log.log(`To‘lov PAID: ${payment.id} (${payment.amount.toString()} tiyin)`);
    return (await this.repo.findById(payment.id)) ?? payment;
  }

  /**
   * QO'LDA capture (docs/08 §4.4) — inson tasdiqlaydi (naqd: kuryer/kassir; bank
   * o'tkazmasi: buxgalter). ⚠️ FAQAT `manual` tasdiqli provayderlar: webhook'li
   * provayder (Click/Payme) qo'lda tasdiqlanmaydi — u provayder imzosi bilan
   * keladi (aks holda tashqi haqiqatsiz "to'landi" deb belgilash — pul yo'qolishi).
   * Summa = to'lovning o'z summasi (to'liq olindi). Idempotent (PAID → jim OK).
   */
  async captureManual(paymentId: string): Promise<PaymentRow> {
    const payment = await this.repo.findById(paymentId);
    if (payment === null) {
      throw new NotFoundError('To‘lov', paymentId);
    }
    const code = fromDbProvider(payment.provider);
    const mode = code !== null ? this.registry.get(code).capabilities.confirmation : 'webhook';
    if (mode !== 'manual') {
      throw new BusinessRuleError(
        'NOT_MANUAL_CAPTURE',
        'Bu provayder qo‘lda tasdiqlanmaydi — webhook orqali keladi',
        { provider: payment.provider },
      );
    }
    return await this.confirmPayment({ paymentId, amount: payment.amount });
  }

  /**
   * Provayder settlement (docs/08 §6.5): onlayn to'lov puli bankka tushdi —
   * receivable.provider → cash.bank + komissiya (expense.provider_fee). Buxgalter
   * amali. ⚠️ IDEMPOTENT (takroriy settlement receivable'ni ikki marta yopmaydi).
   */
  async settle(paymentId: string, feeAmount: bigint): Promise<PaymentRow> {
    const payment = await this.repo.findById(paymentId);
    if (payment === null) {
      throw new NotFoundError('To‘lov', paymentId);
    }
    if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new ConflictError('Settlement faqat to‘langan to‘lov uchun', { status: payment.status });
    }
    // Faqat onlayn (receivable.provider) to'lovlar settlement qilinadi.
    if (landingAccountFor(payment.provider) !== ACCOUNTS.RECEIVABLE_PROVIDER) {
      throw new BusinessRuleError('NOT_SETTLEABLE', 'Faqat onlayn provayder to‘lovi settlement qilinadi', { provider: payment.provider });
    }
    if (feeAmount < 0n || feeAmount > payment.amount) {
      throw new BusinessRuleError('INVALID_FEE', 'Komissiya 0 va summa oralig‘ida bo‘lishi kerak');
    }
    if (await this.repo.hasSettlement(paymentId)) {
      throw new ConflictError('To‘lov allaqachon settlement qilingan');
    }

    const entries = buildSettlementLedger(payment.amount, feeAmount);
    if (!isBalanced(entries)) {
      throw new Error('Settlement ledger nomuvozanat');
    }
    await this.repo.recordSettlement(paymentId, randomUUID(), entries);
    await this.audit.record({
      action: 'PAYMENT_SETTLED',
      resourceType: 'Payment',
      resourceId: paymentId,
      after: { amount: payment.amount.toString(), fee: feeAmount.toString(), provider: payment.provider },
    });
    this.log.log(`Settlement: ${paymentId} (fee ${feeAmount.toString()} tiyin)`);
    return payment;
  }

  /**
   * ⚠️ DEV/DEMO: onlayn to'lovni MOCK webhook bilan yakunlash (real Click/Payme
   * o'rniga, docs/08 §2.5 MOCK qarori). PROD'da o'chirilgan. To'lov→PAID→order saga.
   */
  async simulateWebhook(paymentId: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new BusinessRuleError('SIMULATION_DISABLED', 'Simulyatsiya production‘da o‘chirilgan');
    }
    const payment = await this.repo.findById(paymentId);
    if (payment === null) {
      throw new NotFoundError('To‘lov', paymentId);
    }
    const providerCode: PaymentProviderCode = fromDbProvider(payment.provider) ?? 'click';
    await this.applyWebhookEvent({
      providerCode,
      providerEventId: randomUUID(),
      providerTransactionId: `sim-${paymentId}`,
      paymentId,
      occurredAt: new Date(),
      state: { status: 'paid', providerTransactionId: `sim-${paymentId}`, paidAmount: payment.amount, paidAt: new Date(), raw: { mock: true } },
    });
  }

  /**
   * Webhook hodisasini qo'llash (docs/08 §5.5). Adapter imzoni tekshirib
   * NORMALLASHTIRGAN hodisani beradi; bu yer faqat domen mantiqini bajaradi:
   * to'lovni topish → holatga qarab tasdiqlash/rad etish.
   *
   * ⚠️ IDEMPOTENT: takror webhook (provayder javobni olmay qayta yuboradi) —
   *    to'lov allaqachon PAID bo'lsa confirmPayment jim OK qaytaradi (bir ledger).
   * ⚠️ Replay oynasi (§11.4) — belt&suspenders (adapter ham parseWebhook'da tekshiradi).
   */
  async applyWebhookEvent(event: NormalizedWebhookEvent): Promise<void> {
    assertFresh(event.occurredAt, new Date());

    const dbProvider = toDbProvider(event.providerCode);
    // Merchant order id (= paymentId) afzal; bo'lmasa provayder tranzaksiya ID'si.
    const payment =
      event.paymentId !== null
        ? await this.repo.findById(event.paymentId)
        : await this.repo.findByProviderTransaction(dbProvider, event.providerTransactionId);

    if (payment === null) {
      throw new UnknownTransactionError(event.providerTransactionId);
    }
    if (payment.provider !== dbProvider) {
      // Yetim/noto'g'ri marshrutlangan webhook — provayder to'lovga mos emas.
      throw new UnknownTransactionError(event.providerTransactionId);
    }

    switch (event.state.status) {
      case 'paid': {
        if (event.state.paidAmount === null) {
          throw new BusinessRuleError('WEBHOOK_NO_AMOUNT', 'Webhook PAID, lekin summa yo‘q');
        }
        // Uch himoyaning hammasi confirmPayment ichida (amount/CAS/ledger + saga).
        await this.confirmPayment({
          paymentId: payment.id,
          amount: event.state.paidAmount,
          providerTransactionId: event.providerTransactionId,
        });
        return;
      }
      case 'failed':
      case 'cancelled':
      case 'expired': {
        // Faqat hali yakunlanmagan to'lovni bekor qilamiz (PAID'ga tegilmaydi).
        if (payment.status === 'PENDING' || payment.status === 'CREATED') {
          const target = event.state.status === 'expired' ? 'EXPIRED' : event.state.status === 'cancelled' ? 'CANCELLED' : 'FAILED';
          await this.repo.casTransition(payment.id, payment.status, target, {
            failureReason: `webhook:${event.state.status}`,
            ...(event.providerTransactionId !== '' && { providerTransactionId: event.providerTransactionId }),
          });
        }
        return;
      }
      default:
        // pending/unknown/refunded — webhook orqali hech narsa qilmaymiz.
        return;
    }
  }

  /**
   * Refund (docs/08 §6.6-6.7, §8.4): teskari MUVOZANATLI ledger yozuv + payment
   * REFUNDED/PARTIALLY_REFUNDED. To'liq refund → buyurtma bekor (rezerv release).
   * ⚠️ Idempotent (Refund.idempotencyKey); qolgandan oshiq refund rad etiladi.
   */
  async refund(input: RefundInput): Promise<RefundRow> {
    const existing = await this.repo.findRefundByIdempotencyKey(input.idempotencyKey);
    if (existing !== null) {
      return existing; // idempotent
    }
    if (input.amount <= 0n) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Refund summasi musbat bo‘lishi kerak');
    }
    const payment = await this.repo.findById(input.paymentId);
    if (payment === null) {
      throw new NotFoundError('To‘lov', input.paymentId);
    }
    if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new ConflictError('Faqat to‘langan to‘lov qaytariladi', { status: payment.status });
    }

    const alreadyRefunded = await this.repo.sumRefunds(payment.id);
    const remaining = payment.amount - alreadyRefunded;
    if (input.amount > remaining) {
      throw new BusinessRuleError('REFUND_EXCEEDS', 'Refund summasi qolgan summadan oshib ketdi', {
        remaining: remaining.toString(),
      });
    }

    const target = alreadyRefunded + input.amount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    if (!canTransition(payment.status, 'REFUND_REQUESTED') || !canTransition('REFUND_REQUESTED', target)) {
      throw new ConflictError('Refund holat o‘tishi mumkin emas');
    }

    const entries = buildRefundLedger(payment.provider, input.amount);
    if (!isBalanced(entries)) {
      throw new Error('Refund ledger nomuvozanat — invariant buzildi');
    }
    const ok = await this.repo.refundAtomic(
      payment.id,
      payment.status,
      target,
      { amount: input.amount, currency: payment.currency, reason: input.reason, idempotencyKey: input.idempotencyKey },
      randomUUID(),
      entries,
    );
    if (!ok) {
      const raced = await this.repo.findRefundByIdempotencyKey(input.idempotencyKey);
      if (raced !== null) {
        return raced;
      }
      throw new ConflictError('Refund holati o‘zgardi');
    }

    // ⚠️ Audit (docs/11 §11): refund — sabab MAJBURIY (§ chegirma/tuzatish).
    await this.audit.record({
      action: 'PAYMENT_REFUNDED',
      resourceType: 'Payment',
      resourceId: payment.id,
      after: { amount: input.amount.toString(), target, reason: input.reason },
    });

    // To'liq refund → buyurtmani bekor qilish (rezerv release).
    if (target === 'REFUNDED') {
      await this.orders.cancelForRefund(payment.orderId);
    }
    this.log.log(`Refund: ${payment.id} (${input.amount.toString()} tiyin, ${target})`);
    const created = await this.repo.findRefundByIdempotencyKey(input.idempotencyKey);
    if (created === null) {
      throw new Error('Refund yaratildi, lekin topilmadi'); // kutilmagan
    }
    return created;
  }
}
