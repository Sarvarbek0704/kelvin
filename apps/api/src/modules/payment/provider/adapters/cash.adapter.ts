import { Injectable } from '@nestjs/common';

import {
  type CreateChargeInput,
  type CreateChargeResult,
  type NormalizedWebhookEvent,
  type PaymentProvider,
  type ProviderCapabilities,
  type ProviderPaymentState,
  type ProviderRefundInput,
  type ProviderRefundResult,
} from '../provider.port';

/**
 * Naqd adapteri (docs/08 §2.6) — tashqi API'siz, HOZIR ham to'liq yozilishi
 * mumkin (noma'lum narsa yo'q). ⚠️ Bu adapter port abstraksiyasi HAQIQATAN
 * provayderdan mustaqilligini ISBOTLAYDI: agar interfeys faqat Click'ga
 * moslashtirilgan bo'lsa, naqd unga sig'masdi.
 *
 * Naqdda "paid" momenti boshqa: kuryer/kassir pulni olganda `capture` QO'LDA
 * chaqiriladi (§4.4) — webhook yo'q.
 */
@Injectable()
export class CashAdapter implements PaymentProvider {
  readonly code = 'cash' as const;

  readonly capabilities: ProviderCapabilities = {
    confirmation: 'manual', // kuryer/kassir tasdiqlaydi (§1.4)
    supportsPartialRefund: true, // kassadan qisman qaytarish — jismonan mumkin
    supportsApiRefund: false, // API yo'q: pul qo'ldan beriladi
    supportsSettlementReport: false,
    invoiceTtlSeconds: null, // naqd "muddati o'tmaydi"
  };

  createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    // Tashqi chaqiruv yo'q. To'lov PENDING qoladi; kuryer pulni olganda capture.
    return Promise.resolve({
      providerTransactionId: `cash:${input.paymentId}`, // unique constraint bajarilsin
      redirectUrl: null,
      expiresAt: null,
      raw: { mode: 'manual' },
    });
  }

  getState(_providerTransactionId: string): Promise<ProviderPaymentState> {
    // Naqdda tashqi haqiqat manbai yo'q — Kelvin ledger'i O'ZI manba.
    return Promise.resolve({
      status: 'unknown',
      providerTransactionId: null,
      paidAmount: null,
      paidAt: null,
      raw: null,
    });
  }

  refund(_input: ProviderRefundInput): Promise<ProviderRefundResult> {
    // Pul jismonan qaytariladi; tizim faqat faktni qayd etadi.
    return Promise.resolve({ providerRefundId: null, status: 'pending', raw: { mode: 'manual' } });
  }

  parseWebhook(): Promise<NormalizedWebhookEvent> {
    return Promise.reject(new Error('Cash provider has no webhooks'));
  }

  buildWebhookResponse(): unknown {
    throw new Error('Cash provider has no webhooks');
  }
}
