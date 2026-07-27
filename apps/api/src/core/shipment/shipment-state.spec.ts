import fc from 'fast-check';

import { SHIPMENT_STATUSES, type ShipmentStatus, canTransition, isTerminalShipment, nextShipmentStates } from './shipment-state';

const statusArb = fc.constantFrom(...SHIPMENT_STATUSES);
const TERMINAL: ShipmentStatus[] = ['FAILED', 'RETURNED'];

describe('shipment state machine', () => {
  it('normal oqim: PENDING → ASSIGNED → IN_TRANSIT → DELIVERED', () => {
    expect(canTransition('PENDING', 'ASSIGNED')).toBe(true);
    expect(canTransition('ASSIGNED', 'IN_TRANSIT')).toBe(true);
    expect(canTransition('IN_TRANSIT', 'DELIVERED')).toBe(true);
  });

  it('sakrash taqiqlanadi: PENDING → DELIVERED illegal', () => {
    expect(canTransition('PENDING', 'DELIVERED')).toBe(false);
  });

  it('PROPERTY: terminal (FAILED/RETURNED) → chiqish yo‘q; canTransition=nextStates', () => {
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        expect(canTransition(from, to)).toBe(nextShipmentStates(from).includes(to));
      }),
      { numRuns: 300 },
    );
    for (const s of TERMINAL) {
      expect(isTerminalShipment(s)).toBe(true);
    }
  });
});
