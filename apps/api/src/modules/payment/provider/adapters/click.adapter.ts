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
  type RawWebhookRequest,
} from '../provider.port';

const NOT_READY = 'Not implemented: verify docs.click.uz first';

/**
 * Click adapteri.
 *
 * ⚠️ BU ADAPTER HALI YOZILMAGAN — ATAYLAB (docs/08 §2.5). Quyidagilar rasmiy
 * hujjatdan (https://docs.click.uz) tasdiqlanmaguncha bironta qator yozilmaydi:
 *   1. Endpoint URL va HTTP metod
 *   2. So'rov/javob parametrlari
 *   3. Imzo algoritmi va imzolanadigan qatorning ANIQ tuzilishi (§11.3)
 *   4. Xato kodlari semantikasi
 *   5. Ikki fazali (Prepare/Complete) oqim bormi
 *   6. Refund API bormi, qisman refund bormi
 *
 * Taxmin asosida yozilgan to'lov kodi — eng qimmat kod: ishlayotgandek ko'rinadi,
 * lekin production'da PUL YO'QOTADI. Skelet port'ga ulanadi, imzo tekshiruvida
 * `core/payment/webhook-security` (timing-safe + replay) ishlatiladi.
 */
@Injectable()
export class ClickAdapter implements PaymentProvider {
  readonly code = 'click' as const;

  readonly capabilities: ProviderCapabilities = {
    confirmation: 'webhook',
    // ⚠️ PLACEHOLDER — rasmiy hujjatdan tasdiqlanadi.
    supportsPartialRefund: false,
    supportsApiRefund: false,
    supportsSettlementReport: false,
    invoiceTtlSeconds: null,
  };

  createCharge(_input: CreateChargeInput): Promise<CreateChargeResult> {
    return Promise.reject(new Error(NOT_READY));
  }

  getState(_providerTransactionId: string): Promise<ProviderPaymentState> {
    return Promise.reject(new Error(NOT_READY));
  }

  refund(_input: ProviderRefundInput): Promise<ProviderRefundResult> {
    return Promise.reject(new Error(NOT_READY));
  }

  parseWebhook(_req: RawWebhookRequest): Promise<NormalizedWebhookEvent> {
    // Imzo RAW body ustidan, timing-safe compare + replay oynasi bilan (§11.3-11.4).
    return Promise.reject(new Error(NOT_READY));
  }

  buildWebhookResponse(_result: 'accepted' | 'rejected', _error?: Error): unknown {
    throw new Error(NOT_READY);
  }
}
