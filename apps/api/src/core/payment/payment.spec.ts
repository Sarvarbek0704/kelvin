import fc from 'fast-check';

import { PAYMENT_STATUSES, type PaymentStatus, canTransition, isTerminalPayment, nextPaymentStates } from './payment-state';
import { ACCOUNTS, buildRefundLedger, buildSaleLedger, isBalanced, landingAccountFor } from './ledger';

const statusArb = fc.constantFrom(...PAYMENT_STATUSES);
const TERMINAL: PaymentStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

describe('payment state machine', () => {
  it('normal oqim: CREATED → PENDING → PAID', () => {
    expect(canTransition('CREATED', 'PENDING')).toBe(true);
    expect(canTransition('PENDING', 'PAID')).toBe(true);
  });

  it('PENDING → PAID va PENDING → EXPIRED (race, §4.3)', () => {
    expect(canTransition('PENDING', 'PAID')).toBe(true);
    expect(canTransition('PENDING', 'EXPIRED')).toBe(true);
  });

  it('to‘lovsiz refund yo‘q: CREATED → REFUNDED illegal', () => {
    expect(canTransition('CREATED', 'REFUNDED')).toBe(false);
  });

  it('PROPERTY: terminal holatdan chiqib bo‘lmaydi (500 run)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TERMINAL), statusArb, (from, to) => {
        expect(canTransition(from, to)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('PROPERTY: canTransition faqat nextStates ichidagilarga rozi', () => {
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        expect(canTransition(from, to)).toBe(nextPaymentStates(from).includes(to));
      }),
      { numRuns: 500 },
    );
  });

  it('terminal holatlar', () => {
    for (const s of TERMINAL) {
      expect(isTerminalPayment(s)).toBe(true);
    }
    expect(isTerminalPayment('PAID')).toBe(false); // → refund_requested
  });
});

describe('ledger (double-entry)', () => {
  it('sotuv yozuvi MUVOZANATLI: DEBIT === CREDIT', () => {
    const entries = buildSaleLedger('CLICK', 500_000_000n);
    expect(isBalanced(entries)).toBe(true);
    expect(entries).toHaveLength(2);
  });

  it('onlayn provayder → receivable, naqd → courier, bank → bank', () => {
    expect(landingAccountFor('CLICK')).toBe(ACCOUNTS.RECEIVABLE_PROVIDER);
    expect(landingAccountFor('PAYME')).toBe(ACCOUNTS.RECEIVABLE_PROVIDER);
    expect(landingAccountFor('CASH')).toBe(ACCOUNTS.CASH_COURIER);
    expect(landingAccountFor('BANK_TRANSFER')).toBe(ACCOUNTS.CASH_BANK);
  });

  it('PROPERTY: har qanday summa uchun sotuv yozuvi muvozanatli', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('CLICK', 'PAYME', 'CASH', 'BANK_TRANSFER'),
        fc.bigInt({ min: 1n, max: 10_000_000_000n }),
        (provider, amount) => {
          expect(isBalanced(buildSaleLedger(provider, amount))).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('refund yozuvi MUVOZANATLI: DEBIT expense.refund / CREDIT landing', () => {
    const entries = buildRefundLedger('CLICK', 200_000_000n);
    expect(isBalanced(entries)).toBe(true);
    expect(entries.find((e) => e.direction === 'DEBIT')?.account).toBe(ACCOUNTS.EXPENSE_REFUND);
    expect(entries.find((e) => e.direction === 'CREDIT')?.account).toBe(ACCOUNTS.RECEIVABLE_PROVIDER);
  });

  it('nomuvozanat aniqlanadi', () => {
    expect(
      isBalanced([
        { account: 'a', direction: 'DEBIT', amount: 100n },
        { account: 'b', direction: 'CREDIT', amount: 99n },
      ]),
    ).toBe(false);
  });
});
