import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type AppConfig } from '../../config/configuration';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { BusinessRuleError, InsufficientStockError, NotFoundError } from '../../core/errors/domain.error';
import { StockRepository, type ReservationRow, type StockItemRow, type StockOverviewItem, type WarehouseRow } from './stock.repository';
import { type InventoryPort, type ReservePortInput } from './inventory.port';

export type ReserveInput = ReservePortInput;

/** Ombor ko'rinishi qatori (admin) — pul emas, dona; available hisoblanadi. */
export interface StockView {
  readonly variantId: string;
  readonly warehouseId: string;
  readonly sku: string;
  readonly productName: unknown; // LocalizedText (Json)
  readonly warehouseCode: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly available: number;
  readonly reorderPoint: number | null;
}

export function toStockView(row: StockOverviewItem): StockView {
  return {
    variantId: row.variantId,
    warehouseId: row.warehouseId,
    sku: row.variant.sku,
    productName: row.variant.product.name,
    warehouseCode: row.warehouse.code,
    onHand: row.onHand,
    reserved: row.reserved,
    available: row.onHand - row.reserved, // docs/06: available saqlanmaydi, hisoblanadi
    reorderPoint: row.reorderPoint,
  };
}

export interface ReceiveInput {
  readonly variantId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  readonly actorUserId?: string;
  readonly note?: string;
  /** Manba havolasi (masalan, xarid buyurtmasi) — movement ledger'iga. */
  readonly referenceType?: string;
  readonly referenceId?: string;
}

/**
 * inventory — qoldiq va rezerv. Loyihaning eng nozik moduli (docs/06).
 *
 * ⚠️ Oversell'ga qarshi himoya: StockRepository'ning atomik shartli UPDATE'i
 *    (§2.4). Bu servis uni tranzaksiyaga o'raydi va rezerv yozuvini yaratadi —
 *    ikkalasi ATOMIK (biri yiqilса ikkalasi ham qaytadi).
 */
@Injectable()
export class InventoryService implements InventoryPort {
  private readonly ttlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: StockRepository,
    private readonly audit: AuditService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.ttlSeconds = config.get('inventory', { infer: true }).reservationTtlSeconds;
  }

  /** available = on_hand - reserved (hisoblanadi). */
  async getStock(variantId: string, warehouseId: string): Promise<StockItemRow | null> {
    return await this.repo.find(variantId, warehouseId);
  }

  /** Variant qoldig'i — barcha omborlar bo'yicha. */
  async listStock(variantId: string): Promise<StockItemRow[]> {
    return await this.repo.listForVariant(variantId);
  }

  /** Faol omborlar (tanlash ro'yxatlari — PO, transfer). */
  listWarehouses(): Promise<WarehouseRow[]> {
    return this.repo.listWarehouses();
  }

  /** Dashboard statistikasi — jami qoldiq + kam qoldiq soni. */
  stats(): Promise<{ totalItems: number; lowStock: number }> {
    return this.repo.stats();
  }

  /** Ombor ko'rinishi (admin) — cursor + ombor filtri, boyitilgan qatorlar. */
  async listStockOverview(params: {
    warehouseId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ items: StockView[]; nextCursor: string | null }> {
    const page = await this.repo.listOverview({
      ...(params.warehouseId !== undefined && { warehouseId: params.warehouseId }),
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 30, 100),
    });
    return { items: page.items.map(toStockView), nextCursor: page.nextCursor };
  }

  /** Kirim: on_hand += qty + immutable movement (PURCHASE_RECEIPT). */
  async receive(input: ReceiveInput): Promise<StockItemRow> {
    if (input.quantity <= 0) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Miqdor musbat bo‘lishi kerak');
    }
    const item = await this.prisma.$transaction(async (tx) => {
      const row = await this.repo.incrementOnHand(
        tx,
        input.variantId,
        input.warehouseId,
        input.quantity,
      );
      await tx.stockMovement.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          type: 'PURCHASE_RECEIPT',
          quantity: input.quantity,
          ...(input.actorUserId !== undefined && { actorUserId: input.actorUserId }),
          ...(input.note !== undefined && { note: input.note }),
          ...(input.referenceType !== undefined && { referenceType: input.referenceType }),
          ...(input.referenceId !== undefined && { referenceId: input.referenceId }),
        },
      });
      return row;
    });

    // ⚠️ Audit (docs/11 §11): qoldiq kirimi — moliyaviy ta'sirli amal.
    await this.audit.record({
      action: 'STOCK_RECEIVED',
      resourceType: 'StockItem',
      resourceId: item.id,
      after: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        onHand: item.onHand,
      },
      ...(input.actorUserId !== undefined && { actorUserId: input.actorUserId }),
    });
    return item;
  }

  /**
   * Inventarizatsiya (docs/15 §8.2): fizik sanoq → farq (variance) ADJUSTMENT
   * movement + on_hand tuzatiladi.
   *
   * ⚠️ DELTA qo'llanadi (absolute EMAS): `on_hand = on_hand + variance`, variance
   *    sanoq vaqtidagi tizim qiymatidan hisoblangan. Sanoq paytida sotuv (consume)
   *    bo'lsa — on_hand column'ga delta qo'llanadi, sotuv YO'QOLMAYDI (§8.2 concurrency).
   */
  async adjustStock(input: {
    variantId: string;
    warehouseId: string;
    physicalCount: number;
    reason: string;
    actorUserId?: string;
  }): Promise<StockItemRow> {
    if (input.physicalCount < 0) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Fizik sanoq manfiy bo‘lolmaydi');
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.stockItem.findUnique({
        where: { variantId_warehouseId: { variantId: input.variantId, warehouseId: input.warehouseId } },
      });
      if (current === null) {
        throw new NotFoundError('Qoldiq yozuvi');
      }
      const variance = input.physicalCount - current.onHand;
      if (variance === 0) {
        return current; // farq yo'q — movement yozilmaydi
      }
      // ⚠️ Delta column'ga qo'llanadi (konkurent movement saqlanadi).
      await tx.$executeRaw`
        UPDATE "stock_items"
           SET "on_hand" = "on_hand" + ${variance}, "version" = "version" + 1, "updated_at" = now()
         WHERE "variant_id" = ${input.variantId}::uuid AND "warehouse_id" = ${input.warehouseId}::uuid`;
      await tx.stockMovement.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          type: 'ADJUSTMENT',
          quantity: variance,
          referenceType: 'inventory_count',
          note: input.reason,
          ...(input.actorUserId !== undefined && { actorUserId: input.actorUserId }),
        },
      });
      return await tx.stockItem.findUniqueOrThrow({
        where: { variantId_warehouseId: { variantId: input.variantId, warehouseId: input.warehouseId } },
      });
    });

    // ⚠️ Audit (docs/11 §11): qoldiq tuzatishi — sabab MAJBURIY.
    await this.audit.record({
      action: 'STOCK_ADJUSTED',
      resourceType: 'StockItem',
      resourceId: result.id,
      after: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        physicalCount: input.physicalCount,
        onHand: result.onHand,
        reason: input.reason,
      },
      ...(input.actorUserId !== undefined && { actorUserId: input.actorUserId }),
    });
    return result;
  }

  /**
   * Rezerv — ATOMIK. `available >= qty` bo'lsagina o'tadi.
   *
   * ⚠️ Race yo'q: shart UPDATE ichida (§2.4). 0 qator → yetarli qoldiq yo'q →
   *    InsufficientStockError (throw → tranzaksiya qaytadi, reserved oshmaydi).
   */
  async reserve(input: ReserveInput): Promise<ReservationRow> {
    this.assertSingleOwner(input);
    if (input.quantity <= 0) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Miqdor musbat bo‘lishi kerak');
    }
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    return await this.prisma.$transaction(
      async (tx) => {
        const affected = await this.repo.reserveAtomic(
          tx,
          input.variantId,
          input.warehouseId,
          input.quantity,
        );
        if (affected === 0) {
          throw new InsufficientStockError(input.variantId, input.quantity);
        }
        return await tx.stockReservation.create({
          data: {
            variantId: input.variantId,
            warehouseId: input.warehouseId,
            quantity: input.quantity,
            status: 'PENDING',
            expiresAt,
            ...(input.cartId !== undefined && { cartId: input.cartId }),
            ...(input.orderId !== undefined && { orderId: input.orderId }),
          },
        });
      },
      // ⚠️ ADR-0007: atomik shartli UPDATE faqat READ COMMITTED ostida to'g'ri
      //    ishlaydi (PostgreSQL EvalPlanQual re-check). Izolyatsiya darajasini
      //    ANIQ shu yerda pin qilamiz — kimdir global default'ni ko'tarsa (masalan
      //    Serializable), oversell himoyasi JIMGINA buzilmasligi uchun.
      //    (String literal — servis qatlami Prisma namespace'ini import qilmaydi, ADR-0001.)
      { isolationLevel: 'ReadCommitted' },
    );
  }

  /**
   * Rezervni bo'shatish (bekor/expired). Idempotent: terminal holatda no-op.
   * `reserved` kamayadi, tovar qayta sotiladi.
   */
  async release(reservationId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const r = await tx.stockReservation.findUnique({ where: { id: reservationId } });
      if (r === null) {
        throw new NotFoundError('Rezerv', reservationId);
      }
      if (r.status !== 'PENDING' && r.status !== 'CONFIRMED') {
        return; // allaqachon terminal — idempotent
      }
      await this.repo.releaseAtomic(tx, r.variantId, r.warehouseId, r.quantity);
      await tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
    });
  }

  /**
   * Iste'mol (jo'natildi): on_hand -= qty, reserved -= qty + SALE movement.
   * Rezerv CONSUMED bo'ladi. Faqat PENDING/CONFIRMED rezerv iste'mol qilinadi.
   */
  async consume(reservationId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const r = await tx.stockReservation.findUnique({ where: { id: reservationId } });
      if (r === null) {
        throw new NotFoundError('Rezerv', reservationId);
      }
      if (r.status !== 'PENDING' && r.status !== 'CONFIRMED') {
        throw new BusinessRuleError('INVALID_STATE', 'Rezerv iste’mol qilinadigan holatda emas', {
          status: r.status,
        });
      }
      const affected = await this.repo.consumeAtomic(tx, r.variantId, r.warehouseId, r.quantity);
      if (affected === 0) {
        // reserved/on_hand invariantlari buzilgan — bug signali (kutilmagan).
        throw new BusinessRuleError('INVARIANT_VIOLATION', 'Iste’mol uchun qoldiq yetarli emas');
      }
      await tx.stockMovement.create({
        data: {
          variantId: r.variantId,
          warehouseId: r.warehouseId,
          type: 'SALE',
          quantity: -r.quantity,
          referenceType: 'reservation',
          referenceId: r.id,
        },
      });
      await tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'CONSUMED', consumedAt: new Date() },
      });
    });
  }

  /**
   * Savat rezervlarini buyurtmaga ko'chirish — orderId o'rnatiladi, cartId
   * tozalanadi (single_owner CHECK). Faqat hali biriktirilmaganlar (orderId=null)
   * — idempotent (takror chaqiruv zarar qilmaydi).
   */
  async transferReservationsToOrder(
    reservationIds: readonly string[],
    orderId: string,
  ): Promise<void> {
    if (reservationIds.length === 0) {
      return;
    }
    await this.prisma.stockReservation.updateMany({
      where: { id: { in: [...reservationIds] }, orderId: null },
      data: { orderId, cartId: null },
    });
  }

  /** Buyurtmaning barcha faol (PENDING/CONFIRMED) rezervlarini bo'shatish. */
  async releaseReservationsForOrder(orderId: string): Promise<void> {
    const rows = await this.prisma.stockReservation.findMany({
      where: { orderId, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { id: true },
    });
    for (const { id } of rows) {
      await this.release(id);
    }
  }

  /** Buyurtmaning faol rezervlarini iste'mol qilish (packed → on_hand kamayadi). */
  async consumeReservationsForOrder(orderId: string): Promise<void> {
    const rows = await this.prisma.stockReservation.findMany({
      where: { orderId, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { id: true },
    });
    for (const { id } of rows) {
      await this.consume(id);
    }
  }

  /**
   * Buyurtma rezervlarini tasdiqlash (to'lov o'tdi): PENDING → CONFIRMED.
   * ⚠️ TTL sweeper faqat PENDING'ni bo'shatadi → CONFIRMED endi tegilmaydi
   *    (tovar kafolatlangan; expiresAt schema'da NOT NULL — o'zgartirilmaydi). docs/08 §3.3.
   */
  async confirmReservationsForOrder(orderId: string): Promise<void> {
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });
  }

  /** Port: kirim (void) — procurement qabul chaqiradi. */
  async receiveStock(input: ReceiveInput): Promise<void> {
    await this.receive(input);
  }

  /** Standart sotiladigan ombor (checkout uchun). Yo'q bo'lsa xato. */
  async resolveSellableWarehouseId(): Promise<string> {
    const wh = await this.prisma.warehouse.findFirst({
      where: { isSellable: true, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (wh === null) {
      throw new BusinessRuleError('NO_WAREHOUSE', 'Sotiladigan ombor topilmadi');
    }
    return wh.id;
  }

  /**
   * Muddati tugagan PENDING rezervlarni bo'shatish (TTL job — docs/06 §4.2).
   * @returns bo'shatilgan rezervlar soni.
   */
  async releaseExpired(now: Date = new Date()): Promise<number> {
    const expired = await this.prisma.stockReservation.findMany({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      select: { id: true },
      take: 500,
    });
    let released = 0;
    for (const { id } of expired) {
      await this.prisma.$transaction(async (tx) => {
        const r = await tx.stockReservation.findUnique({ where: { id } });
        if (r?.status !== 'PENDING') {
          return; // boshqa jarayon ulgurdi (yoki topilmadi)
        }
        await this.repo.releaseAtomic(tx, r.variantId, r.warehouseId, r.quantity);
        await tx.stockReservation.update({
          where: { id },
          data: { status: 'EXPIRED', releasedAt: new Date() },
        });
        released += 1;
      });
    }
    return released;
  }

  private assertSingleOwner(input: ReserveInput): void {
    const hasCart = input.cartId !== undefined;
    const hasOrder = input.orderId !== undefined;
    if (hasCart === hasOrder) {
      throw new BusinessRuleError(
        'VALIDATION_FAILED',
        'Rezerv egasi aniq bitta bo‘lishi kerak (cart yoki order)',
      );
    }
  }
}
