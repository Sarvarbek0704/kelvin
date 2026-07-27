/**
 * cart modulining PUBLIC porti (docs/02 §6.1) — checkout uchun. order moduli
 * FAQAT shu fayl orqali savatga murojaat qiladi.
 */

export interface CheckoutCartLine {
  readonly variantId: string;
  readonly quantity: number;
}

export interface CheckoutCart {
  readonly id: string;
  readonly items: readonly CheckoutCartLine[];
}

export const CART_PORT = Symbol('CartPort');

export interface CartPort {
  getCartForCheckout(cartId: string): Promise<CheckoutCart | null>;
  /**
   * Checkout uchun savatni ATOMIK "da'vo qiladi" (o'chiradi) — idempotentlik
   * darvozasi. ⚠️ Parallel ikki checkout'dan faqat BITTASI true oladi
   * (docs/07 §1: "ikki tab → 1 buyurtma"). true = da'vo qilindi, davom eting.
   */
  claimForCheckout(cartId: string): Promise<boolean>;
}
