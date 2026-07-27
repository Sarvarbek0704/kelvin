/**
 * delivery modulining PUBLIC porti (docs/02 §6.1) — order checkout uchun.
 * order moduli yetkazish narxini FAQAT shu port orqali oladi.
 */

export interface DeliveryQuoteResult {
  readonly zoneId: string;
  readonly fee: bigint;
  readonly free: boolean;
  readonly etaDaysMin: number;
  readonly etaDaysMax: number;
}

export const DELIVERY_PORT = Symbol('DeliveryPort');

export interface DeliveryPort {
  /** Yetkazish narxi: subtotal freeThreshold'dan katta → 0 (bepul). Zona yo'q → NotFound. */
  quote(zoneId: string, subtotal: bigint): Promise<DeliveryQuoteResult>;
  /** Slotni ATOMIK bron qilish; to'la → SlotUnavailableError (docs/07 §8). */
  bookSlot(slotId: string): Promise<void>;
  /** Slot bronini bo'shatish (kompensatsiya). Idempotent. */
  releaseSlot(slotId: string): Promise<void>;
}
