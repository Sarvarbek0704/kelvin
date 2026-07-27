import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';

export type MediaRow = Prisma.MediaGetPayload<Record<string, never>>;

/** Media — Prisma qatlami. docs/05 §1.5 */
@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MediaRow | null> {
    return this.prisma.media.findUnique({ where: { id } });
  }

  listForProduct(productId: string): Promise<MediaRow[]> {
    return this.prisma.media.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  listForVariant(variantId: string): Promise<MediaRow[]> {
    return this.prisma.media.findMany({
      where: { variantId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  create(data: Prisma.MediaCreateInput): Promise<MediaRow> {
    return this.prisma.media.create({ data });
  }

  update(id: string, data: Prisma.MediaUpdateInput): Promise<MediaRow> {
    return this.prisma.media.update({ where: { id }, data });
  }

  delete(id: string): Promise<MediaRow> {
    return this.prisma.media.delete({ where: { id } });
  }

  /** Bitta media'ni primary qilib, qolganlarini o'chiradi (bir egalik doirasida). */
  async setPrimary(id: string, scope: { productId?: string; variantId?: string }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.media.updateMany({
        where: {
          ...(scope.productId !== undefined && { productId: scope.productId }),
          ...(scope.variantId !== undefined && { variantId: scope.variantId }),
        },
        data: { isPrimary: false },
      }),
      this.prisma.media.update({ where: { id }, data: { isPrimary: true } }),
    ]);
  }
}
