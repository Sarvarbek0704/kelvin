import fc from 'fast-check';

import { ORDER_STATUSES, type OrderStatus } from './order-status';
import { canTransition, isTerminal, nextStates, transitionError } from './order-state-machine';

const TERMINAL: OrderStatus[] = ['COMPLETED', 'CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED'];
const statusArb = fc.constantFrom(...ORDER_STATUSES);

describe('order state machine', () => {
  it('checkout oqimi: DRAFT → PENDING_PAYMENT → PAID → CONFIRMED', () => {
    expect(canTransition('DRAFT', 'PENDING_PAYMENT')).toBe(true);
    expect(canTransition('PENDING_PAYMENT', 'PAID')).toBe(true);
    expect(canTransition('PAID', 'CONFIRMED')).toBe(true);
  });

  it('bekor: DRAFT/CONFIRMED/PICKING/PACKED → CANCELLED (jo‘natilgungacha)', () => {
    for (const s of ['DRAFT', 'CONFIRMED', 'PICKING', 'PACKED'] as OrderStatus[]) {
      expect(canTransition(s, 'CANCELLED')).toBe(true);
    }
    expect(canTransition('SHIPPED', 'CANCELLED')).toBe(false); // jo'natilgach bekor emas
  });

  it('sakrash taqiqlanadi: DRAFT → SHIPPED illegal', () => {
    expect(canTransition('DRAFT', 'SHIPPED')).toBe(false);
    expect(transitionError('DRAFT', 'SHIPPED')).toMatch(/Ruxsat etilmagan/);
  });

  it('terminal holatlar — chiquvchi o‘tish yo‘q', () => {
    for (const s of TERMINAL) {
      expect(isTerminal(s)).toBe(true);
      expect(nextStates(s)).toHaveLength(0);
    }
  });

  it('PROPERTY: terminal holatдан hech qayoqqa o‘tib bo‘lmaydi (500 run)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TERMINAL), statusArb, (from, to) => {
        expect(canTransition(from, to)).toBe(false);
        expect(transitionError(from, to)).not.toBeNull();
      }),
      { numRuns: 500 },
    );
  });

  it('PROPERTY: canTransition faqat nextStates ichidagilarga rozi', () => {
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        expect(canTransition(from, to)).toBe(nextStates(from).includes(to));
      }),
      { numRuns: 500 },
    );
  });

  it('PROPERTY: o‘ziga o‘tish (from === to) hech qachon ruxsat emas', () => {
    fc.assert(
      fc.property(statusArb, (s) => {
        expect(canTransition(s, s)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
