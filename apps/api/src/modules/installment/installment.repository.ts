import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type LedgerEntryDraft } from '../../core/payment/ledger';

export type PlanRow = Prisma.InstallmentPlanGetPayload<{ include: { schedule: true } }>;
export type ScheduleRow = Prisma.InstallmentScheduleGetPayload<Record<string, never>>;

export interface CreatePlanData {
  orderId: string;
  kind: string;
  provider?: string;
  principalAmount: bigint;
  downPaymentAmount: bigint;
  totalPayableAmount: bigint;
  interestRateBp: number;
  termMonths: number;
  lines: { installmentNumber: number; dueDate: Date; amount: bigint }[];
}

/** installment — rassrochka (docs/08 §7). Prisma faqat shu qatlamda. */
@Injectable()
export class InstallmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** ⚠️ Reja + grafik + ochilish ledger'i — BITTA tranzaksiya. */
  async createPlan(data: CreatePlanData, ledger: readonly LedgerEntryDraft[]): Promise<PlanRow> {
    const transactionId = randomUUID();
    return await this.prisma.$transaction(async (tx) => {
      const plan = await tx.installmentPlan.create({
        data: {
          orderId: data.orderId,
          kind: data.kind,
          principalAmount: data.principalAmount,
          downPaymentAmount: data.downPaymentAmount,
          totalPayableAmount: data.totalPayableAmount,
          interestRateBp: data.interestRateBp,
          termMonths: data.termMonths,
          status: 'PENDING',
          ...(data.provider !== undefined && { provider: data.provider }),
          schedule: {
            create: data.lines.map((l) => ({
              installmentNumber: l.installmentNumber,
              dueDate: l.dueDate,
              amount: l.amount,
            })),
          },
        },
        include: { schedule: { orderBy: { installmentNumber: 'asc' } } },
      });
      await tx.ledgerEntry.createMany({
        data: ledger.map((e) => ({ transactionId, account: e.account, direction: e.direction, amount: e.amount, ...(e.description !== undefined && { description: e.description }) })),
      });
      return plan;
    });
  }

  findPlan(id: string): Promise<PlanRow | null> {
    return this.prisma.installmentPlan.findUnique({ where: { id }, include: { schedule: { orderBy: { installmentNumber: 'asc' } } } });
  }

  findPlanByOrder(orderId: string): Promise<PlanRow | null> {
    return this.prisma.installmentPlan.findUnique({ where: { orderId }, include: { schedule: { orderBy: { installmentNumber: 'asc' } } } });
  }

  findSchedule(id: string): Promise<ScheduleRow | null> {
    return this.prisma.installmentSchedule.findUnique({ where: { id } });
  }

  /**
   * ⚠️ To'lov: grafik qatorini yangilash + ledger — BITTA tranzaksiya. Barcha
   * qatorlar to'liq to'lansa reja PAID bo'ladi.
   */
  async recordPayment(
    scheduleId: string,
    patch: { paidAmount: bigint; status: ScheduleRow['status']; paidAt: Date | null },
    ledger: readonly LedgerEntryDraft[],
  ): Promise<ScheduleRow> {
    const transactionId = randomUUID();
    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.installmentSchedule.update({
        where: { id: scheduleId },
        data: { paidAmount: patch.paidAmount, status: patch.status, paidAt: patch.paidAt },
      });
      await tx.ledgerEntry.createMany({
        data: ledger.map((e) => ({ transactionId, account: e.account, direction: e.direction, amount: e.amount, ...(e.description !== undefined && { description: e.description }) })),
      });
      // Barcha qatorlar PAID bo'lsa → reja PAID.
      const remaining = await tx.installmentSchedule.count({ where: { planId: updated.planId, status: { not: 'PAID' } } });
      if (remaining === 0) {
        await tx.installmentPlan.update({ where: { id: updated.planId }, data: { status: 'PAID' } });
      }
      return updated;
    });
  }

  async listPlans(params: { cursor?: string; limit: number }): Promise<{ items: PlanRow[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.installmentPlan.findMany({
      include: { schedule: { orderBy: { installmentNumber: 'asc' } } },
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }
}
