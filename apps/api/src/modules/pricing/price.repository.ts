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
