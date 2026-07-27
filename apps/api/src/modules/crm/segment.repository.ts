import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type JsonInput } from '../../shared/json';

export type SegmentRow = Prisma.CustomerSegmentGetPayload<{ include: { _count: { select: { members: true } } } }>;
export type MemberRow = Prisma.CustomerSegmentMemberGetPayload<Record<string, never>>;

/** crm segment — Prisma qatlami (docs/10 §9.1, §9.3). */
@Injectable()
export class SegmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  createSegment(data: { code: string; name: JsonInput; description?: string; kind?: string }): Promise<SegmentRow> {
    return this.prisma.customerSegment.create({
      data: { code: data.code, name: data.name, ...(data.description !== undefined && { description: data.description }), ...(data.kind !== undefined && { kind: data.kind }) },
      include: { _count: { select: { members: true } } },
    });
  }

  listSegments(): Promise<SegmentRow[]> {
    return this.prisma.customerSegment.findMany({ include: { _count: { select: { members: true } } }, orderBy: { code: 'asc' } });
  }

  findByCode(code: string): Promise<{ id: string } | null> {
    return this.prisma.customerSegment.findUnique({ where: { code }, select: { id: true } });
  }

  /** RFM segmentini upsert (kod bo'yicha). */
  async upsertRfmSegment(code: string, name: JsonInput): Promise<string> {
    const seg = await this.prisma.customerSegment.upsert({
      where: { code },
      create: { code, name, kind: 'RFM' },
      update: {},
      select: { id: true },
    });
    return seg.id;
  }

  /** ⚠️ RFM qayta hisoblash: eski a'zolarni tozalab, yangilarini qo'shish (bitta tx). */
  async replaceMembers(segmentId: string, members: { customerId: string; rfmScore: string }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.customerSegmentMember.deleteMany({ where: { segmentId } });
      if (members.length > 0) {
        await tx.customerSegmentMember.createMany({
          data: members.map((m) => ({ segmentId, customerId: m.customerId, rfmScore: m.rfmScore })),
        });
      }
    });
  }

  listMembers(segmentId: string): Promise<MemberRow[]> {
    return this.prisma.customerSegmentMember.findMany({ where: { segmentId }, orderBy: { createdAt: 'desc' }, take: 500 });
  }

  addMember(segmentId: string, customerId: string): Promise<MemberRow> {
    return this.prisma.customerSegmentMember.upsert({
      where: { segmentId_customerId: { segmentId, customerId } },
      create: { segmentId, customerId },
      update: {},
    });
  }
}
