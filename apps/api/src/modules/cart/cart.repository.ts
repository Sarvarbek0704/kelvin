import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotFoundError } from '../../core/errors/domain.error';

export type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;

/**
 * Savat — Prisma qatlami (docs/07 §1). Mehmon savati `sessionId` (cart_token),
 * mijoz savati `customerId` bilan.
 *
 * ⚠️ cart_items.variant_id → FK (Restrict). Mavjud bo'lmagan variant qo'shilsa
 *    P2003 — service uni NotFoundError'ga aylantiradi.
 */
@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySession(sessionId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findByCustomer(customerId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { customerId },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findWithItems(cartId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } });
  }

  create(owner: { customerId?: string; sessionId?: string }): Promise<CartWithItems> {
    return this.prisma.cart.create({
      data: {
        ...(owner.customerId !== undefined && { customerId: owner.customerId }),
        ...(owner.sessionId !== undefined && { sessionId: owner.sessionId }),
      },
      include: { items: true },
    });
  }

  /** Qo'shish: mavjud bo'lsa miqdorni oshiradi, aks holda yaratadi. */
  async incrementItem(cartId: string, variantId: string, delta: number): Promise<void> {
    await this.upsertItem(cartId, variantId, { increment: delta }, delta);
  }

  /** Aniq miqdor o'rnatish. */
  async setItem(cartId: string, variantId: string, quantity: number): Promise<void> {
    await this.upsertItem(cartId, variantId, quantity, quantity);
  }

  /** ⚠️ variant FK (P2003) → NotFoundError (infrastructure qatlami Prisma'ni biladi). */
  private async upsertItem(
    cartId: string,
    variantId: string,
    update: number | { increment: number },
    createQty: number,
  ): Promise<void> {
    try {
      await this.prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId, variantId } },
        create: { cartId, variantId, quantity: createQty },
        update: { quantity: update },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new NotFoundError('Variant', variantId);
      }
      throw err;
    }
  }

  async removeItem(cartId: string, variantId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId, variantId } });
  }

  async clearItems(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  /** Merge uchun — savat qatorlarini bitta tranzaksiyada almashtiradi. */
  async replaceItems(
    cartId: string,
    items: readonly { variantId: string; quantity: number }[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId } }),
      ...items.map((it) =>
        this.prisma.cartItem.create({
          data: { cartId, variantId: it.variantId, quantity: it.quantity },
        }),
      ),
    ]);
  }

  async deleteCart(cartId: string): Promise<void> {
    await this.prisma.cart.delete({ where: { id: cartId } });
  }

  /**
   * Checkout uchun savatni ATOMIK o'chiradi — idempotentlik darvozasi.
   * @returns true = shu chaqiruv savatni o'chirdi (da'vo qildi); false = allaqachon yo'q.
   * ⚠️ cart_items cascade (Cart onDelete). Parallel checkout'dan faqat biri true.
   */
  async claimForCheckout(cartId: string): Promise<boolean> {
    const affected = await this.prisma.$executeRaw`
      DELETE FROM "carts" WHERE "id" = ${cartId}::uuid`;
    return affected > 0;
  }
}
