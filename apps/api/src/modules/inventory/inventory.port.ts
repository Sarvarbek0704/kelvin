/**
 * inventory modulining PUBLIC porti (docs/02 §6.1). Boshqa modullar (order,
 * cart) FAQAT shu fayl orqali murojaat qiladi — service.ts import qilinmaydi.
 */

export interface ReservePortInput {
  readonly variantId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  /** Egasi — aniq bittasi (cart YOKI order). */
  readonly cartId?: string;
  readonly orderId?: string;
}

/** Rezervga havola — order faqat id'ni biladi (transfer/release/consume uchun). */
export interface ReservationRef {
  readonly id: string;
}

export const INVENTORY_PORT = Symbol('InventoryPort');

export interface InventoryPort {
  /** Atomik shartli rezerv; yetmasa InsufficientStockError (docs/06 §2.4). */
  reserve(input: ReservePortInput): Promise<ReservationRef>;
  /** Rezervni bo'shatish (kompensatsiya/bekor). Idempotent. */
  release(reservationId: string): Promise<void>;
  /** Iste'mol (jo'natildi): on_hand kamayadi + SALE movement. */
  consume(reservationId: string): Promise<void>;
  /**
   * Savat rezervlarini buyurtmaga ko'chirish: orderId o'rnatiladi, cartId
   * tozalanadi (single_owner). Faqat hali biriktirilmagan (orderId=null)lar.
   */
  transferReservationsToOrder(reservationIds: readonly string[], orderId: string): Promise<void>;
  /** Buyurtmaning barcha faol rezervlarini bo'shatish (bekor). Idempotent. */
  releaseReservationsForOrder(orderId: string): Promise<void>;
  /** Buyurtmaning rezervlarini iste'mol qilish (packed → on_hand kamayadi). */
  consumeReservationsForOrder(orderId: string): Promise<void>;
  /**
   * Buyurtma rezervlarini TASDIQLASH (to'lov o'tdi): PENDING → CONFIRMED,
   * expiresAt=null (TTL bilan bo'shamaydi — tovar endi kafolatlangan). docs/08 §3.3.
   */
  confirmReservationsForOrder(orderId: string): Promise<void>;
  /** Standart sotiladigan ombor (checkout — mijoz ombor tanlamaydi). Yo'q → xato. */
  resolveSellableWarehouseId(): Promise<string>;
  /** Kirim: on_hand += qty + movement (procurement qabul uchun). */
  receiveStock(input: {
    variantId: string;
    warehouseId: string;
    quantity: number;
    actorUserId?: string;
    referenceType?: string;
    referenceId?: string;
    note?: string;
  }): Promise<void>;
}
