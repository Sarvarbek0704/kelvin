import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { BusinessRuleError, ConflictError, NotFoundError } from '../../core/errors/domain.error';
import { buildPosSaleLedger, isBalanced } from '../../core/payment/ledger';
import { PRICING_PORT, type PricingPort } from '../pricing/pricing.port';
import { INVENTORY_PORT, type InventoryPort } from '../inventory/inventory.port';
import { PosRepository, type ShiftRow, type TransactionRow } from './pos.repository';

export interface ShiftView {
  readonly id: string;
  readonly status: string;
  readonly openingCashAmount: string;
  readonly closingCashAmount: string | null;
  readonly cashDifferenceAmount: string | null;
  readonly openedAt: string;
}

export function toShiftView(s: ShiftRow): ShiftView {
  return {
    id: s.id,
    status: s.status,
    openingCashAmount: s.openingCashAmount.toString(),
    closingCashAmount: s.closingCashAmount === null ? null : s.closingCashAmount.toString(),
    cashDifferenceAmount: s.cashDifferenceAmount === null ? null : s.cashDifferenceAmount.toString(),
    openedAt: s.openedAt.toISOString(),
  };
}

export interface TxView {
  readonly id: string;
  readonly number: string;
  readonly paymentMethod: string;
  readonly totalAmount: string;
  readonly createdAt: string;
  readonly items: readonly { readonly sku: string; readonly quantity: number; readonly totalAmount: string }[];
}

export function toTxView(t: TransactionRow): TxView {
  return {
    id: t.id,
    number: t.number,
    paymentMethod: t.paymentMethod,
    totalAmount: t.totalAmount.toString(),
    createdAt: t.createdAt.toISOString(),
    items: t.items.map((i) => ({ sku: i.sku, quantity: i.quantity, totalAmount: i.totalAmount.toString() })),
  };
}

/**
 * pos — offline kassa (docs/15 §10). ⚠️ Fiskal chek/offline rejim YO'Q (yuridik/
 * texnik — keyingi ish). Sotuv oversell himoyasi bilan (reserve→consume), har
 * sotuv double-entry ledger'ga. Smena naqd farqi yopilishda hisoblanadi.
 */
@Injectable()
export class PosService {
  private readonly log = new Logger(PosService.name);

  constructor(
    private readonly repo: PosRepository,
    @Inject(PRICING_PORT) private readonly pricing: PricingPort,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
  ) {}

  async openShift(userId: string, openingCashAmount: bigint): Promise<ShiftRow> {
    if (openingCashAmount < 0n) {
      throw new BusinessRuleError('INVALID_AMOUNT', 'Boshlang‘ich kassa manfiy bo‘lmaydi');
    }
    if ((await this.repo.findOpenShift(userId)) !== null) {
      throw new ConflictError('Sizda ochiq smena allaqachon bor');
    }
    return await this.repo.openShift(userId, openingCashAmount);
  }

  getCurrentShift(userId: string): Promise<ShiftRow | null> {
    return this.repo.findOpenShift(userId);
  }

  /** Smenani yopish: kutilgan kassa = ochilish + naqd sotuvlar; farq = haqiqiy − kutilgan. */
  async closeShift(shiftId: string, userId: string, closingCashAmount: bigint): Promise<ShiftRow> {
    const shift = await this.repo.findShift(shiftId);
    if (shift === null) {
      throw new NotFoundError('Smena', shiftId);
    }
    if (shift.userId !== userId) {
      throw new ConflictError('Bu smena sizniki emas');
    }
    if (shift.status !== 'OPEN') {
      throw new ConflictError('Smena allaqachon yopilgan');
    }
    const cashSales = await this.repo.cashSalesTotal(shiftId);
    const expected = shift.openingCashAmount + cashSales;
    const difference = closingCashAmount - expected;
    return await this.repo.closeShift(shiftId, closingCashAmount, difference);
  }

  /**
   * POS sotuvi — ochiq smena kerak. Oversell himoyasi: reserve → consume (order
   * sagasi kabi, kompensatsiya bilan). Narx PRICING_PORT'dan (bir manba).
   */
  async createSale(input: {
    userId: string;
    paymentMethod: 'CASH' | 'CARD';
    warehouseId?: string;
    items: { variantId: string; quantity: number }[];
  }): Promise<TransactionRow> {
    if (input.items.length === 0) {
      throw new BusinessRuleError('EMPTY_SALE', 'Sotuv qatorlari bo‘sh');
    }
    const shift = await this.repo.findOpenShift(input.userId);
    if (shift === null) {
      throw new ConflictError('Avval smena oching');
    }
    const warehouseId = input.warehouseId ?? (await this.inventory.resolveSellableWarehouseId());

    const priced = await this.pricing.priceCart({ lines: input.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) });

    // Oversell himoyasi: reserve (kompensatsiya bilan) → keyin consume.
    const posCartId = randomUUID(); // sintetik egasi (cartId — FK emas)
    const reservationIds: string[] = [];
    try {
      for (const line of priced.lines) {
        const r = await this.inventory.reserve({ variantId: line.variantId, warehouseId, quantity: line.quantity, cartId: posCartId });
        reservationIds.push(r.id);
      }
    } catch (err) {
      await this.releaseAll(reservationIds);
      throw err; // InsufficientStockError
    }

    const ledger = buildPosSaleLedger(input.paymentMethod, priced.totalAmount);
    if (!isBalanced(ledger)) {
      throw new Error('POS ledger nomuvozanat');
    }

    let tx: TransactionRow;
    try {
      tx = await this.repo.createTransaction(
        {
          shiftId: shift.id,
          paymentMethod: input.paymentMethod,
          totalAmount: priced.totalAmount,
          warehouseId,
          items: priced.lines.map((l) => ({ variantId: l.variantId, sku: l.variantId, quantity: l.quantity, unitAmount: l.unitPrice, totalAmount: l.lineTotal })),
        },
        ledger,
      );
    } catch (err) {
      await this.releaseAll(reservationIds);
      throw err;
    }

    // Sotildi — rezervlarni iste'mol qilish (on_hand kamayadi).
    for (const id of reservationIds) {
      await this.inventory.consume(id);
    }
    this.log.log(`POS sotuvi: ${tx.number} (${priced.totalAmount.toString()} tiyin)`);
    return tx;
  }

  listTransactions(shiftId: string): Promise<TransactionRow[]> {
    return this.repo.listTransactions(shiftId);
  }

  private async releaseAll(ids: readonly string[]): Promise<void> {
    for (const id of ids) {
      try {
        await this.inventory.release(id);
      } catch (e) {
        this.log.error(`POS kompensatsiya (release) xato: ${id}`, e instanceof Error ? e.stack : undefined);
      }
    }
  }
}
