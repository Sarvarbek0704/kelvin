import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { Worker } from 'bullmq';

import { AppModule } from './app.module';
import { type AppConfig } from './config/configuration';
import { OutboxRelayService, type OutboxJobData } from './shared/outbox/outbox-relay.service';
import { OUTBOX_QUEUE_NAME } from './shared/outbox/outbox.constants';
import { MediaProcessingService } from './modules/catalog/media/media-processing.service';
import { SearchIndexerService } from './modules/catalog/product/search-indexer.service';
import { OrderService } from './modules/order/order.service';

/**
 * Background worker — alohida process.
 *
 * Faza 0 da ishlaydigan ish:
 *   1. Outbox relay — PENDING event'larni BullMQ'ga publish qiladi (poll).
 *   2. Outbox consumer — BullMQ'dan olib, event tipiga qarab dispatch qiladi.
 *      (Faza 0 da consumer faqat ACK/log qiladi; haqiqiy handler'lar keyingi
 *      fazalarda: search.reindex (Faza 2), reservation.releaseExpired (Faza 3)...)
 *
 * ⚠️ HAR JOB IDEMPOTENT BO'LISHI SHART — at-least-once (ADR-0004).
 *
 * @see docs/02-architecture.md §7
 */
const RELAY_INTERVAL_MS = 500;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  const config = app.get(ConfigService<AppConfig, true>);
  const redis = config.get('redis', { infer: true });
  const relay = app.get(OutboxRelayService);
  const mediaProcessing = app.get(MediaProcessingService);
  const searchIndexer = app.get(SearchIndexerService);
  const orderService = app.get(OrderService);

  // --- 1. Outbox relay poller ------------------------------------------------
  let running = true;
  const poll = async (): Promise<void> => {
    while (running) {
      try {
        const published = await relay.processBatch();
        // Ish bo'lsa darhol yana, bo'lmasa biroz kutamiz.
        if (published === 0) {
          await sleep(RELAY_INTERVAL_MS);
        }
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err), 'OutboxRelay');
        await sleep(RELAY_INTERVAL_MS);
      }
    }
  };

  // --- 2. Outbox consumer ----------------------------------------------------
  const consumer = new Worker<OutboxJobData>(
    OUTBOX_QUEUE_NAME,
    async (job) => {
      logger.log(`Outbox event: ${job.data.eventType} (${job.data.aggregateId})`);
      // Event tipiga qarab dispatch (idempotent handler'lar).
      switch (job.data.eventType) {
        case 'MediaUploaded':
          await mediaProcessing.process(job.data.aggregateId);
          break;
        case 'ProductPublished':
        case 'ProductVariantsGenerated':
        case 'ProductUpdated':
          // Meilisearch reindex (ACTIVE bo'lmasa indeksdan olib tashlanadi).
          await searchIndexer.indexProduct(job.data.aggregateId);
          break;
        case 'PaymentSucceeded':
          // ⚠️ Order sagasi (durability): IDEMPOTENT — allaqachon CONFIRMED bo'lsa no-op.
          //    Sinxron fast-path'ga qo'shimcha (process yiqilsa relay qayta uradi).
          await orderService.onPaymentSucceeded(job.data.aggregateId);
          break;
        default:
          break;
      }
    },
    {
      connection: {
        host: redis.host,
        port: redis.port,
        db: redis.db,
        ...(redis.password !== undefined && { password: redis.password }),
      },
    },
  );

  const shutdown = async (): Promise<void> => {
    running = false;
    await consumer.close();
    await app.close();
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  logger.log('Kelvin worker ishga tushdi — outbox relay + consumer faol');
  void poll();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void bootstrap();
