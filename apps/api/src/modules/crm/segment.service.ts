import { Inject, Injectable } from '@nestjs/common';
import { type LocalizedText } from '@kelvin/contracts';

import { computeRfm } from '../../core/crm/rfm';
import { toJson } from '../../shared/json';
import { CUSTOMER_PORT, type ContactInfo, type CustomerPort } from '../customer/customer.port';
import { ORDER_PORT, type OrderPort } from '../order/order.port';
import { SegmentRepository, type MemberRow, type SegmentRow } from './segment.repository';

/** Segment a'zosi + mijoz aloqa ma'lumoti (admin ro'yxati uchun). */
export interface MemberView extends MemberRow {
  readonly contact: ContactInfo | null;
}

const RFM_SEGMENT_CODE = 'rfm-auto';
const DAY_MS = 86_400_000;

/**
 * crm segment — mijoz segmentatsiya (docs/10 §9.1, §9.3). Qo'lda segment + ⚠️ RFM
 * AVTO qayta hisoblash (ORDER_PORT agregatidan, sikl yo'q; core/crm/rfm SOF).
 */
@Injectable()
export class SegmentService {
  constructor(
    private readonly repo: SegmentRepository,
    @Inject(ORDER_PORT) private readonly orders: OrderPort,
    @Inject(CUSTOMER_PORT) private readonly customers: CustomerPort,
  ) {}

  createSegment(input: { code: string; name: LocalizedText; description?: string }): Promise<SegmentRow> {
    return this.repo.createSegment({
      code: input.code,
      name: toJson(input.name),
      kind: 'MANUAL',
      ...(input.description !== undefined && { description: input.description }),
    });
  }

  listSegments(): Promise<SegmentRow[]> {
    return this.repo.listSegments();
  }

  /**
   * A'zolar + aloqa ma'lumoti (ism/telefon/email). Mijoz CUSTOMER_PORT orqali
   * o'qiladi (jadvalga to'g'ridan-to'g'ri kirilmaydi — modul chegarasi).
   */
  async listMembers(segmentId: string): Promise<MemberView[]> {
    const members = await this.repo.listMembers(segmentId);
    return await Promise.all(
      members.map(async (m) => ({
        ...m,
        contact: await this.customers.getContactInfo(m.customerId),
      })),
    );
  }

  addMember(segmentId: string, customerId: string): Promise<MemberRow> {
    return this.repo.addMember(segmentId, customerId);
  }

  /**
   * ⚠️ RFM qayta hisoblash (docs/10 §9.3): to'langan+ buyurtmalardan har mijoz
   * uchun R/F/M skori → 'rfm-auto' segment a'zolari (skor bilan). Mazmunli
   * natija bir necha oy real ma'lumot bilan; mexanizm har qanday holatda ishlaydi.
   */
  async recomputeRfm(): Promise<{ segmentId: string; memberCount: number }> {
    const aggs = await this.orders.customerAggregates();
    const now = Date.now();
    const inputs = aggs.map((a) => ({
      customerId: a.customerId,
      recencyDays: a.lastOrderAt !== null ? Math.floor((now - a.lastOrderAt.getTime()) / DAY_MS) : 9999,
      frequency: a.orderCount,
      monetary: a.totalSpent,
    }));
    const scores = computeRfm(inputs);
    const segmentId = await this.repo.upsertRfmSegment(RFM_SEGMENT_CODE, toJson({ 'uz-Latn': 'RFM (avto)', ru: 'RFM (авто)' }));
    await this.repo.replaceMembers(segmentId, scores.map((s) => ({ customerId: s.customerId, rfmScore: s.score })));
    return { segmentId, memberCount: scores.length };
  }
}
