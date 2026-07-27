import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type LedgerEntryDraft } from '../../core/payment/ledger';

export type ShiftRow = Prisma.PosShiftGetPayload<Record<string, never>>;
export type TransactionRow = Prisma.PosTransactionGetPayload<{ include: { items: true } }>;

export interface CreateTxData {
  shiftId: string;
  paymentMethod: string;
  totalAmount: bigint;
  warehouseId: string;
  items: { variantId: string; sku: string; quantity: number; unitAmount: bigint; totalAmount: bigint }[];
}

/** pos — kassa (docs/15 §10). Prisma faqat shu qatlamda. */
@Injectable()
export class PosRepository {
  constructor(private readonly prisma: PrismaService) {}

  openShift(userId: string, openingCashAmount: bigint): Promise<ShiftRow> {
    return this.prisma.posShift.create({ data: { userId, openingCashAmount, status: 'OPEN' } });
  }

  findOpenShift(userId: string): Promise<ShiftRow | null> {
    return this.prisma.posShift.findFirst({ where: { userId, status: 'OPEN' } });
  }

  findShift(id: string): Promise<ShiftRow | null> {
    return this.prisma.posShift.findUnique({ where: { id } });
  }

  closeShift(id: string, closingCashAmount: bigint, cashDifferenceAmount: bigint): Promise<ShiftRow> {
    return this.prisma.posShift.update({
      where: { id },
      data: { status: 'CLOSED', closingCashAmount, cashDifferenceAmount, closedAt: new Date() },
    });
  }

  /** Smenadagi NAQD sotuvlar yig'indisi (kutilgan kassa hisobi uchun). */
  async cashSalesTotal(shiftId: string): Promise<bigint> {
    const res = await this.prisma.posTransaction.aggregate({
      where: { shiftId, paymentMethod: 'CASH', status: 'COMPLETED' },
      _sum: { totalAmount: true },
    });
    return res._sum.totalAmount ?? 0n;
  }

  /** ⚠️ Tranzaksiya + qatorlar + ledger — BITTA tranzaksiya. */
  async createTransaction(data: CreateTxData, ledger: readonly LedgerEntryDraft[]): Promise<TransactionRow> {
    const transactionId = randomUUID();
    return await this.prisma.$transaction(async (tx) => {
      const created = await tx.posTransaction.create({
        data: {
          shiftId: data.shiftId,
          number: `POS-${randomUUID().slice(0, 10).toUpperCase()}`,
          paymentMethod: data.paymentMethod,
          totalAmount: data.totalAmount,
          warehouseId: data.warehouseId,
          status: 'COMPLETED',
          items: { create: data.items.map((it) => ({ variantId: it.variantId, sku: it.sku, quantity: it.quantity, unitAmount: it.unitAmount, totalAmount: it.totalAmount })) },
        },
        include: { items: true },
      });
      await tx.ledgerEntry.createMany({
        data: ledger.map((e) => ({ transactionId, account: e.account, direction: e.direction, amount: e.amount, ...(e.description !== undefined && { description: e.description }) })),
      });
      return created;
    });
  }

  listTransactions(shiftId: string): Promise<TransactionRow[]> {
    return this.prisma.posTransaction.findMany({ where: { shiftId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }
}
