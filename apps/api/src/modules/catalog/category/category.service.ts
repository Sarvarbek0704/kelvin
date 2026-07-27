import { Injectable } from '@nestjs/common';

import { AuditService } from '../../../shared/audit/audit.service';
import { toJson } from '../../../shared/json';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../../core/errors/domain.error';
import { CategoryRepository, type CategoryRow } from './category.repository';
import { type CreateCategoryDto, type UpdateCategoryDto } from './dto/category.dto';

export interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
}

@Injectable()
export class CategoryService {
  constructor(
    private readonly repo: CategoryRepository,
    private readonly audit: AuditService,
  ) {}

  private async computePath(
    slug: string,
    parentId?: string,
  ): Promise<{ path: string; depth: number }> {
    if (parentId === undefined) {
      return { path: `/${slug}/`, depth: 0 };
    }
    const parent = await this.repo.findById(parentId);
    if (!parent) {
      throw new NotFoundError('Ota kategoriya', parentId);
    }
    return { path: `${parent.path}${slug}/`, depth: parent.depth + 1 };
  }

  async create(dto: CreateCategoryDto): Promise<CategoryRow> {
    if (await this.repo.findBySlug(dto.slug)) {
      throw new ConflictError(`Bu slug band: ${dto.slug}`, { slug: dto.slug });
    }
    const { path, depth } = await this.computePath(dto.slug, dto.parentId);

    const created = await this.repo.create({
      slug: dto.slug,
      name: toJson(dto.name),
      path,
      depth,
      ...(dto.description !== undefined && { description: toJson(dto.description) }),
      ...(dto.parentId !== undefined && { parent: { connect: { id: dto.parentId } } }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.metaTitle !== undefined && { metaTitle: toJson(dto.metaTitle) }),
      ...(dto.metaDescription !== undefined && { metaDescription: toJson(dto.metaDescription) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    await this.audit.record({
      action: 'CATEGORY_CREATE',
      resourceType: 'Category',
      resourceId: created.id,
      after: { slug: created.slug, path: created.path },
    });
    return created;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryRow> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Kategoriya', id);
    }

    // slug yoki parent o'zgarsa — path va avlodlar path'i qayta hisoblanadi.
    const slugChanged = dto.slug !== undefined && dto.slug !== existing.slug;
    const parentChanged = dto.parentId !== undefined && dto.parentId !== existing.parentId;

    if (slugChanged && dto.slug !== undefined && (await this.repo.findBySlug(dto.slug))) {
      throw new ConflictError(`Bu slug band: ${dto.slug}`, { slug: dto.slug });
    }

    let newPath = existing.path;
    let newDepth = existing.depth;
    if (slugChanged || parentChanged) {
      const slug = dto.slug ?? existing.slug;
      const parentId = parentChanged ? dto.parentId : (existing.parentId ?? undefined);
      // Sikl himoyasi: yangi ota o'zining avlodi bo'la olmaydi.
      const computed = await this.computePath(slug, parentId);
      if (parentId !== undefined && computed.path.startsWith(existing.path)) {
        throw new BusinessRuleError(
          'INVALID_STATE_TRANSITION',
          "Kategoriyani o'z avlodiga ko'chirib bo'lmaydi",
        );
      }
      newPath = computed.path;
      newDepth = computed.depth;
    }

    const updated = await this.repo.transaction(async (tx) => {
      const node = await this.repo.update(
        id,
        {
          ...(dto.slug !== undefined && { slug: dto.slug }),
          ...(dto.name !== undefined && { name: toJson(dto.name) }),
          ...(dto.description !== undefined && { description: toJson(dto.description) }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.metaTitle !== undefined && { metaTitle: toJson(dto.metaTitle) }),
          ...(dto.metaDescription !== undefined && {
            metaDescription: toJson(dto.metaDescription),
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(parentChanged && {
            parent:
              dto.parentId === undefined ? { disconnect: true } : { connect: { id: dto.parentId } },
          }),
          ...((slugChanged || parentChanged) && { path: newPath, depth: newDepth }),
        },
        tx,
      );

      // Avlodlar path'ini prefiksni almashtirib yangilaymiz.
      if ((slugChanged || parentChanged) && existing.path !== newPath) {
        const descendants = await tx.category.findMany({
          where: { path: { startsWith: existing.path }, NOT: { id }, deletedAt: null },
        });
        for (const d of descendants) {
          const suffix = d.path.slice(existing.path.length);
          await tx.category.update({
            where: { id: d.id },
            data: { path: `${newPath}${suffix}`, depth: newDepth + (d.depth - existing.depth) },
          });
        }
      }
      return node;
    });

    await this.audit.record({
      action: 'CATEGORY_UPDATE',
      resourceType: 'Category',
      resourceId: id,
      before: { slug: existing.slug, path: existing.path },
      after: { slug: updated.slug, path: updated.path },
    });
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Kategoriya', id);
    }
    if ((await this.repo.countChildren(id)) > 0) {
      throw new ConflictError("Ichki kategoriyalari bor — avval ularni ko'chiring/o'chiring");
    }
    if ((await this.repo.countProducts(id)) > 0) {
      throw new ConflictError('Kategoriyada mahsulotlar bor');
    }
    await this.repo.update(id, { deletedAt: new Date() });
    await this.audit.record({
      action: 'CATEGORY_DELETE',
      resourceType: 'Category',
      resourceId: id,
      before: { slug: existing.slug },
    });
  }

  async getBySlug(slug: string): Promise<CategoryRow> {
    const category = await this.repo.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Kategoriya');
    }
    return category;
  }

  /** Yassi ro'yxatdan daraxt quradi. */
  async getTree(onlyActive: boolean): Promise<CategoryNode[]> {
    const all = await this.repo.findAll(onlyActive);
    const byId = new Map<string, CategoryNode>();
    for (const c of all) {
      byId.set(c.id, { ...c, children: [] });
    }
    const roots: CategoryNode[] = [];
    for (const node of byId.values()) {
      const parent = node.parentId !== null ? byId.get(node.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
