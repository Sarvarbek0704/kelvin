import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';

export type SupplierRow = Prisma.SupplierGetPayload<Record<string, never>>;
export type PurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<{ include: { items: true } }>;

export interface CreatePOItem {
  readonly variantId: string;
  readonly quantityOrdered: number;
  readonly unitCostAmount: bigint;
}

/** procurement — Prisma qatlami (docs/15 §8, Faza 6). PO raqami: `PO-YYYY-NNNNNN`. */
@Injectable()
export class ProcurementRepository {
  constructor(private readonly prisma: PrismaService) {}

  createSupplier(data: {
    name: string;
    code: string;
    phone?: string;
    leadTimeDays?: number;
  }): Promise<SupplierRow> {
    return this.prisma.supplier.create({
      data: {
        name: data.name,
        code: data.code,
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.leadTimeDays !== undefined && { leadTimeDays: data.leadTimeDays }),
      },
    });
  }

  findSupplier(id: string): Promise<SupplierRow | null> {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  listSuppliers(): Promise<SupplierRow[]> {
    return this.prisma.supplier.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  }

  findPO(id: string): Promise<PurchaseOrderWithItems | null> {
    return this.prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  }

  /** Xarid buyurtmalari — cursor pagination (⚠️ uuid7 → id desc = eng yangi). */
  async listPurchaseOrders(params: {
    status?: PurchaseOrderWithItems['status'];
    cursor?: string;
    limit: number;
  }): Promise<{ items: PurchaseOrderWithItems[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { ...(params.status !== undefined && { status: params.status }) },
      include: { items: true },
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }

  async createPurchaseOrder(
    input: { supplierId: string; warehouseId: string; totalAmount: bigint; currency: string },
    items: readonly CreatePOItem[],
    year: number,
  ): Promise<PurchaseOrderWithItems> {
    return await this.prisma.$transaction(async (tx) => {
      const number = await this.nextNumber(tx, year);
      return await tx.purchaseOrder.create({
        data: {
          number,
          supplierId: input.supplierId,
          warehouseId: input.warehouseId,
          status: 'DRAFT',
          totalAmount: input.totalAmount,
          currency: input.currency,
          items: {
            create: items.map((it) => ({
              variantId: it.variantId,
              quantityOrdered: it.quantityOrdered,
              unitCostAmount: it.unitCostAmount,
              currency: input.currency,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  updateStatus(
    id: string,
    status: string,
    patch: Prisma.PurchaseOrderUpdateInput = {},
  ): Promise<PurchaseOrderWithItems> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { ...patch, status },
      include: { items: true },
    });
  }

  async markItemReceived(itemId: string, quantityReceived: number): Promise<void> {
    await this.prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: { quantityReceived },
    });
  }

  private async nextNumber(tx: Prisma.TransactionClient, year: number): Promise<string> {
    const rows = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('purchase_order_number_seq')`;
    const seq = rows[0]?.nextval ?? 0n;
    return `PO-${String(year)}-${seq.toString().padStart(6, '0')}`;
  }
}
