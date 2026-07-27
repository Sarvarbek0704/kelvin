/**
 * To'lov holat mashinasi — SOF (docs/08 §4). Qiymatlar schema.prisma
 * `PaymentStatus` enum bilan bir xil. ADR-0001: core/ Prisma'ni bilmaydi.
 *
 * ⚠️ Yagona haqiqat manbai TRANSITIONS. Diagramma — shuning ko'rinishi.
 */
export const PAYMENT_STATUSES = [
  'CREATED',
  'PENDING',
  'PAID',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  CREATED: ['PENDING', 'FAILED'],
  PENDING: ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'],
  PAID: ['REFUND_REQUESTED'],
  REFUND_REQUESTED: ['REFUNDED', 'PARTIALLY_REFUNDED', 'PAID'],
  PARTIALLY_REFUNDED: ['REFUND_REQUESTED'],
  FAILED: [],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminalPayment(status: PaymentStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function nextPaymentStates(status: PaymentStatus): readonly PaymentStatus[] {
  return TRANSITIONS[status];
}
