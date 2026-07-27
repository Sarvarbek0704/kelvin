import { Injectable } from '@nestjs/common';

import { NotFoundError, SlotUnavailableError } from '../../core/errors/domain.error';
import { toJson } from '../../shared/json';
import { type DeliveryPort, type DeliveryQuoteResult } from './delivery.port';
import { DeliveryRepository, type SlotRow, type ZoneRow } from './delivery.repository';

export type DeliveryQuote = DeliveryQuoteResult;

/**
 * delivery — zona, narx, slot bron (docs/09, docs/07 §8).
 *
 * ⚠️ Slot bron INVENTORY OVERSELL bilan bir xil race: cheklangan resurs (kuniga
 *    N ta yetkazish), atomik shartli UPDATE bilan taqsimlanadi. Bu tasodif emas.
 */
@Injectable()
export class DeliveryService implements DeliveryPort {
  constructor(private readonly repo: DeliveryRepository) {}

  createZone(input: {
    name: Record<string, string>;
    districts: string[];
    priceAmount: bigint;
    freeThresholdAmount?: bigint;
    etaDaysMin?: number;
    etaDaysMax?: number;
  }): Promise<ZoneRow> {
    return this.repo.createZone({ ...input, name: toJson(input.name) });
  }

  listZones(): Promise<ZoneRow[]> {
    return this.repo.listZones();
  }

  /**
   * Yetkazish narxi: subtotal freeThreshold'dan katta/teng bo'lsa BEPUL, aks
   * holda zona narxi (docs/09). Narx snapshot buyurtmada muzlaydi (§07 §5).
   */
  async quote(zoneId: string, subtotal: bigint): Promise<DeliveryQuote> {
    const zone = await this.repo.findZone(zoneId);
    if (!zone?.isActive) {
      throw new NotFoundError('Yetkazish zonasi', zoneId);
    }
    const free =
      zone.freeThresholdAmount !== null && subtotal >= zone.freeThresholdAmount;
    return {
      zoneId,
      fee: free ? 0n : zone.priceAmount,
      free,
      etaDaysMin: zone.etaDaysMin,
      etaDaysMax: zone.etaDaysMax,
    };
  }

  createSlot(input: {
    zoneId: string;
    date: Date;
    startTime: string;
    endTime: string;
    capacity: number;
  }): Promise<SlotRow> {
    return this.repo.createSlot(input);
  }

  listAvailableSlots(zoneId: string, date: Date): Promise<SlotRow[]> {
    return this.repo.listAvailableSlots(zoneId, date);
  }

  /**
   * ⚠️ Slotni ATOMIK bron qilish. `booked < capacity` bo'lsagina — aks holda
   * SlotUnavailableError (band). Race yo'q: shart UPDATE ichida (docs/07 §8).
   */
  async bookSlot(slotId: string): Promise<void> {
    const affected = await this.repo.bookSlotAtomic(slotId);
    if (affected === 0) {
      throw new SlotUnavailableError(slotId);
    }
  }

  /** Bronni bo'shatish (buyurtma bekor/slot o'zgardi). Idempotent. */
  async releaseSlot(slotId: string): Promise<void> {
    await this.repo.releaseSlotAtomic(slotId);
  }
}
