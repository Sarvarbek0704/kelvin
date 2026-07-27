import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';

export type StockItemRow = Prisma.StockItemGetPayload<Record<string, never>>;
export type ReservationRow = Prisma.StockReservationGetPayload<Record<string, never>>;
export type WarehouseRow = Prisma.WarehouseGetPayload<Record<string, never>>;

/** Ombor ko'rinishi uchun — variant SKU/nomi + ombor kodi bilan boyitilgan. */
export type StockOverviewItem = Prisma.StockItemGetPayload<{
  include: {
    variant: { select: { sku: true; product: { select: { name: true } } } };
    warehouse: { select: { code: true; name: true } };
  };
}>;

/**
 * Qoldiq — Prisma qatlami. Oversell'ga qarshi ATOMIK shartli UPDATE shu yerda.
 *
 * ⚠️ docs/06 §2.4 (ADR-0007): o'qish va yozish AJRATILMAYDI. `reserved`
 *    ortdirish `WHERE on_hand - reserved >= qty` sharti bilan BITTA UPDATE'da
 *    bajariladi → TOCTOU race yo'q, retry loop KERAK EMAS.
 *
 * ⚠️ Bu READ COMMITTED izolyatsiyasiga TAYANADI (Prisma default). REPEATABLE
 *    READ/SERIALIZABLE'da PostgreSQL WHERE'ni qayta baholamaydi va 40001 beradi
 *    — o'shanda retry kerak bo'ladi. Izolyatsiya o'zgarsa bu kod qayta ko'riladi.
 */
@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomik shartli rezerv: `reserved += qty`, faqat `available >= qty` bo'lsa.
   * @returns ta'sirlangan qatorlar soni — 1 = muvaffaqiyat, 0 = qoldiq yetmadi.
   */
  reserveAtomic(
    tx: Prisma.TransactionClient,
    variantId: string,
    warehouseId: string,
    qty: number,
  ): Promise<number> {
    return tx.$executeRaw`
      UPDATE "stock_items"
         SET "reserved"   = "reserved" + ${qty},
             "version"    = "version" + 1,
             "updated_at" = now()
       WHERE "variant_id"   = ${variantId}::uuid
         AND "warehouse_id" = ${warehouseId}::uuid
         AND "on_hand" - "reserved" >= ${qty}`;
  }

  /** Rezervni bo'shatish: `reserved -= qty`. Manfiylik CHECK bilan himoyalangan. */
  releaseAtomic(
    tx: Prisma.TransactionClient,
    variantId: string,
    warehouseId: string,
    qty: number,
  ): Promise<number> {
    return tx.$executeRaw`
      UPDATE "stock_items"
         SET "reserved"   = "reserved" - ${qty},
             "version"    = "version" + 1,
             "updated_at" = now()
       WHERE "variant_id"   = ${variantId}::uuid
         AND "warehouse_id" = ${warehouseId}::uuid`;
  }

  /**
   * Rezervni iste'mol qilish (jo'natildi): `on_hand -= qty`, `reserved -= qty`.
   * on_hand kamayadi → SALE movement bilan birga (service'da bitta tranzaksiya).
   */
  consumeAtomic(
    tx: Prisma.TransactionClient,
    variantId: string,
    warehouseId: string,
    qty: number,
  ): Promise<number> {
    return tx.$executeRaw`
      UPDATE "stock_items"
         SET "on_hand"    = "on_hand" - ${qty},
             "reserved"   = "reserved" - ${qty},
             "version"    = "version" + 1,
             "updated_at" = now()
       WHERE "variant_id"   = ${variantId}::uuid
         AND "warehouse_id" = ${warehouseId}::uuid
         AND "reserved" >= ${qty}
         AND "on_hand"  >= ${qty}`;
  }

  /** on_hand'ni oshirish (kirim). Yo'q bo'lsa yaratadi. */
  incrementOnHand(
    tx: Prisma.TransactionClient,
    variantId: string,
    warehouseId: string,
    qty: number,
  ): Promise<StockItemRow> {
    return tx.stockItem.upsert({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      create: { variantId, warehouseId, onHand: qty, reserved: 0 },
      update: { onHand: { increment: qty }, version: { increment: 1 } },
    });
  }

  find(variantId: string, warehouseId: string): Promise<StockItemRow | null> {
    return this.prisma.stockItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });
  }

  /**
   * Ombor ko'rinishi — cursor pagination + ixtiyoriy ombor filtri (docs/06, admin).
   * ⚠️ uuid7 → `id desc` = eng yangi; cursor id bo'yicha (take limit+1).
   */
  async listOverview(params: {
    warehouseId?: string;
    cursor?: string;
    limit: number;
  }): Promise<{ items: StockOverviewItem[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.stockItem.findMany({
      where: { ...(params.warehouseId !== undefined && { warehouseId: params.warehouseId }) },
      include: {
        variant: { select: { sku: true, product: { select: { name: true } } } },
        warehouse: { select: { code: true, name: true } },
      },
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }

  /** Faol omborlar — tanlash ro'yxatlari uchun (PO, transfer). */
  listWarehouses(): Promise<WarehouseRow[]> {
    return this.prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  }

  /**
   * Dashboard statistikasi: jami qoldiq yozuvlari + KAM QOLDIQ soni.
   * ⚠️ Kam qoldiq = available (on_hand − reserved) ≤ reorder_point — ustunlararo
   *    taqqoslash Prisma `where`'da yo'q, shuning uchun raw SQL.
   */
  async stats(): Promise<{ totalItems: number; lowStock: number }> {
    const totalItems = await this.prisma.stockItem.count();
    const rows = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM stock_items
      WHERE reorder_point IS NOT NULL AND (on_hand - reserved) <= reorder_point`;
    return { totalItems, lowStock: Number(rows[0]?.count ?? 0n) };
  }

  listForVariant(variantId: string): Promise<StockItemRow[]> {
    return this.prisma.stockItem.findMany({ where: { variantId } });
  }
}
