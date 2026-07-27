import { type OrderStatus } from './order-status';

/**
 * Buyurtma holat mashinasi — SOF (docs/07 §2.2 o'tishlar jadvali).
 *
 * ⚠️ Ruxsat etilgan o'tishlar QAT'IY. Ro'yxatda yo'q har qanday o'tish —
 *    ILLEGAL (holat mashinasi property testi buni kafolatlaydi). Yon ta'sirlar
 *    (rezerv, refund, SMS) — bu yerda EMAS, order.service/saga da.
 *
 * enum'da yo'q `manual_review`/`refunded` targetlari chiqarib tashlangan; ular
 * to'lov sagasi (Faza 4) bilan keladi. RETURNED/PARTIALLY_RETURNED hozircha
 * terminal (→ refunded Faza 4).
 */
const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING_PAYMENT', 'CANCELLED'],
  PAID: ['CONFIRMED'],
  CONFIRMED: ['PICKING', 'CANCELLED'],
  PICKING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'RETURNED', 'PARTIALLY_RETURNED'],
  COMPLETED: [],
  CANCELLED: [],
  RETURNED: [],
  PARTIALLY_RETURNED: [],
};

/** Terminal holat — chiquvchi o'tish yo'q. */
export function isTerminal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** Shu holatdan ruxsat etilgan keyingi holatlar. */
export function nextStates(status: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Illegal o'tish sababi (xato xabari uchun). null → ruxsat etilgan. */
export function transitionError(from: OrderStatus, to: OrderStatus): string | null {
  if (canTransition(from, to)) {
    return null;
  }
  if (isTerminal(from)) {
    return `Buyurtma "${from}" — terminal holat, o'zgartirib bo'lmaydi`;
  }
  return `Ruxsat etilmagan o'tish: ${from} → ${to}`;
}
