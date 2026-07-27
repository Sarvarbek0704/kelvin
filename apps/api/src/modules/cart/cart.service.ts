import { Inject, Injectable } from '@nestjs/common';

import { BusinessRuleError, NotFoundError } from '../../core/errors/domain.error';
import { PRICING_PORT, type PricingPort } from '../pricing/pricing.port';
import { CATALOG_PORT, type CatalogPort } from '../catalog/catalog.port';
import { type CartPort, type CheckoutCart } from './cart.port';
import { CartRepository, type CartWithItems } from './cart.repository';

/** JSON javob — pul TIYINDA, string (BigInt JSON'ga sig'maydi — docs/07 §3.5). */
export interface CartLineView {
  readonly variantId: string;
  readonly sku: string;
  /** Mahsulot nomi — ko'p tilli (Loc). Frontend `label()` bilan ko'rsatadi. */
  readonly name: Record<string, string>;
  readonly quantity: number;
  readonly unitPrice: string;
  readonly lineTotal: string;
  /** Asosiy rasm URL'i (thumbnail) — rasm yo'q bo'lsa null. */
  readonly image: string | null;
}

export interface CartView {
  readonly cartId: string;
  readonly itemCount: number;
  readonly lines: readonly CartLineView[];
  readonly subtotal: string;
  readonly discountTotal: string;
  readonly totalAmount: string;
}

export interface MergeSummary {
  readonly added: number;
  readonly updated: number;
  readonly totalItems: number;
}

/**
 * cart — savat (docs/07 §1). Narx MUZLATILMAYDI: view har safar pricing orqali
 * qayta hisoblanadi (savat — niyat, shartnoma emas; §5.4).
 */
@Injectable()
export class CartService implements CartPort {
  constructor(
    private readonly repo: CartRepository,
    @Inject(PRICING_PORT) private readonly pricing: PricingPort,
    @Inject(CATALOG_PORT) private readonly catalog: CatalogPort,
  ) {}

  // --- CartPort (checkout uchun order moduliga) -----------------------------

  async getCartForCheckout(cartId: string): Promise<CheckoutCart | null> {
    const cart = await this.repo.findWithItems(cartId);
    if (cart === null) {
      return null;
    }
    return {
      id: cart.id,
      items: cart.items.map((it) => ({ variantId: it.variantId, quantity: it.quantity })),
    };
  }

  async claimForCheckout(cartId: string): Promise<boolean> {
    return await this.repo.claimForCheckout(cartId);
  }

  async getOrCreateForCustomer(customerId: string): Promise<CartWithItems> {
    return await ((await this.repo.findByCustomer(customerId)) ?? this.repo.create({ customerId }));
  }

  async getOrCreateForSession(sessionId: string): Promise<CartWithItems> {
    return await ((await this.repo.findBySession(sessionId)) ?? this.repo.create({ sessionId }));
  }

  /** Qo'shish (mavjud bo'lsa miqdor oshadi). Variant yo'q → NotFoundError (repo). */
  async addItem(cartId: string, variantId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Miqdor musbat bo‘lishi kerak');
    }
    await this.repo.incrementItem(cartId, variantId, quantity);
  }

  /** Aniq miqdor; 0 yoki manfiy → qatorni o'chiradi. */
  async setQuantity(cartId: string, variantId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.repo.removeItem(cartId, variantId);
      return;
    }
    await this.repo.setItem(cartId, variantId, quantity);
  }

  async removeItem(cartId: string, variantId: string): Promise<void> {
    await this.repo.removeItem(cartId, variantId);
  }

  async clear(cartId: string): Promise<void> {
    await this.repo.clearItems(cartId);
  }

  /** ID bo'yicha savat ko'rinishi (mutatsiyadan keyin qayta yuklash uchun). */
  async viewById(cartId: string): Promise<CartView> {
    const cart = await this.repo.findWithItems(cartId);
    if (cart === null) {
      throw new NotFoundError('Savat', cartId);
    }
    return await this.view(cart);
  }

  /** Savat ko'rinishi — narx pricing orqali qayta hisoblanadi. */
  async view(cart: CartWithItems): Promise<CartView> {
    if (cart.items.length === 0) {
      return {
        cartId: cart.id,
        itemCount: 0,
        lines: [],
        subtotal: '0',
        discountTotal: '0',
        totalAmount: '0',
      };
    }
    const [priced, snapshots] = await Promise.all([
      this.pricing.priceCart({
        lines: cart.items.map((it) => ({ variantId: it.variantId, quantity: it.quantity })),
      }),
      this.catalog.getVariantSnapshots(cart.items.map((it) => it.variantId)),
    ]);
    const snapByVariant = new Map(snapshots.map((s) => [s.variantId, s]));
    return {
      cartId: cart.id,
      itemCount: cart.items.reduce((n, it) => n + it.quantity, 0),
      lines: priced.lines.map((l) => {
        const snap = snapByVariant.get(l.variantId);
        return {
          variantId: l.variantId,
          sku: snap?.sku ?? '',
          name: snap?.productName ?? {},
          quantity: l.quantity,
          unitPrice: l.unitPrice.toString(),
          lineTotal: l.lineTotal.toString(),
          image: snap?.imageUrl ?? null,
        };
      }),
      subtotal: priced.subtotal.toString(),
      discountTotal: priced.discountTotal.toString(),
      totalAmount: priced.totalAmount.toString(),
    };
  }

  /**
   * Mehmon savatini mijoz savatiga birlashtirish — union + max (docs/07 §1.3).
   * ⚠️ Bir xil variant ikkalasida bo'lsa KATTA miqdor olinadi (yig'indi emas).
   * Natija mijozga ko'rsatiladi (jim emas — summary qaytadi).
   */
  async merge(
    sessionId: string,
    customerId: string,
  ): Promise<{ cart: CartWithItems; summary: MergeSummary }> {
    const userCart = await this.getOrCreateForCustomer(customerId);
    const guestCart = await this.repo.findBySession(sessionId);

    if (guestCart === null || guestCart.id === userCart.id || guestCart.items.length === 0) {
      return {
        cart: userCart,
        summary: { added: 0, updated: 0, totalItems: userCart.items.length },
      };
    }

    const byVariant = new Map<string, number>();
    for (const it of userCart.items) {
      byVariant.set(it.variantId, it.quantity);
    }
    let added = 0;
    let updated = 0;
    for (const it of guestCart.items) {
      const existing = byVariant.get(it.variantId);
      if (existing === undefined) {
        added += 1;
        byVariant.set(it.variantId, it.quantity);
      } else {
        const max = Math.max(existing, it.quantity);
        if (max !== existing) {
          updated += 1;
        }
        byVariant.set(it.variantId, max);
      }
    }

    const merged = [...byVariant.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
    await this.repo.replaceItems(userCart.id, merged);
    await this.repo.deleteCart(guestCart.id);

    const refreshed = await this.repo.findWithItems(userCart.id);
    return {
      cart: refreshed ?? userCart,
      summary: { added, updated, totalItems: merged.length },
    };
  }
}
