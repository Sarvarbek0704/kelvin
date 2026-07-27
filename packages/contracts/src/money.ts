/**
 * Pul — wire (API) darajasidagi ifoda.
 *
 * ⚠️ Server ichida pul `core/money/Money` (bigint) bilan hisoblanadi.
 *    Bu fayl faqat API javob/so'rovidagi SHAKL: tiyinda, STRING sifatida.
 *
 * Nega string: JSON `number` 2^53 dan katta butun sonni yo'qotadi va float
 * xatosini kiritadi. 12 500 so'm → "1250000" tiyin.
 *
 * @see docs/04-api-spec.md §2.5
 * @see docs/adr/0003-money-as-bigint-tiyin.md
 */

export type Currency = 'UZS' | 'USD' | 'EUR';

/** Pul — MINOR birlikda (tiyin). Wire'da string. */
export interface Money {
  /** Tiyinda. Misol: "1250000" = 12 500.00 UZS */
  readonly amountMinor: string;
  readonly currency: Currency;
}

export function toMoney(amountMinor: bigint, currency: Currency = 'UZS'): Money {
  return { amountMinor: amountMinor.toString(), currency };
}

export function fromMoney(money: Money): bigint {
  return BigInt(money.amountMinor);
}

/**
 * DIQQAT: bu funksiya QASDDAN yo'q:
 *   export function moneyToNumber(m: Money): number
 * Chunki u float'ga aylantiradi va tiyin yo'qoladi. Formatlash — faqat UI da,
 * Intl.NumberFormat orqali, hisobsiz.
 */
