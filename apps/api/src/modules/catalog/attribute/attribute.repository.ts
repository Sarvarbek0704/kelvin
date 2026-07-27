import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';

export type AttributeWithValues = Prisma.AttributeGetPayload<{ include: { values: true } }>;

/** Atribut — Prisma qatlami. docs/05-catalog-and-search.md §1.4, §2.1 */
@Injectable()
export class AttributeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<AttributeWithValues[]> {
    return this.prisma.attribute.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  findByCode(code: string): Promise<AttributeWithValues | null> {
    return this.prisma.attribute.findUnique({
      where: { code },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  findById(id: string): Promise<AttributeWithValues | null> {
    return this.prisma.attribute.findUnique({
      where: { id },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  create(data: Prisma.AttributeCreateInput): Promise<AttributeWithValues> {
    return this.prisma.attribute.create({ data, include: { values: true } });
  }

  update(id: string, data: Prisma.AttributeUpdateInput): Promise<AttributeWithValues> {
    return this.prisma.attribute.update({ where: { id }, data, include: { values: true } });
  }

  createValue(
    data: Prisma.AttributeValueCreateInput,
  ): Promise<Prisma.AttributeValueGetPayload<Record<string, never>>> {
    return this.prisma.attributeValue.create({ data });
  }

  findValue(id: string): Promise<Prisma.AttributeValueGetPayload<Record<string, never>> | null> {
    return this.prisma.attributeValue.findUnique({ where: { id } });
  }

  updateValue(
    id: string,
    data: Prisma.AttributeValueUpdateInput,
  ): Promise<Prisma.AttributeValueGetPayload<Record<string, never>>> {
    return this.prisma.attributeValue.update({ where: { id }, data });
  }
}
