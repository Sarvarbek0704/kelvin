import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { loadConfig, validateEnv } from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './shared/prisma/prisma.module';

/**
 * Ildiz modul.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  MODULAR MONOLITH — ADR-0001
 *
 *  Modul chegarasi niyat bilan emas, CI bilan saqlanadi:
 *    `pnpm arch:check` (.dependency-cruiser.js)
 *
 *  Qoidalar:
 *   - core/ sof TypeScript — NestJS ham, Prisma ham bilmaydi
 *   - Modul boshqa modulning service'iga to'g'ridan-to'g'ri murojaat qilmaydi,
 *     faqat *.port.ts orqali
 *   - Modul boshqa modulning jadvaliga so'rov yubormaydi
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @see docs/02-architecture.md §5
 */
@Module({
  imports: [
    // --- Konfiguratsiya ---------------------------------------------------
    // Noto'g'ri env bilan ilova ISHGA TUSHMAYDI — xato erta chiqsin.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [loadConfig],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),

    // --- Correlation ID ---------------------------------------------------
    // Har so'rovga ID beriladi va har logda ko'rinadi.
    // Foydalanuvchi traceId aytadi → biz log'dan butun so'rovni topamiz.
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: { headers: Record<string, unknown> }): string =>
          (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
      },
    }),

    // --- Logging (docs/15-observability.md §2) ----------------------------
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // Dev'da o'qish uchun chiroyli format; prod'da JSON (mashina o'qiydi).
        // (`exactOptionalPropertyTypes` sababli shartli spread — `undefined`
        //  ni ochiq uzatib bo'lmaydi.)
        ...(process.env.NODE_ENV === 'development'
          ? {
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },
            }
          : {}),
        // ⚠️  Sir hech qachon loglanmaydi. docs/10-security.md §8
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.passwordHash',
            'req.body.totpSecret',
            'req.body.refreshToken',
            'res.headers["set-cookie"]',
          ],
          censor: '[REDACTED]',
        },
        autoLogging: {
          ignore: (req): boolean => (req.url ?? '').startsWith('/health'),
        },
      },
    }),

    // --- Rate limiting (docs/04-api-spec.md §6) ---------------------------
    // TODO(Faza 0): Redis storage qo'shish — hozircha in-memory,
    //               ya'ni ko'p instance'da limit har instance uchun alohida.
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 300 },
      { name: 'strict', ttl: 900_000, limit: 5 },
    ]),

    EventEmitterModule.forRoot({ global: true, verboseMemoryLeak: true }),
    ScheduleModule.forRoot(),

    // --- Umumiy infratuzilma ----------------------------------------------
    PrismaModule,

    // --- Funksional modullar ----------------------------------------------
    HealthModule,

    // TODO(Faza 0): IdentityModule     — auth, RBAC, sessiya, token rotatsiya
    // TODO(Faza 0): AdminModule        — audit log, feature flag
    //
    // TODO(Faza 1): CatalogModule      — mahsulot, variant, atribut, media
    // TODO(Faza 1): ContentModule      — blog, statik sahifa, banner
    //
    // TODO(Faza 2): SearchModule       — Meilisearch, faceted search
    //
    // TODO(Faza 3): CartModule         — savat, mehmon savati, birlashtirish
    // TODO(Faza 3): PricingModule      — narx, chegirma, aksiya, bundle
    // TODO(Faza 3): OrderModule        — checkout, holat mashinasi, saga
    // TODO(Faza 3): InventoryModule    — qoldiq, rezerv  ← ENG NOZIK (oversell)
    //
    // TODO(Faza 4): PaymentModule      — Click/Payme/Uzum, ledger, refund
    // TODO(Faza 5): InstallmentModule  — rassrochka  ← yuridik bloker
    //
    // TODO(Faza 6): ProcurementModule  — ta'minotchi, xarid buyurtmasi
    // TODO(Faza 7): DeliveryModule     — zona, slot, kuryer, o'rnatish
    // TODO(Faza 8): PosModule          — offline kassa, smena
    // TODO(Faza 9): CrmModule          — mijoz, lid, voronka, RFM
    // TODO(Faza 9): AnalyticsModule    — hisobot, ABC tahlil
    //
    // TODO: ReviewModule, NotificationModule
    //
    // To'liq reja: docs/15-roadmap.md
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
