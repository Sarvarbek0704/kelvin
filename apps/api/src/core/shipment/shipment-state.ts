/**
 * Jo'natma holat mashinasi — SOF (docs/07, docs/09). Qiymatlar schema.prisma
 * `ShipmentStatus` enum bilan. ADR-0001: core/ Prisma'ni bilmaydi.
 */
export const SHIPMENT_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

const TRANSITIONS: Readonly<Record<ShipmentStatus, readonly ShipmentStatus[]>> = {
  PENDING: ['ASSIGNED', 'FAILED'],
  ASSIGNED: ['IN_TRANSIT', 'FAILED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  FAILED: [],
  RETURNED: [],
};

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminalShipment(status: ShipmentStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function nextShipmentStates(status: ShipmentStatus): readonly ShipmentStatus[] {
  return TRANSITIONS[status];
}
