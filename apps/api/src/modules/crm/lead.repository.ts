import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';

export type LeadRow = Prisma.LeadGetPayload<Record<string, never>>;
export type LeadStatus = LeadRow['status'];

export interface CreateLeadData {
  name?: string;
  phone: string;
  source: string;
  note?: string;
}

export interface UpdateLeadData {
  status?: LeadStatus;
  note?: string;
  assignedTo?: string;
  estimatedAmount?: bigint;
  lostReason?: string;
}

/** crm — lid (docs/10). Prisma faqat shu qatlamda. */
@Injectable()
export class LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLeadData): Promise<LeadRow> {
    return this.prisma.lead.create({
      data: {
        phone: data.phone,
        source: data.source,
        status: 'NEW',
        ...(data.name !== undefined && { name: data.name }),
        ...(data.note !== undefined && { note: data.note }),
      },
    });
  }

  findById(id: string): Promise<LeadRow | null> {
    return this.prisma.lead.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateLeadData): Promise<LeadRow> {
    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.estimatedAmount !== undefined && { estimatedAmount: data.estimatedAmount }),
        ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
      },
    });
  }

  /** Admin ro'yxati — cursor + status filtri (⚠️ uuid7 → id desc = eng yangi). */
  async list(params: { status?: LeadStatus; cursor?: string; limit: number }): Promise<{ items: LeadRow[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.lead.findMany({
      where: { ...(params.status !== undefined && { status: params.status }) },
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }

  /** Voronka statistikasi — holat bo'yicha son (dashboard/CRM). */
  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
  }
}
