import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { type Queue } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import {
  OUTBOX_BACKOFF_SECONDS,
  OUTBOX_MAX_ATTEMPTS,
  OUTBOX_QUEUE,
  OUTBOX_VISIBILITY_SECONDS,
} from './outbox.constants';

interface ClaimedEvent {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Prisma.JsonValue;
  attempts: number;
}

export interface OutboxJobData {
  readonly outboxId: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: Prisma.JsonValue;
}

/**
 * Transactional outbox — O'QISH/PUBLISH tomoni (relay).
 *
 * PENDING event'larni atomik `FOR UPDATE SKIP LOCKED` bilan oladi (bir necha
 * relay parallel ishlasa ham bir event ikki marta olinmaydi), BullMQ'ga
 * publish qiladi, PUBLISHED deb belgilaydi.
 *
 * Kafolat: AT-LEAST-ONCE. Worker publish'dan keyin, PUBLISHED belgilashdan
 * oldin yiqilsa — event PROCESSING'da qoladi va visibility muddatidan keyin
 * qayta olinadi. → HAR consumer IDEMPOTENT bo'lishi SHART (jobId = outboxId).
 *
 * @see docs/adr/0004-transactional-outbox.md
 */
@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_QUEUE) private readonly queue: Queue<OutboxJobData>,
  ) {}

  /** Bir partiyani ishlaydi. Qaytaradi: publish qilingan eventlar soni. */
  async processBatch(limit = 50): Promise<number> {
    const claimed = await this.claim(limit);
    let published = 0;

    for (const event of claimed) {
      try {
        await this.queue.add(
          event.event_type,
          {
            outboxId: event.id,
            eventType: event.event_type,
            aggregateType: event.aggregate_type,
            aggregateId: event.aggregate_id,
            payload: event.payload,
          },
          // jobId = outboxId → bir event uchun bitta job (dedupe).
          { jobId: event.id, removeOnComplete: 1000, removeOnFail: 5000 },
        );
        await this.markPublished(event.id);
        published += 1;
      } catch (err) {
        await this.markRetry(event, err);
      }
    }

    return published;
  }

  /**
   * Atomik claim: PENDING yoki visibility muddati o'tgan PROCESSING eventlar.
   * `FOR UPDATE SKIP LOCKED` — parallel relaylar bir-birini bloklamaydi.
   */
  private async claim(limit: number): Promise<ClaimedEvent[]> {
    return await this.prisma.$queryRaw<ClaimedEvent[]>(Prisma.sql`
      UPDATE outbox_events
         SET status = 'PROCESSING',
             attempts = attempts + 1,
             available_at = now() + (${OUTBOX_VISIBILITY_SECONDS} * interval '1 second')
       WHERE id IN (
         SELECT id FROM outbox_events
          WHERE status IN ('PENDING', 'PROCESSING')
            AND available_at <= now()
          ORDER BY available_at
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
       )
      RETURNING id, event_type, aggregate_type, aggregate_id, payload, attempts
    `);
  }

  private async markPublished(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  private async markRetry(event: ClaimedEvent, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);
    const exhausted = event.attempts >= OUTBOX_MAX_ATTEMPTS;
    this.logger.warn(
      `Outbox publish xato (${event.id}, urinish ${String(event.attempts)}): ${message}`,
    );
    await this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: exhausted ? 'FAILED' : 'PENDING',
        lastError: message.slice(0, 1000),
        availableAt: new Date(Date.now() + OUTBOX_BACKOFF_SECONDS * 1000),
      },
    });
  }
}
