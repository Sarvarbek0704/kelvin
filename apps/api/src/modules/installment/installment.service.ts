import { Inject, Injectable } from '@nestjs/common';

import { BusinessRuleError, ConflictError, NotFoundError } from '../../core/errors/domain.error';
import { computeInstallment } from '../../core/installment/installment-calc';
import { buildInstallmentPaymentLedger, buildInstallmentPlanLedger, isBalanced } from '../../core/payment/ledger';
import { ORDER_PORT, type OrderPort } from '../order/order.port';
import { InstallmentRepository, type PlanRow, type ScheduleRow } from './installment.repository';

export interface PlanView {
  readonly id: string;
  readonly orderId: string;
  readonly kind: string;
  readonly status: string;
  readonly principalAmount: string;
  readonly downPaymentAmount: string;
  readonly totalPayableAmount: string;
  readonly interestRateBp: number;
  readonly termMonths: number;
  readonly schedule: readonly {
    readonly id: string;
    readonly installmentNumber: number;
    readonly dueDate: string;
    readonly amount: string;
    readonly paidAmount: string;
    readonly status: string;
  }[];
}

export function toPlanView(p: PlanRow): PlanView {
  return {
    id: p.id,
    orderId: p.orderId,
    kind: p.kind,
    status: p.status,
    principalAmount: p.principalAmount.toString(),
    downPaymentAmount: p.downPaymentAmount.toString(),
    totalPayableAmount: p.totalPayableAmount.toString(),
    interestRateBp: p.interestRateBp,
    termMonths: p.termMonths,
    schedule: p.schedule.map((s) => ({
      id: s.id,
      installmentNumber: s.installmentNumber,
      dueDate: s.dueDate.toISOString().slice(0, 10),
      amount: s.amount.toString(),
      paidAmount: s.paidAmount.toString(),
      status: s.status,
    })),
  };
}

/**
 * installment — rassrochka QO'LDA rejim (docs/08 §7). ⚠️ Tashqi provayder/litsenziya
 * YO'Q — do'kon o'zining (kind=OWN) ichki rassrochkasi. Grafik `Money.allocate` bilan
 * (tiyin yo'qolmaydi); har to'lov double-entry ledger'ga tushadi.
 */
@Injectable()
export class InstallmentService {
  constructor(
    private readonly repo: InstallmentRepository,
    @Inject(ORDER_PORT) private readonly orders: OrderPort,
  ) {}

  /** Buyurtma uchun rassrochka rejasi yaratish. Order CONFIRMED bo'lishi kerak. */
  async createPlanForOrder(input: {
    orderId: string;
    kind?: string;
    provider?: string;
    downPaymentAmount?: bigint;
    interestRateBp?: number;
    termMonths: number;
    firstDueDate: Date;
  }): Promise<PlanRow> {
    const order = await this.orders.getPayableOrder(input.orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', input.orderId);
    }
    if (order.status !== 'CONFIRMED') {
      throw new ConflictError('Rassrochka faqat CONFIRMED buyurtma uchun', { status: order.status });
    }
    if ((await this.repo.findPlanByOrder(input.orderId)) !== null) {
      throw new ConflictError('Buyurtma uchun rassrochka allaqachon mavjud');
    }

    const downPaymentAmount = input.downPaymentAmount ?? 0n;
    const comp = computeInstallment({
      orderTotal: order.totalAmount,
      downPayment: downPaymentAmount,
      interestRateBp: input.interestRateBp ?? 0,
      termMonths: input.termMonths,
    });

    const lines = comp.lines.map((l) => ({
      installmentNumber: l.installmentNumber,
      dueDate: addMonths(input.firstDueDate, l.installmentNumber - 1),
      amount: l.amount,
    }));

    const ledger = buildInstallmentPlanLedger(comp.totalPayable);
    if (!isBalanced(ledger)) {
      throw new Error('Rassrochka ledger nomuvozanat'); // kod bug'i
    }

    return await this.repo.createPlan(
      {
        orderId: input.orderId,
        kind: input.kind ?? 'OWN',
        principalAmount: comp.principal,
        downPaymentAmount,
        totalPayableAmount: comp.totalPayable,
        interestRateBp: input.interestRateBp ?? 0,
        termMonths: input.termMonths,
        lines,
        ...(input.provider !== undefined && { provider: input.provider }),
      },
      ledger,
    );
  }

  /** Grafik qatoriga to'lov qabul qilish (kassir). Ledger'ga tushadi. */
  async recordPayment(scheduleId: string, amount: bigint): Promise<ScheduleRow> {
    if (amount <= 0n) {
      throw new BusinessRuleError('INVALID_AMOUNT', 'To‘lov summasi musbat bo‘lishi kerak');
    }
    const line = await this.repo.findSchedule(scheduleId);
    if (line === null) {
      throw new NotFoundError('Grafik qatori', scheduleId);
    }
    if (line.status === 'PAID') {
      throw new ConflictError('Bu oy allaqachon to‘langan');
    }
    const newPaid = line.paidAmount + amount;
    if (newPaid > line.amount) {
      throw new BusinessRuleError('OVERPAY', 'To‘lov oylik summadan oshib ketdi', {
        remaining: (line.amount - line.paidAmount).toString(),
      });
    }
    const fullyPaid = newPaid === line.amount;
    const ledger = buildInstallmentPaymentLedger(amount);
    return await this.repo.recordPayment(
      scheduleId,
      { paidAmount: newPaid, status: fullyPaid ? 'PAID' : 'PENDING', paidAt: fullyPaid ? new Date() : null },
      ledger,
    );
  }

  getPlan(id: string): Promise<PlanRow | null> {
    return this.repo.findPlan(id);
  }

  listPlans(params: { cursor?: string; limit?: number }): Promise<{ items: PlanRow[]; nextCursor: string | null }> {
    return this.repo.listPlans({
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }
}

/** Sanaga oy qo'shish (UTC). ⚠️ Oxirgi kun oshib ketsa oy oxiriga tushmaydi — sodda. */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}
