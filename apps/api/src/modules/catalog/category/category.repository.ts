import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';

export type CategoryRow = Prisma.CategoryGetPayload<Record<string, never>>;

/**
 * Kategoriya — Prisma qatlami (materialized path + parent_id).
 * docs/05-catalog-and-search.md §1.1
 */
@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<CategoryRow | null> {
    return this.prisma.category.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string): Promise<CategoryRow | null> {
    return this.prisma.category.findFirst({ where: { slug, deletedAt: null } });
  }

  /** Barcha faol kategoriyalar — daraxt qurish uchun (path bo'yicha tartib). */
  findAll(onlyActive: boolean): Promise<CategoryRow[]> {
    return this.prisma.category.findMany({
      where: { deletedAt: null, ...(onlyActive && { isActive: true }) },
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { path: 'asc' }],
    });
  }

  countChildren(parentId: string): Promise<number> {
    return this.prisma.category.count({ where: { parentId, deletedAt: null } });
  }

  countProducts(categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId, deletedAt: null } });
  }

  /** Berilgan path bilan boshlanadigan barcha avlodlar (o'zidan tashqari). */
  findDescendants(pathPrefix: string): Promise<CategoryRow[]> {
    return this.prisma.category.findMany({
      where: { path: { startsWith: pathPrefix }, deletedAt: null, NOT: { path: pathPrefix } },
    });
  }

  create(data: Prisma.CategoryCreateInput, tx?: Prisma.TransactionClient): Promise<CategoryRow> {
    return (tx ?? this.prisma).category.create({ data });
  }

  update(
    id: string,
    data: Prisma.CategoryUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CategoryRow> {
    return (tx ?? this.prisma).category.update({ where: { id }, data });
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
