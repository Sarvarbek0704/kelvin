import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { loadConfig, validateEnv } from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { SearchModule } from './modules/search/search.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ShipmentModule } from './modules/shipment/shipment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ContentModule } from './modules/content/content.module';
import { CrmModule } from './modules/crm/crm.module';
import { ReviewModule } from './modules/review/review.module';
import { InstallmentModule } from './modules/installment/installment.module';
import { PosModule } from './modules/pos/pos.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SeoModule } from './modules/seo/seo.module';
import { MeiliModule } from './shared/search/meili.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { AuditModule } from './shared/audit/audit.module';
import { OutboxModule } from './shared/outbox/outbox.module';
import { StorageModule } from './shared/storage/storage.module';
import { ProblemDetailsFilter } from './shared/http/problem-details.filter';

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

    // --- Rate limiting (docs/04-api-spec.md §8) ---------------------------
    // ⚠️ Faqat GLOBAL 'default' (300/min). Qattiq limitlar (login/OTP 5/min,
    //    webhook 300/min...) ENDPOINT darajasida @Throttle bilan beriladi —
    //    docs/04 §8. Global 'strict' qo'yilsa, u BARCHA route'ga qo'llanib,
    //    real mijozni ham bloklaydi.
    // TODO: Redis storage (ko'p instance uchun) — docs/04 §8.4.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
      // Testlar bir IP'dan tez ko'p so'rov yuboradi — izolyatsiya uchun skip.
      skipIf: () => process.env.NODE_ENV === 'test',
    }),

    EventEmitterModule.forRoot({ global: true, verboseMemoryLeak: true }),
    ScheduleModule.forRoot(),

    // --- Umumiy infratuzilma ----------------------------------------------
    PrismaModule,
    RedisModule,
    AuditModule,
    OutboxModule,
    StorageModule,
    MeiliModule,

    // --- Funksional modullar ----------------------------------------------
    HealthModule,
    IdentityModule, // auth, RBAC, sessiya, token rotatsiya (Faza 0)
    CatalogModule, // mahsulot, variant, atribut, kategoriya (Faza 1)
    SearchModule, // faceted qidiruv — Meilisearch (Faza 2)
    InventoryModule, // qoldiq, rezerv — ENG NOZIK (oversell himoyasi) (Faza 3)
    PricingModule, // narx dvigateli, chegirma — determinizm majburiy (Faza 3)
    CartModule, // savat, mehmon savati, birlashtirish union+max (Faza 3)
    OrderModule, // checkout saga, holat mashinasi — kompensatsiya (Faza 3)
    PaymentModule, // to'lov, double-entry ledger, idempotentlik (Faza 4)
    ProcurementModule, // ta'minot: Supplier, PurchaseOrder, qabul (Faza 6)
    DeliveryModule, // yetkazish zona/narx/slot bron — atomik (Faza 7)
    CustomerModule, // mijoz manzillari (shipment/checkout uchun)
    ShipmentModule, // jo'natma: slot bron + holat mashinasi (Faza 7)
    NotificationModule, // SMS/Telegram xabar (Faza 3.15 — LogAdapter)
    ContentModule, // blog maqolalari + statik sahifalar (docs/13)
    CrmModule, // lid boshqaruvi — callback → voronka (docs/10)
    ReviewModule, // mahsulot sharhlari — moderatsiya (docs/10)
    InstallmentModule, // rassrochka qo'lda rejim — grafik + ledger (docs/08 §7, Faza 5)
    PosModule, // offline kassa — smena + sotuv (docs/15 §10, Faza 8, fiskalsiz)
    AnalyticsModule, // hisobotlar — ABC + sotuv xulosasi (docs/10 §9.6-9.7)
    SeoModule, // sitemap.xml + robots.txt (docs/13 §6, Faza 10)

    // TODO(Faza 0): AdminModule        — audit log ekrani, feature flag
    //
    // TODO(Faza 1): ContentModule      — blog, statik sahifa, banner
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
    // Rate limiting eng oldin (auth'dan ham oldin).
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Barcha xatolar RFC 9457 (Problem Details) formatida.
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
  ],
})
export class AppModule {}
