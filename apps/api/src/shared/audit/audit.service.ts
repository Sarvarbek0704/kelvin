import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { type Actor } from '@kelvin/contracts';

import { PrismaService } from '../prisma/prisma.service';
import { CLS_ACTOR, CLS_IP, CLS_USER_AGENT } from '../context/request-context';

/**
 * AuditLog — o'zgartirib bo'lmaydigan (immutable) jurnal.
 *
 * ⚠️ Faza 0 dan boshlab yoziladi — bu KESUVCHI qatlam (cross-cutting).
 *    Keyin qo'shilsa, 15 modulning har mutatsiyasini qayta ko'rish kerak.
 *    docs/15-roadmap.md §2.1
 *
 * Nima yoziladi: narx, chegirma, qoldiq tuzatishi, buyurtma bekor qilish,
 * rol berish, refund, POS smena, auth hodisalari.
 * Nega: ICHKI o'g'irlik (docs/11-security.md §1.6) va nizolar.
 *
 * DB darajasida immutability trigger bilan majburlanadi (migration).
 */
export interface AuditEntry {
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string | undefined;
  readonly before?: Prisma.InputJsonValue | undefined;
  readonly after?: Prisma.InputJsonValue | undefined;
  /** Aktor CLS'dan olinadi; bu yerda faqat override uchun (masalan, tizim). */
  readonly actorUserId?: string | undefined;
}

/** Tranzaksiya ichida yozish uchun — Prisma tx client yoki asosiy client. */
type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  /**
   * Audit yozuvi. Ixtiyoriy `client` — tranzaksiya ichida yozish uchun
   * (masalan, refresh reuse detection bir tranzaksiyada).
   */
  async record(entry: AuditEntry, client?: DbClient): Promise<void> {
    const db = client ?? this.prisma;
    const actor = this.cls.get<Actor | undefined>(CLS_ACTOR);
    const actorUserId = entry.actorUserId ?? actor?.userId;
    const ip = this.cls.get<string | undefined>(CLS_IP);
    const userAgent = this.cls.get<string | undefined>(CLS_USER_AGENT);
    const traceId = this.cls.getId();

    await db.auditLog.create({
      data: {
        action: entry.action,
        resourceType: entry.resourceType,
        ...(entry.resourceId !== undefined && { resourceId: entry.resourceId }),
        ...(entry.before !== undefined && { before: entry.before }),
        ...(entry.after !== undefined && { after: entry.after }),
        ...(actorUserId !== undefined && actorUserId !== '__guest__' && { actorUserId }),
        ...(ip !== undefined && { ipAddress: ip }),
        ...(userAgent !== undefined && { userAgent }),
        traceId,
      },
    });
  }
}
