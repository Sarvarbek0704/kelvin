import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';

export type PriceRow = Prisma.PriceGetPayload<{ include: { priceList: true } }>;
export type DiscountRow = Prisma.DiscountGetPayload<Record<string, never>>;

/**
 * Narx — Prisma qatlami (docs/03, docs/07 §7).
 *
 * Bazaviy narx: bir necha PriceList mos kelsa, `priority` YUQORISI g'olib;
 * ro'yxat ichida `minQuantity` <= savat miqdori bo'lgan ENG YUQORI tier (ulgurji).
 */
@Injectable()
export class PriceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Variant uchun berilgan miqdorda amal qiluvchi barcha narxlar (faol +
   * validity oynasida), ro'yxat priority va tier bo'yicha saralangan.
   * Birinchisi — g'olib.
   */
  async findApplicablePrices(variantId: string, quantity: number, at: Date): Promise<PriceRow[]> {
    const rows = await this.prisma.price.findMany({
      where: {
        variantId,
        minQuantity: { lte: quantity },
        priceList: {
          isActive: true,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: at } }] },
            { OR: [{ validTo: null }, { validTo: { gte: at } }] },
          ],
        },
      },
      include: { priceList: true },
    });
    // priority DESC, keyin minQuantity DESC (eng yaqin ulgurji tier).
    return rows.sort((a, b) =>
      a.priceList.priority !== b.priceList.priority
        ? b.priceList.priority - a.priceList.priority
        : b.minQuantity - a.minQuantity,
    );
  }

  /** Admin: variantning berilgan ro'yxatdagi (masalan RETAIL) narxlari. */
  findPricesByListCode(variantId: string, listCode: string): Promise<PriceRow[]> {
    return this.prisma.price.findMany({
      where: { variantId, priceList: { code: listCode } },
      include: { priceList: true },
      orderBy: { minQuantity: 'asc' },
    });
  }

  /** Ro'yxat kodi bo'yicha PriceList (upsert uchun id kerak). */
  findPriceListByCode(code: string): Promise<{ id: string } | null> {
    return this.prisma.priceList.findUnique({ where: { code }, select: { id: true } });
  }

  /** Variant mavjudligini tekshirish (FK xatosi o'rniga aniq 404 uchun). */
  async variantExists(variantId: string): Promise<boolean> {
    const row = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });
    return row !== null;
  }

  /**
   * Narxni upsert: (priceListId, variantId, minQuantity) unikal kaliti bo'yicha.
   * Bor bo'lsa amount yangilanadi, yo'q bo'lsa yaratiladi. ⚠️ amount — TIYIN.
   */
  upsertPrice(data: {
    priceListId: string;
    variantId: string;
    amount: bigint;
    minQuantity: number;
  }): Promise<PriceRow> {
    const key = {
      priceListId: data.priceListId,
      variantId: data.variantId,
      minQuantity: data.minQuantity,
    };
    return this.prisma.price.upsert({
      where: { priceListId_variantId_minQuantity: key },
      create: { ...key, amount: data.amount },
      update: { amount: data.amount },
      include: { priceList: true },
    });
  }

  /** Faol + validity oynasidagi chegirmalar, priority bo'yicha. */
  findActiveDiscounts(at: Date): Promise<DiscountRow[]> {
    return this.prisma.discount.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: at } }] },
          { OR: [{ validTo: null }, { validTo: { gte: at } }] },
        ],
      },
      orderBy: { priority: 'asc' },
    });
  }
}
