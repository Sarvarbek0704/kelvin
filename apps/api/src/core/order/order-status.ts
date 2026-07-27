/**
 * Buyurtma holatlari — SOF (ADR-0001: core/ Prisma'ni ham, NestJS'ni ham
 * bilmaydi). Qiymatlar schema.prisma `OrderStatus` enum bilan bir xil (string).
 *
 * ⚠️ schema.prisma g'olib (docs/03 §5). Diagrammadagi `manual_review`/`refunded`
 *    enumda YO'Q — ular to'lov sagasi (Faza 4) bilan keladi.
 */
export const ORDER_STATUSES = [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'PAID',
  'CONFIRMED',
  'PICKING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'RETURNED',
  'PARTIALLY_RETURNED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
