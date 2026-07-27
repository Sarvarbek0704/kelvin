import { Injectable } from '@nestjs/common';

import { BusinessRuleError, NotFoundError } from '../../core/errors/domain.error';
import { LeadRepository, type LeadRow, type LeadStatus, type UpdateLeadData } from './lead.repository';

/** JSON javob — estimatedAmount TIYIN string (BigInt JSON'ga sig'maydi). */
export interface LeadView {
  readonly id: string;
  readonly name: string | null;
  readonly phone: string;
  readonly source: string;
  readonly status: string;
  readonly note: string | null;
  readonly assignedTo: string | null;
  readonly estimatedAmount: string | null;
  readonly lostReason: string | null;
  readonly createdAt: string;
}

export function toLeadView(l: LeadRow): LeadView {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    source: l.source,
    status: l.status,
    note: l.note,
    assignedTo: l.assignedTo,
    estimatedAmount: l.estimatedAmount === null ? null : l.estimatedAmount.toString(),
    lostReason: l.lostReason,
    createdAt: l.createdAt.toISOString(),
  };
}

const ALLOWED_SOURCES = ['WEBSITE_FORM', 'PHONE', 'TELEGRAM', 'WALK_IN', 'INSTAGRAM'];

/** crm — lid (docs/10). Ommaviy callback + xodim voronka boshqaruvi. */
@Injectable()
export class LeadService {
  constructor(private readonly repo: LeadRepository) {}

  /** Ommaviy callback so'rovi (storefront). Manba cheklangan ro'yxatdan. */
  async create(input: { name?: string; phone: string; source?: string; note?: string }): Promise<LeadRow> {
    const source = input.source ?? 'WEBSITE_FORM';
    if (!ALLOWED_SOURCES.includes(source)) {
      throw new BusinessRuleError('INVALID_SOURCE', 'Noma‘lum lid manbai');
    }
    return await this.repo.create({
      phone: input.phone,
      source,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.note !== undefined && { note: input.note }),
    });
  }

  list(params: { status?: LeadStatus; cursor?: string; limit?: number }): Promise<{ items: LeadRow[]; nextCursor: string | null }> {
    return this.repo.list({
      ...(params.status !== undefined && { status: params.status }),
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  async update(id: string, data: UpdateLeadData): Promise<LeadRow> {
    const lead = await this.repo.findById(id);
    if (lead === null) {
      throw new NotFoundError('Lid', id);
    }
    // LOST bo'lsa sabab MAJBURIY (voronka tahlili uchun).
    if (data.status === 'LOST' && (data.lostReason ?? lead.lostReason) === null) {
      throw new BusinessRuleError('LOST_REASON_REQUIRED', 'LOST uchun sabab kerak');
    }
    return await this.repo.update(id, data);
  }

  funnelStats(): Promise<Record<string, number>> {
    return this.repo.countByStatus();
  }
}
