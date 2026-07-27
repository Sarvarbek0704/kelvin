import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';

export type ProductRow = Prisma.ProductGetPayload<Record<string, never>>;
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true; category: true; media: true };
}>;
export type VariantRow = Prisma.ProductVariantGetPayload<Record<string, never>>;
/** Ro'yxat qatori — faqat asosiy rasm (media[0]) bilan (kartochka uchun). */
export type ProductListRow = Prisma.ProductGetPayload<{ include: { media: true } }>;

/** Mahsulot galereyasi: faqat rasm media, primary birinchi. */
const PRODUCT_MEDIA_INCLUDE = {
  where: { kind: 'IMAGE' },
  orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
} satisfies Prisma.Product$mediaArgs;

/** Ro'yxat kartochkasi uchun — faqat bitta asosiy rasm. */
const PRIMARY_MEDIA_INCLUDE = {
  ...PRODUCT_MEDIA_INCLUDE,
  take: 1,
} satisfies Prisma.Product$mediaArgs;

/** Product + ProductVariant — Prisma qatlami. docs/05 §1.2, §1.3 */
@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ProductRow | null> {
    return this.prisma.product.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlugWithVariants(slug: string): Promise<ProductWithVariants | null> {
    return this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        variants: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
        media: PRODUCT_MEDIA_INCLUDE,
      },
    });
  }

  findByIdWithVariants(id: string): Promise<ProductWithVariants | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        variants: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
        media: PRODUCT_MEDIA_INCLUDE,
      },
    });
  }

  findBySlug(slug: string): Promise<ProductRow | null> {
    return this.prisma.product.findFirst({ where: { slug, deletedAt: null } });
  }

  /** Cursor-based ro'yxat (kategoriya bo'yicha, ixtiyoriy). */
  list(params: {
    categoryId?: string;
    onlyActive: boolean;
    limit: number;
    cursorId?: string;
  }): Promise<ProductListRow[]> {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(params.categoryId !== undefined && { categoryId: params.categoryId }),
        ...(params.onlyActive && { status: 'ACTIVE' }),
        ...(params.cursorId !== undefined && { id: { gt: params.cursorId } }),
      },
      include: { media: PRIMARY_MEDIA_INCLUDE },
      orderBy: { id: 'asc' },
      take: params.limit,
    });
  }

  /** Barcha ACTIVE (o'chirilmagan) mahsulot id'lari — qidiruv indeksini qayta qurish uchun. */
  async findAllActiveIds(): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.id);
  }

  create(data: Prisma.ProductCreateInput): Promise<ProductRow> {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductRow> {
    return this.prisma.product.update({ where: { id }, data });
  }

  activeVariants(productId: string): Promise<VariantRow[]> {
    return this.prisma.productVariant.findMany({
      where: { productId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findVariantById(id: string): Promise<VariantRow | null> {
    return this.prisma.productVariant.findFirst({ where: { id, deletedAt: null } });
  }

  /** Shtrix-kod yoki SKU bo'yicha variant (skaner/POS — docs/15 §8.1 6.6). */
  findVariantByCode(
    code: string,
  ): Promise<Prisma.ProductVariantGetPayload<{ include: { product: true } }> | null> {
    return this.prisma.productVariant.findFirst({
      where: { deletedAt: null, OR: [{ barcode: code }, { sku: code }] },
      include: { product: true },
    });
  }

  /** Snapshot uchun — variantlar + mahsulot (nom, status). order porti ishlatadi. */
  findVariantsWithProduct(
    ids: readonly string[],
  ): Promise<
    Prisma.ProductVariantGetPayload<{
      include: { product: { include: { media: true } } };
    }>[]
  > {
    return this.prisma.productVariant.findMany({
      where: { id: { in: [...ids] }, deletedAt: null },
      // Savat/buyurtma qatori uchun asosiy rasm ham kerak (snapshot thumbnail).
      include: { product: { include: { media: PRIMARY_MEDIA_INCLUDE } } },
    });
  }

  updateVariant(id: string, data: Prisma.ProductVariantUpdateInput): Promise<VariantRow> {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
