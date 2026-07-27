import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface OutboxEventInput {
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: Prisma.InputJsonValue;
}

type DbClient = PrismaService | Prisma.TransactionClient;

/**
 * Transactional outbox — YOZISH tomoni.
 *
 * ⚠️ Kritik event (to'lov, buyurtma, qoldiq) DB tranzaksiyasi ICHIDA shu
 *    jadvalga yoziladi. Alohida relay publish qiladi. Bu "dual write"
 *    muammosini yechadi: event DB commit bilan atomik.
 *
 *    await prisma.$transaction(async (tx) => {
 *      await tx.payment.update(...);
 *      await outbox.enqueue({ ... }, tx);   // ← bir tranzaksiyada
 *    });
 *
 * @see docs/02-architecture.md §6.2
 * @see docs/adr/0004-transactional-outbox.md
 */
@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(event: OutboxEventInput, client?: DbClient): Promise<void> {
    const db = client ?? this.prisma;
    await db.outboxEvent.create({
      data: {
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
      },
    });
  }
}
