import { Money } from '../money/money';

/**
 * Rassrochka hisobi — SOF (docs/08 §7). ⚠️ PUL MATEMATIKASI: 5 000 000 so'mni
 * 3 oyga bo'lsak 1 666 666.67 — tiyin yo'qolmasligi kerak. `Money.allocate`
 * ishlatiladi: SUM(grafik) === totalPayable (property test bilan isbotlangan).
 *
 * ⚠️ core/ — NestJS/Prisma bilmaydi (ADR-0001).
 */

export interface ScheduleLine {
  readonly installmentNumber: number;
  readonly amount: bigint; // TIYIN
}

export interface InstallmentComputation {
  readonly principal: bigint; // qarz (order total − boshlang'ich badal)
  readonly interest: bigint;
  readonly totalPayable: bigint; // principal + foiz
  readonly lines: readonly ScheduleLine[];
}

/**
 * Grafik hisobi. Foiz basis point'da (1200 = 12%). Foiz TRUNCATE (mijoz foydasiga —
 * §7.5 kabi). Grafik `allocate` bilan — birinchi oylar 1 tiyinga ko'p bo'lishi mumkin,
 * lekin YIG'INDI aniq totalPayable.
 */
export function computeInstallment(params: {
  orderTotal: bigint;
  downPayment: bigint;
  interestRateBp: number;
  termMonths: number;
}): InstallmentComputation {
  if (params.termMonths < 1) {
    throw new Error('termMonths >= 1 bo‘lishi kerak');
  }
  if (params.downPayment < 0n || params.downPayment >= params.orderTotal) {
    throw new Error('downPayment 0 va order total oralig‘ida bo‘lishi kerak');
  }
  if (params.interestRateBp < 0) {
    throw new Error('interestRateBp manfiy bo‘lishi mumkin emas');
  }

  const principal = params.orderTotal - params.downPayment;
  const interest = (principal * BigInt(params.interestRateBp)) / 10000n; // truncate
  const totalPayable = principal + interest;

  // Teng ulushlarga bo'lish (tiyin yo'qolmaydi — allocate).
  const ratios = Array.from({ length: params.termMonths }, () => 1n);
  const shares = Money.fromMinor(totalPayable, 'UZS').allocate(ratios);
  const lines = shares.map((m, i) => ({ installmentNumber: i + 1, amount: m.amount }));

  return { principal, interest, totalPayable, lines };
}
