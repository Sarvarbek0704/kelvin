import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { OutboxService } from '../../shared/outbox/outbox.service';
import { type PaymentStatus } from '../../core/payment/payment-state';
import { type LedgerEntryDraft } from '../../core/payment/ledger';

export type PaymentRow = Prisma.PaymentGetPayload<Record<string, never>>;
export type RefundRow = Prisma.RefundGetPayload<Record<string, never>>;

/** To'lov — Prisma qatlami (docs/08). O'tish CAS (compare-and-set, §4.3). */
@Injectable()
export class PaymentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  create(data: {
    orderId: string;
    provider: string;
    amount: bigint;
    currency: string;
    idempotencyKey: string;
  }): Promise<PaymentRow> {
    return this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: data.provider as Prisma.PaymentCreateInput['provider'],
        status: 'PENDING',
        amount: data.amount,
        currency: data.currency,
        idempotencyKey: data.idempotencyKey,
      },
    });
  }

  findById(id: string): Promise<PaymentRow | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  /** Buyurtmaning to'lovlari — yangi birinchi (admin ko'rinishi). */
  findByOrder(orderId: string): Promise<PaymentRow[]> {
    return this.prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } });
  }

  /** ⚠️ Muddati o'tgan PENDING to'lovlarni EXPIRED qilish (TTL job). @returns soni. */
  async expireStale(olderThan: Date): Promise<number> {
    const res = await this.prisma.payment.updateMany({
      where: { status: 'PENDING', createdAt: { lt: olderThan } },
      data: { status: 'EXPIRED', failureReason: 'TTL_EXPIRED' },
    });
    return res.count;
  }

  /**
   * Dashboard tushumi: to'langan (PAID/PARTIALLY_REFUNDED) summasi va qaytarilgan
   * (REFUNDED) summasi. Sof = to'langan − qaytarilgan. ⚠️ TIYIN (bigint).
   */
  async revenueStats(): Promise<{ paidTotal: bigint; refundedTotal: bigint }> {
    const paid = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
    });
    const refunded = await this.prisma.refund.aggregate({
      _sum: { amount: true },
      where: { status: 'REFUNDED' },
    });
    return { paidTotal: paid._sum.amount ?? 0n, refundedTotal: refunded._sum.amount ?? 0n };
  }

  findByIdempotencyKey(key: string): Promise<PaymentRow | null> {
    return this.prisma.payment.findUnique({ where: { idempotencyKey: key } });
  }

  /** Webhook resolyutsiyasi: provayder + uning tranzaksiya ID'si bo'yicha (§5.5). */
  findByProviderTransaction(provider: string, providerTransactionId: string): Promise<PaymentRow | null> {
    return this.prisma.payment.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: provider as PaymentRow['provider'],
          providerTransactionId,
        },
      },
    });
  }

  /**
   * ⚠️ CAS o'tish (docs/08 §4.3): status hali ham `from` bo'lsagina yozadi.
   * @returns true = o'tish bajarildi; false = kimdir bizdan oldin ulgurdi.
   */
  async casTransition(
    id: string,
    from: PaymentStatus,
    to: PaymentStatus,
    patch: Prisma.PaymentUpdateManyMutationInput = {},
  ): Promise<boolean> {
    const res = await this.prisma.payment.updateMany({
      where: { id, status: from },
      data: { ...patch, status: to },
    });
    return res.count === 1;
  }

  /**
   * ⚠️ ATOMIK: CAS PENDING→PAID + muvozanatli ledger yozuvlari — bitta
   * tranzaksiya. CAS yutqazsa (count 0) ledger yozilmaydi (rollback).
   * @returns true = to'lov PAID bo'ldi va ledger yozildi; false = kimdir oldin ulgurdi.
   */
  async markPaidWithLedger(
    paymentId: string,
    orderId: string,
    patch: Prisma.PaymentUpdateManyMutationInput,
    transactionId: string,
    entries: readonly LedgerEntryDraft[],
  ): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      const res = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { ...patch, status: 'PAID' },
      });
      if (res.count !== 1) {
        return false;
      }
      await tx.ledgerEntry.createMany({
        data: entries.map((e) => ({
          transactionId,
          paymentId,
          account: e.account,
          direction: e.direction,
          amount: e.amount,
          ...(e.description !== undefined && { description: e.description }),
        })),
      });
      // ⚠️ Transactional outbox (ADR-0004): saga trigger'i PAID bilan ATOMIK yoziladi.
      //    Worker consumer'i onPaymentSucceeded'ni IDEMPOTENT chaqiradi (durability —
      //    process to'g'ridan-to'g'ri chaqiruvdan oldin yiqilsa, relay qayta uradi).
      await this.outbox.enqueue(
        { eventType: 'PaymentSucceeded', aggregateType: 'Order', aggregateId: orderId, payload: { paymentId } },
        tx,
      );
      return true;
    });
  }

  findRefundByIdempotencyKey(key: string): Promise<RefundRow | null> {
    return this.prisma.refund.findUnique({ where: { idempotencyKey: key } });
  }

  /** Settlement bo'lganmi — receivable.provider'ga CREDIT yozuv borligi bilan (§6.5). */
  async hasSettlement(paymentId: string): Promise<boolean> {
    const count = await this.prisma.ledgerEntry.count({
      where: { paymentId, account: 'asset.receivable.provider', direction: 'CREDIT' },
    });
    return count > 0;
  }

  /** Settlement ledger yozuvlari (append-only, bitta transactionId). */
  async recordSettlement(paymentId: string, transactionId: string, entries: readonly LedgerEntryDraft[]): Promise<void> {
    await this.prisma.ledgerEntry.createMany({
      data: entries.map((e) => ({ transactionId, paymentId, account: e.account, direction: e.direction, amount: e.amount, ...(e.description !== undefined && { description: e.description }) })),
    });
  }

  async sumRefunds(paymentId: string): Promise<bigint> {
    const res = await this.prisma.refund.aggregate({
      where: { paymentId, status: 'REFUNDED' },
      _sum: { amount: true },
    });
    return res._sum.amount ?? 0n;
  }

  /**
   * ⚠️ ATOMIK refund: payment ikki-CAS o'tish (from → REFUND_REQUESTED → target,
   * holat mashinasi §4.2) + Refund yozuvi + teskari ledger — bitta tranzaksiya.
   * @returns true = refund yozildi; false = holat kutilganidan boshqa (konkurent).
   */
  async refundAtomic(
    paymentId: string,
    fromStatus: PaymentStatus,
    targetStatus: PaymentStatus,
    refund: { amount: bigint; currency: string; reason: string; idempotencyKey: string },
    transactionId: string,
    entries: readonly LedgerEntryDraft[],
  ): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      const r1 = await tx.payment.updateMany({
        where: { id: paymentId, status: fromStatus },
        data: { status: 'REFUND_REQUESTED' },
      });
      if (r1.count !== 1) {
        return false;
      }
      const r2 = await tx.payment.updateMany({
        where: { id: paymentId, status: 'REFUND_REQUESTED' },
        data: { status: targetStatus },
      });
      if (r2.count !== 1) {
        return false;
      }
      await tx.refund.create({
        data: {
          paymentId,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          status: 'REFUNDED',
          idempotencyKey: refund.idempotencyKey,
          refundedAt: new Date(),
        },
      });
      await tx.ledgerEntry.createMany({
        data: entries.map((e) => ({
          transactionId,
          paymentId,
          account: e.account,
          direction: e.direction,
          amount: e.amount,
          ...(e.description !== undefined && { description: e.description }),
        })),
      });
      return true;
    });
  }
}
