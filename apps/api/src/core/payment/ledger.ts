/**
 * Double-entry ledger — SOF (docs/08 §6). Har pul harakati bir `transactionId`
 * ostida MUVOZANATLI yozuvlar: SUM(debit) === SUM(credit).
 *
 * ⚠️ schema.prisma `LedgerEntry` = account + direction(DEBIT|CREDIT) + amount
 *    (doc §6.4 dagi debit/credit ustunlaridan farq — schema g'olib, docs/03 §5).
 * ⚠️ Qarz — AKTIV (asset.receivable), majburiyat emas (docs/08 izoh, ADR fix).
 */

export type LedgerDirection = 'DEBIT' | 'CREDIT';

/** Hisoblar rejasi (chart of accounts) — docs/08 §6.3. */
export const ACCOUNTS = {
  CASH_BANK: 'asset.cash.bank',
  CASH_COURIER: 'asset.cash.courier',
  CASH_REGISTER: 'asset.cash.register',
  /** Onlayn provayder pulni oldi, bizga hali o'tkazmadi. */
  RECEIVABLE_PROVIDER: 'asset.receivable.provider',
  /** Rassrochka qarzi — mijoz bo'lib-bo'lib to'laydi (docs/08 §7). */
  RECEIVABLE_INSTALLMENT: 'asset.receivable.installment',
  REVENUE_PRODUCT: 'revenue.product',
  EXPENSE_REFUND: 'expense.refund',
  /** Provayder komissiyasi — settlement'da (docs/08 §6.5). ⚠️ revenue'dan ayrilmaydi. */
  EXPENSE_PROVIDER_FEE: 'expense.provider_fee',
} as const;

export interface LedgerEntryDraft {
  readonly account: string;
  readonly direction: LedgerDirection;
  /** TIYIN, har doim > 0 (manfiy — bu qarama-qarshi yozuv, minus emas). */
  readonly amount: bigint;
  readonly description?: string;
}

/** Pul qayerga tushdi — provayderga qarab (docs/08 §6.5). */
export function landingAccountFor(provider: string): string {
  switch (provider) {
    case 'CASH':
      return ACCOUNTS.CASH_COURIER;
    case 'BANK_TRANSFER':
      return ACCOUNTS.CASH_BANK;
    // Onlayn: CLICK/PAYME/UZUM — pul provayderda, settlement'gacha receivable.
    default:
      return ACCOUNTS.RECEIVABLE_PROVIDER;
  }
}

/**
 * Sotuv to'lovi yozuvlari (soddalashtirilgan, QQS'siz — §6.5 A):
 *   DEBIT  <landing>        amount   (pul/qarz keldi)
 *   CREDIT revenue.product  amount   (daromad tan olindi)
 */
export function buildSaleLedger(provider: string, amount: bigint): LedgerEntryDraft[] {
  return [
    { account: landingAccountFor(provider), direction: 'DEBIT', amount, description: 'Sotuv to‘lovi' },
    { account: ACCOUNTS.REVENUE_PRODUCT, direction: 'CREDIT', amount, description: 'Mahsulot daromadi' },
  ];
}

/**
 * Refund yozuvlari (docs/08 §6.6-6.7 — pul qaytdi):
 *   DEBIT  expense.refund  amount   (refund xarajati tan olindi)
 *   CREDIT <landing>       amount   (pul landing hisobidan chiqdi)
 * ⚠️ O'chirish/UPDATE emas — YANGI muvozanatli tranzaksiya (append-only, trigger).
 */
export function buildRefundLedger(provider: string, amount: bigint): LedgerEntryDraft[] {
  return [
    { account: ACCOUNTS.EXPENSE_REFUND, direction: 'DEBIT', amount, description: 'Refund xarajati' },
    { account: landingAccountFor(provider), direction: 'CREDIT', amount, description: 'Refund — pul qaytdi' },
  ];
}

/**
 * Rassrochka rejasi ochilishi (docs/08 §7): qarz va daromad tan olinadi.
 *   DEBIT  asset.receivable.installment  totalPayable  (mijoz qarzi — aktiv)
 *   CREDIT revenue.product               totalPayable  (daromad, foiz bilan)
 */
export function buildInstallmentPlanLedger(totalPayable: bigint): LedgerEntryDraft[] {
  return [
    { account: ACCOUNTS.RECEIVABLE_INSTALLMENT, direction: 'DEBIT', amount: totalPayable, description: 'Rassrochka qarzi' },
    { account: ACCOUNTS.REVENUE_PRODUCT, direction: 'CREDIT', amount: totalPayable, description: 'Rassrochka daromadi' },
  ];
}

/**
 * Rassrochka to'lovi (bo'lib-bo'lib): naqd keldi, qarz kamaydi.
 *   DEBIT  asset.cash.register           amount  (pul kassaga tushdi)
 *   CREDIT asset.receivable.installment  amount  (qarz kamaydi)
 */
export function buildInstallmentPaymentLedger(amount: bigint): LedgerEntryDraft[] {
  return [
    { account: ACCOUNTS.CASH_REGISTER, direction: 'DEBIT', amount, description: 'Rassrochka to‘lovi' },
    { account: ACCOUNTS.RECEIVABLE_INSTALLMENT, direction: 'CREDIT', amount, description: 'Qarz kamaydi' },
  ];
}

/**
 * Provayder settlement (docs/08 §6.5.A): receivable → bank + komissiya.
 *   DEBIT  asset.cash.bank            amount − fee  (net pul bankka tushdi)
 *   DEBIT  expense.provider_fee       fee           (komissiya — XARAJAT, revenue emas)
 *   CREDIT asset.receivable.provider  amount        (qarz yopildi)
 * ⚠️ Komissiya daromaddan AYRILMAYDI — aks holda "sotuv hajmi" buziladi (§6.5).
 */
export function buildSettlementLedger(amount: bigint, feeAmount: bigint): LedgerEntryDraft[] {
  const net = amount - feeAmount;
  const entries: LedgerEntryDraft[] = [
    { account: ACCOUNTS.CASH_BANK, direction: 'DEBIT', amount: net, description: 'Settlement — net pul' },
    { account: ACCOUNTS.RECEIVABLE_PROVIDER, direction: 'CREDIT', amount, description: 'Provayder qarzi yopildi' },
  ];
  if (feeAmount > 0n) {
    entries.splice(1, 0, { account: ACCOUNTS.EXPENSE_PROVIDER_FEE, direction: 'DEBIT', amount: feeAmount, description: 'Provayder komissiyasi' });
  }
  return entries;
}

/**
 * POS sotuvi (docs/15 §10): naqd → kassa, karta → bank.
 *   DEBIT  asset.cash.register|bank  amount  (pul kassaga/bankka)
 *   CREDIT revenue.product           amount  (daromad)
 */
export function buildPosSaleLedger(paymentMethod: string, amount: bigint): LedgerEntryDraft[] {
  const landing = paymentMethod === 'CARD' ? ACCOUNTS.CASH_BANK : ACCOUNTS.CASH_REGISTER;
  return [
    { account: landing, direction: 'DEBIT', amount, description: 'POS sotuvi' },
    { account: ACCOUNTS.REVENUE_PRODUCT, direction: 'CREDIT', amount, description: 'POS daromadi' },
  ];
}

/** Muvozanat: DEBIT yig'indisi === CREDIT yig'indisi. */
export function isBalanced(entries: readonly LedgerEntryDraft[]): boolean {
  let debit = 0n;
  let credit = 0n;
  for (const e of entries) {
    if (e.direction === 'DEBIT') {
      debit += e.amount;
    } else {
      credit += e.amount;
    }
  }
  return debit === credit;
}
