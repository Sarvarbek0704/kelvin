import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PaymentExpiryService } from './payment-expiry.service';
import { PAYMENT_PROVIDERS } from './provider/provider.port';
import { PaymentProviderRegistry } from './provider/provider.registry';
import { CashAdapter } from './provider/adapters/cash.adapter';
import { ClickAdapter } from './provider/adapters/click.adapter';
import { PaymeAdapter } from './provider/adapters/payme.adapter';
import { UzumAdapter } from './provider/adapters/uzum.adapter';

/**
 * payment — to'lov, double-entry ledger, idempotentlik (docs/02 §5, docs/08).
 *
 * ⚠️ Uch himoya: amount tekshiruvi + idempotentlik (CAS) + muvozanatli ledger.
 *    To'lov o'tgach ORDER_PORT.onPaymentSucceeded order sagasini ishga tushiradi.
 *
 * PROVAYDER ABSTRAKSIYASI (§2): registry + adapterlar. Naqd — TO'LIQ (tashqi
 * API'siz). Click/Payme/Uzum — halol SKELET (rasmiy hujjat tasdiqlanmaguncha,
 * §2.5). Yangi provayder = adapter + PAYMENT_PROVIDERS massiviga bitta qator.
 */
@Module({
  imports: [OrderModule],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentRepository,
    PaymentService,
    PaymentExpiryService,
    PaymentProviderRegistry,
    CashAdapter,
    ClickAdapter,
    PaymeAdapter,
    UzumAdapter,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (cash: CashAdapter, click: ClickAdapter, payme: PaymeAdapter, uzum: UzumAdapter) => [
        cash,
        click,
        payme,
        uzum,
      ],
      inject: [CashAdapter, ClickAdapter, PaymeAdapter, UzumAdapter],
    },
  ],
  exports: [PaymentService, PaymentProviderRegistry],
})
export class PaymentModule {}
