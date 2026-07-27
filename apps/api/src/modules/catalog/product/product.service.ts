import { Injectable } from '@nestjs/common';
import {
  type CursorPage,
  DEFAULT_PAGE_LIMIT,
  decodeCursor,
  encodeCursor,
  MAX_PAGE_LIMIT,
} from '@kelvin/contracts';

import { AuditService } from '../../../shared/audit/audit.service';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { toJson } from '../../../shared/json';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../../core/errors/domain.error';
import { CategoryRepository } from '../category/category.repository';
import {
  ProductRepository,
  type ProductListRow,
  type ProductRow,
  type ProductWithVariants,
} from './product.repository';
import { type CreateProductDto, type UpdateProductDto } from './dto/product.dto';
import { type CatalogPort, type VariantSnapshot } from '../catalog.port';

@Injectable()
export class ProductService implements CatalogPort {
  constructor(
    private readonly repo: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** Shtrix-kod yoki SKU bo'yicha variant qidirish (skaner/POS — docs/15 §8 6.6). */
  async lookupByCode(code: string): Promise<{
    variantId: string;
    sku: string;
    barcode: string | null;
    productSlug: string;
    productName: unknown;
    productStatus: string;
  }> {
    const v = await this.repo.findVariantByCode(code);
    if (v === null) {
      throw new NotFoundError('Variant (shtrix-kod/SKU)', code);
    }
    return {
      variantId: v.id,
      sku: v.sku,
      barcode: v.barcode,
      productSlug: v.product.slug,
      productName: v.product.name,
      productStatus: v.product.status,
    };
  }

  /** CatalogPort — buyurtma snapshot'i uchun variant ma'lumoti. */
  async getVariantSnapshots(variantIds: readonly string[]): Promise<VariantSnapshot[]> {
    if (variantIds.length === 0) {
      return [];
    }
    const rows = await this.repo.findVariantsWithProduct(variantIds);
    return rows.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      productName: (v.product.name ?? {}) as Record<string, string>,
      variantAxis: (v.axisValues ?? {}) as Record<string, unknown>,
      attributes: (v.attributes ?? {}) as Record<string, unknown>,
      productActive: v.product.status === 'ACTIVE',
      imageUrl: v.product.media[0]?.url ?? null,
    }));
  }

  async create(dto: CreateProductDto): Promise<ProductRow> {
    if (!(await this.categories.findById(dto.categoryId))) {
      throw new NotFoundError('Kategoriya', dto.categoryId);
    }
    if (await this.repo.findBySlug(dto.slug)) {
      throw new ConflictError(`Bu slug band: ${dto.slug}`, { slug: dto.slug });
    }
    const created = await this.repo.create({
      slug: dto.slug,
      name: toJson(dto.name),
      category: { connect: { id: dto.categoryId } },
      ...(dto.description !== undefined && { description: toJson(dto.description) }),
      ...(dto.brand !== undefined && { brand: dto.brand }),
      ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
      ...(dto.countryOfOrigin !== undefined && { countryOfOrigin: dto.countryOfOrigin }),
      ...(dto.isFragile !== undefined && { isFragile: dto.isFragile }),
      ...(dto.requiresInstallation !== undefined && {
        requiresInstallation: dto.requiresInstallation,
      }),
      ...(dto.metaTitle !== undefined && { metaTitle: toJson(dto.metaTitle) }),
      ...(dto.metaDescription !== undefined && { metaDescription: toJson(dto.metaDescription) }),
    });
    await this.audit.record({
      action: 'PRODUCT_CREATE',
      resourceType: 'Product',
      resourceId: created.id,
      after: { slug: created.slug },
    });
    return created;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductRow> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Mahsulot', id);
    }
    if (dto.categoryId !== undefined && !(await this.categories.findById(dto.categoryId))) {
      throw new NotFoundError('Kategoriya', dto.categoryId);
    }
    if (
      dto.slug !== undefined &&
      dto.slug !== existing.slug &&
      (await this.repo.findBySlug(dto.slug))
    ) {
      throw new ConflictError(`Bu slug band: ${dto.slug}`, { slug: dto.slug });
    }
    const updated = await this.repo.update(id, {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: toJson(dto.name) }),
      ...(dto.categoryId !== undefined && { category: { connect: { id: dto.categoryId } } }),
      ...(dto.description !== undefined && { description: toJson(dto.description) }),
      ...(dto.brand !== undefined && { brand: dto.brand }),
      ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
      ...(dto.countryOfOrigin !== undefined && { countryOfOrigin: dto.countryOfOrigin }),
      ...(dto.isFragile !== undefined && { isFragile: dto.isFragile }),
      ...(dto.requiresInstallation !== undefined && {
        requiresInstallation: dto.requiresInstallation,
      }),
      ...(dto.metaTitle !== undefined && { metaTitle: toJson(dto.metaTitle) }),
      ...(dto.metaDescription !== undefined && { metaDescription: toJson(dto.metaDescription) }),
    });
    await this.audit.record({ action: 'PRODUCT_UPDATE', resourceType: 'Product', resourceId: id });
    return updated;
  }

  /**
   * Nashr qilish — majburiy to'liqlik tekshiriladi.
   * DoD: nashr etilgan mahsulotda kamida bitta faol variant bo'lishi shart.
   */
  async publish(id: string): Promise<ProductRow> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Mahsulot', id);
    }
    const variants = await this.repo.activeVariants(id);
    if (variants.length === 0) {
      throw new BusinessRuleError(
        'INCOMPLETE_PRODUCT',
        'Nashr uchun kamida bitta faol variant kerak (variant matritsasini generatsiya qiling)',
      );
    }
    const updated = await this.repo.transaction(async (tx) => {
      const p = await tx.product.update({ where: { id }, data: { status: 'ACTIVE' } });
      await this.outbox.enqueue(
        {
          eventType: 'ProductPublished',
          aggregateType: 'Product',
          aggregateId: id,
          payload: { slug: p.slug },
        },
        tx,
      );
      return p;
    });
    await this.audit.record({
      action: 'PRODUCT_PUBLISH',
      resourceType: 'Product',
      resourceId: id,
      before: { status: existing.status },
      after: { status: 'ACTIVE' },
    });
    return updated;
  }

  /** Ommaviy: faqat ACTIVE mahsulot (DRAFT → 404). */
  async getPublicBySlug(slug: string): Promise<ProductWithVariants> {
    const product = await this.repo.findBySlugWithVariants(slug);
    if (product?.status !== 'ACTIVE') {
      throw new NotFoundError('Mahsulot');
    }
    return product;
  }

  /** Admin: har qanday holatdagi mahsulot (draft ham). */
  async getForAdmin(id: string): Promise<ProductWithVariants> {
    const product = await this.repo.findByIdWithVariants(id);
    if (!product) {
      throw new NotFoundError('Mahsulot', id);
    }
    return product;
  }

  listPublic(query: {
    categoryId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<CursorPage<ProductListRow>> {
    return this.list({ ...query, onlyActive: true });
  }

  /** Admin — barcha holatdagi mahsulotlar (DRAFT ham). */
  listAdmin(query: {
    categoryId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<CursorPage<ProductListRow>> {
    return this.list({ ...query, onlyActive: false });
  }

  private async list(query: {
    categoryId?: string;
    limit?: number;
    cursor?: string;
    onlyActive: boolean;
  }): Promise<CursorPage<ProductListRow>> {
    const limit = Math.min(query.limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
    const cursorId = query.cursor !== undefined ? decodeCursor(query.cursor).id : undefined;
    const rows = await this.repo.list({
      onlyActive: query.onlyActive,
      limit: limit + 1,
      ...(query.categoryId !== undefined && { categoryId: query.categoryId }),
      ...(cursorId !== undefined && { cursorId }),
    });
    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const last = items.at(-1);
    return {
      items,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage && last ? encodeCursor(last.id) : null,
      },
    };
  }
}
