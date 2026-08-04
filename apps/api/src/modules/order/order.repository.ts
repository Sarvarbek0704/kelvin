import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type JsonInput } from '../../shared/json';
import { type OrderStatus } from '../../core/order/order-status';

export type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;
export type OrderWithHistory = Prisma.OrderGetPayload<{ include: { items: true; statusHistory: true } }>;

export interface CreateOrderItemInput {
  readonly variantId: string;
  readonly sku: string;
  readonly productName: JsonInput;
  readonly variantAxis: JsonInput;
  readonly attributesSnapshot: JsonInput;
  readonly quantity: number;
  readonly unitAmount: bigint;
  readonly totalAmount: bigint;
  readonly currency: string;
}

export interface CreateOrderInput {
  readonly customerId: string;
  readonly subtotalAmount: bigint;
  readonly discountAmount: bigint;
  readonly deliveryAmount: bigint;
  readonly totalAmount: bigint;
  readonly currency: string;
  readonly appliedDiscounts: JsonInput;
  readonly items: readonly CreateOrderItemInput[];
  /** Mijoz tanlagan yetkazish parametrlari (checkout, ixtiyoriy). */
  readonly deliveryAddressId?: string;
  readonly deliverySlotId?: string;
  readonly customerNote?: string;
}

/** Buyurtma — Prisma qatlami (docs/07). Raqam: `KLV-YYYY-NNNNNN` (sequence). */
@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(orderId: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  }

  /** Buyurtma + qatorlar + holat tarixi (admin detali — timeline). */
  findByIdWithHistory(orderId: string): Promise<OrderWithHistory | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
  }

  /** Mijozning buyurtmalari — yangi birinchi (kabinet uchun). */
  findByCustomer(customerId: string, limit: number): Promise<OrderWithItems[]> {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Admin ro'yxati — cursor pagination + ixtiyoriy status filtri (docs/13).
   * ⚠️ uuid7 monoton (vaqt tartibli) → `id desc` = eng yangi birinchi; cursor
   *    ham id bo'yicha (barqaror, tiebreaker shart emas).
   */
  async listForAdmin(params: {
    status?: OrderStatus;
    limit: number;
    cursor?: string;
  }): Promise<{ items: OrderWithItems[]; nextCursor: string | null }> {
    const take = params.limit + 1; // bittasi ortiqcha — keyingi sahifa bor-yo'qligi
    const rows = await this.prisma.order.findMany({
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

  /**
   * Mijoz mahsulotni SOTIB OLGANMI — to'langan+ holatdagi buyurtmada shu
   * mahsulotning birorta varianti bo'lsa (docs/10, sharh tasdiqlangan xarid).
   */
  async hasPurchasedProduct(customerId: string, productId: string, purchasedStatuses: readonly OrderStatus[]): Promise<boolean> {
    const variants = await this.prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
    if (variants.length === 0) {
      return false;
    }
    const count = await this.prisma.order.count({
      where: {
        customerId,
        status: { in: [...purchasedStatuses] },
        items: { some: { variantId: { in: variants.map((v) => v.id) } } },
      },
    });
    return count > 0;
  }

  /** Holat bo'yicha buyurtmalar soni (dashboard). */
  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
  }

  /** Mijoz agregati (RFM) — to'langan+ buyurtmalar bo'yicha. */
  async customerAggregates(statuses: readonly OrderStatus[]): Promise<{ customerId: string; orderCount: number; totalSpent: bigint; lastOrderAt: Date | null }[]> {
    const rows = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { status: { in: [...statuses] } },
      _count: { _all: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true },
    });
    return rows.map((r) => ({ customerId: r.customerId, orderCount: r._count._all, totalSpent: r._sum.totalAmount ?? 0n, lastOrderAt: r._max.createdAt }));
  }

  /** Mahsulot sotuv agregati (ABC) — item→variant→product join (raw). */
  async productSalesAggregates(statuses: readonly OrderStatus[]): Promise<{ productId: string; unitsSold: number; revenue: bigint }[]> {
    const rows = await this.prisma.$queryRaw<{ product_id: string; units: bigint; revenue: bigint }[]>`
      SELECT pv.product_id, SUM(oi.quantity)::bigint AS units, SUM(oi.total_amount)::bigint AS revenue
      FROM order_items oi
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = ANY(${[...statuses]}::text[]::"OrderStatus"[])
      GROUP BY pv.product_id
      ORDER BY revenue DESC`;
    return rows.map((r) => ({ productId: r.product_id, unitsSold: Number(r.units), revenue: r.revenue }));
  }

  /** Umumiy sotuv xulosasi. */
  async salesSummary(statuses: readonly OrderStatus[]): Promise<{ orderCount: number; totalRevenue: bigint }> {
    const agg = await this.prisma.order.aggregate({ where: { status: { in: [...statuses] } }, _count: { _all: true }, _sum: { totalAmount: true } });
    return { orderCount: agg._count._all, totalRevenue: agg._sum.totalAmount ?? 0n };
  }

  /** DRAFT buyurtma + qatorlar + boshlang'ich status tarixi — bitta tranzaksiya. */
  async createDraft(input: CreateOrderInput, year: number): Promise<OrderWithItems> {
    return await this.prisma.$transaction(async (tx) => {
      const number = await this.nextNumber(tx, year);
      return await tx.order.create({
        data: {
          number,
          customerId: input.customerId,
          status: 'DRAFT',
          channel: 'ONLINE',
          subtotalAmount: input.subtotalAmount,
          discountAmount: input.discountAmount,
          deliveryAmount: input.deliveryAmount,
          totalAmount: input.totalAmount,
          currency: input.currency,
          appliedDiscounts: input.appliedDiscounts,
          ...(input.deliveryAddressId !== undefined && { deliveryAddressId: input.deliveryAddressId }),
          ...(input.deliverySlotId !== undefined && { deliverySlotId: input.deliverySlotId }),
          ...(input.customerNote !== undefined && { customerNote: input.customerNote }),
          items: {
            create: input.items.map((it) => ({
              variantId: it.variantId,
              sku: it.sku,
              productName: it.productName,
              variantAxis: it.variantAxis,
              attributesSnapshot: it.attributesSnapshot,
              quantity: it.quantity,
              unitAmount: it.unitAmount,
              totalAmount: it.totalAmount,
              currency: it.currency,
            })),
          },
          statusHistory: { create: { toStatus: 'DRAFT', reason: 'checkout' } },
        },
        include: { items: true },
      });
    });
  }

  /** Holat o'zgartirish + tarix (bitta tranzaksiya). Terminal vaqt belgilarini qo'yadi. */
  async transitionStatus(
    orderId: string,
    from: OrderStatus,
    to: OrderStatus,
    actorUserId?: string,
    reason?: string,
  ): Promise<OrderWithItems> {
    return await this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = { status: to };
      if (to === 'PENDING_PAYMENT') {
        data.placedAt = new Date();
      } else if (to === 'CANCELLED') {
        data.cancelledAt = new Date();
        if (reason !== undefined) {
          data.cancelReason = reason;
        }
      } else if (to === 'COMPLETED') {
        data.completedAt = new Date();
      }
      const order = await tx.order.update({ where: { id: orderId }, data, include: { items: true } });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: from,
          toStatus: to,
          ...(actorUserId !== undefined && { actorUserId }),
          ...(reason !== undefined && { reason }),
        },
      });
      return order;
    });
  }

  private async nextNumber(tx: Prisma.TransactionClient, year: number): Promise<string> {
    const rows = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq')`;
    const seq = rows[0]?.nextval ?? 0n;
    return `KLV-${String(year)}-${seq.toString().padStart(6, '0')}`;
  }
}
