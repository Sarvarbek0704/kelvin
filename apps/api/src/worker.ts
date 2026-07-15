import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

/**
 * Background worker — alohida process.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  SKELET. Job'lar hali implementatsiya qilinmagan.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Nega API'dan ALOHIDA process:
 *
 *  1. `media.processImage` — 1000 mahsulot × 5 rasm resize/webp. CPU og'ir.
 *     API bilan bir processda bo'lsa, HTTP javob vaqti buziladi.
 *
 *  2. `report.export` — katta ma'lumot bo'yicha Excel/PDF. Sekin.
 *
 *  3. `reservation.releaseExpired` — har daqiqa ishlaydigan cron.
 *     Muddati tugagan rezervlarni bo'shatadi. Bu ishlamasa — tovar
 *     bekorga bloklanadi va sotilmaydi.
 *
 *  4. Mustaqil masshtablash: aksiya kunida worker'lar ko'paytiriladi.
 *
 * Rejalashtirilgan job'lar (docs/02-architecture.md §7):
 *
 *   outbox.publish            — transactional outbox        (Faza 0)  ← ADR-0004
 *   media.processImage        — resize, webp, blur          (Faza 1)
 *   search.reindexVariant     — Meilisearch sinxronizatsiya (Faza 2)
 *   reservation.releaseExpired — TTL tugagan rezerv          (Faza 3)  ← kritik
 *   cart.abandonedReminder    — tashlab ketilgan savat       (Faza 3)
 *   payment.reconcile         — provayder hisoboti solishtirish (Faza 4)
 *   installment.dueReminder   — rassrochka eslatmasi (SMS)   (Faza 5)
 *   installment.markOverdue   — kechikkan to'lov             (Faza 5)
 *   notification.send         — SMS (Eskiz) / Telegram       (Faza 3)
 *   report.export             — Excel / PDF                  (Faza 9)
 *   analytics.computeRfm      — mijoz segmentatsiyasi        (Faza 9)
 *
 * ⚠️  HAR JOB IDEMPOTENT BO'LISHI SHART. BullMQ retry qiladi, tarmoq
 *     uziladi, worker yiqiladi. Ikki marta bajarilgan job natijani
 *     buzmasligi kerak — ayniqsa `payment.*` va `reservation.*`.
 *     Bu talab, tavsiya emas. docs/adr/0004-transactional-outbox.md
 */
async function bootstrap(): Promise<void> {
  // HTTP server yo'q — bu faqat worker.
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // BullMQ job'lar tugashi uchun graceful shutdown majburiy.
  app.enableShutdownHooks();

  logger.log('Kelvin worker ishga tushdi — hozircha job registratsiya qilinmagan');
}

void bootstrap();
