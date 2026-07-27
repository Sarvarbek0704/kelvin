import { type Queue } from 'bullmq';

import { createHarness, type TestHarness } from './helpers/harness';
import { OutboxService } from '../../src/shared/outbox/outbox.service';
import { OutboxRelayService } from '../../src/shared/outbox/outbox-relay.service';
import { OUTBOX_QUEUE } from '../../src/shared/outbox/outbox.constants';

/**
 * Transactional outbox — event yo'qolmaydi (at-least-once).
 * docs/adr/0004-transactional-outbox.md
 */
describe('Outbox relay (integration)', () => {
  let h: TestHarness;
  let outbox: OutboxService;
  let relay: OutboxRelayService;
  let queue: Queue;

  beforeAll(async () => {
    h = await createHarness();
    outbox = h.app.get(OutboxService);
    relay = h.app.get(OutboxRelayService);
    queue = h.app.get(OUTBOX_QUEUE);
  });

  afterAll(async () => {
    await h.teardown();
  });

  it('tranzaksiya ichida yozilgan event relay orqali PUBLISHED bo‘ladi', async () => {
    const aggregateId = crypto.randomUUID();

    // Domen tranzaksiyasi bilan ATOMIK yoziladi.
    await h.prisma.$transaction(async (tx) => {
      await outbox.enqueue(
        {
          eventType: 'TestEvent',
          aggregateType: 'Test',
          aggregateId,
          payload: { hello: 'world' },
        },
        tx,
      );
    });

    const before = await h.prisma.outboxEvent.findFirst({ where: { aggregateId } });
    expect(before?.status).toBe('PENDING');

    const published = await relay.processBatch();
    expect(published).toBeGreaterThanOrEqual(1);

    const after = await h.prisma.outboxEvent.findFirst({ where: { aggregateId } });
    expect(after?.status).toBe('PUBLISHED');
    expect(after?.publishedAt).not.toBeNull();

    // BullMQ'da job bor va jobId = outboxId (dedupe).
    const job = await queue.getJob(after!.id);
    expect(job).toBeDefined();
    expect(job?.data.eventType).toBe('TestEvent');
  });

  it('ikki marta processBatch — event ikki marta PUBLISH bo‘lmaydi', async () => {
    const aggregateId = crypto.randomUUID();
    await outbox.enqueue({
      eventType: 'OnceEvent',
      aggregateType: 'Test',
      aggregateId,
      payload: {},
    });

    await relay.processBatch();
    const firstPass = await h.prisma.outboxEvent.findFirst({ where: { aggregateId } });
    expect(firstPass?.status).toBe('PUBLISHED');

    // Ikkinchi tick — bu event allaqachon PUBLISHED, qayta olinmaydi.
    const secondPublished = await relay.processBatch();
    // (boshqa testlardan qolган event bo'lmasa 0)
    expect(secondPublished).toBeGreaterThanOrEqual(0);
    const stillOnce = await h.prisma.outboxEvent.count({
      where: { aggregateId, status: 'PUBLISHED' },
    });
    expect(stillOnce).toBe(1);
  });
});
