import { Inject, Injectable, Logger } from '@nestjs/common';

import { BusinessRuleError, ConflictError, NotFoundError } from '../../core/errors/domain.error';
import { INVENTORY_PORT, type InventoryPort } from '../inventory/inventory.port';
import {
  ProcurementRepository,
  type CreatePOItem,
  type PurchaseOrderWithItems,
  type SupplierRow,
} from './procurement.repository';

export interface CreateSupplierInput {
  readonly name: string;
  readonly code: string;
  readonly phone?: string;
  readonly leadTimeDays?: number;
}

export interface CreatePOInput {
  readonly supplierId: string;
  readonly warehouseId: string;
  readonly items: readonly CreatePOItem[];
}

/** Ruxsat etilgan PO o'tishlari (status — string, docs/15 §8). */
const PO_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  DRAFT: ['ORDERED', 'CANCELLED'],
  ORDERED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

/**
 * procurement — ta'minot: Supplier, PurchaseOrder, qabul (docs/15 §8, Faza 6).
 *
 * ⚠️ Qabul (receive) → INVENTORY_PORT.receiveStock (on_hand oshadi + movement,
 *    PO havolasi bilan). Stock TIZIMGA aynan shu yerdan kiradi.
 */
@Injectable()
export class ProcurementService {
  private readonly log = new Logger(ProcurementService.name);

  constructor(
    private readonly repo: ProcurementRepository,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
  ) {}

  createSupplier(input: CreateSupplierInput): Promise<SupplierRow> {
    return this.repo.createSupplier(input);
  }

  listSuppliers(): Promise<SupplierRow[]> {
    return this.repo.listSuppliers();
  }

  listPurchaseOrders(params: {
    status?: PurchaseOrderWithItems['status'];
    cursor?: string;
    limit?: number;
  }): Promise<{ items: PurchaseOrderWithItems[]; nextCursor: string | null }> {
    return this.repo.listPurchaseOrders({
      ...(params.status !== undefined && { status: params.status }),
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  getPurchaseOrder(id: string): Promise<PurchaseOrderWithItems | null> {
    return this.repo.findPO(id);
  }

  /** Xarid buyurtmasi (DRAFT) — totalAmount server tomonda hisoblanadi. */
  async createPurchaseOrder(input: CreatePOInput): Promise<PurchaseOrderWithItems> {
    if (input.items.length === 0) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Xarid buyurtmasi bo‘sh bo‘lolmaydi');
    }
    const supplier = await this.repo.findSupplier(input.supplierId);
    if (supplier === null) {
      throw new NotFoundError('Ta’minotchi', input.supplierId);
    }
    const totalAmount = input.items.reduce(
      (sum, it) => sum + it.unitCostAmount * BigInt(it.quantityOrdered),
      0n,
    );
    return await this.repo.createPurchaseOrder(
      { supplierId: input.supplierId, warehouseId: input.warehouseId, totalAmount, currency: 'UZS' },
      input.items,
      new Date().getUTCFullYear(),
    );
  }

  /** DRAFT → ORDERED (ta'minotchiga yuborildi). */
  async submit(id: string): Promise<PurchaseOrderWithItems> {
    const po = await this.repo.findPO(id);
    if (po === null) {
      throw new NotFoundError('Xarid buyurtmasi', id);
    }
    this.assertTransition(po.status, 'ORDERED');
    return await this.repo.updateStatus(id, 'ORDERED', { orderedAt: new Date() });
  }

  /**
   * ORDERED → RECEIVED: tovar keldi. Har qator uchun qoldiq oshadi (INVENTORY_PORT)
   * + movement PO havolasi bilan. quantityReceived = quantityOrdered.
   */
  async receive(id: string, actorUserId?: string): Promise<PurchaseOrderWithItems> {
    const po = await this.repo.findPO(id);
    if (po === null) {
      throw new NotFoundError('Xarid buyurtmasi', id);
    }
    this.assertTransition(po.status, 'RECEIVED');

    for (const item of po.items) {
      const remaining = item.quantityOrdered - item.quantityReceived;
      if (remaining <= 0) {
        continue;
      }
      await this.inventory.receiveStock({
        variantId: item.variantId,
        warehouseId: po.warehouseId,
        quantity: remaining,
        referenceType: 'purchase_order',
        referenceId: po.id,
        ...(actorUserId !== undefined && { actorUserId }),
        note: `PO ${po.number}`,
      });
      await this.repo.markItemReceived(item.id, item.quantityOrdered);
    }
    this.log.log(`Xarid buyurtmasi qabul qilindi: ${po.number}`);
    return await this.repo.updateStatus(id, 'RECEIVED', { receivedAt: new Date() });
  }

  /** DRAFT/ORDERED → CANCELLED. */
  async cancel(id: string): Promise<PurchaseOrderWithItems> {
    const po = await this.repo.findPO(id);
    if (po === null) {
      throw new NotFoundError('Xarid buyurtmasi', id);
    }
    this.assertTransition(po.status, 'CANCELLED');
    return await this.repo.updateStatus(id, 'CANCELLED');
  }

  private assertTransition(from: string, to: string): void {
    const allowed = PO_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new ConflictError(`Ruxsat etilmagan PO o‘tishi: ${from} → ${to}`, { from, to });
    }
  }
}
