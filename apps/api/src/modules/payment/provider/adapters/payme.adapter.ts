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

const NOT_READY = 'Not implemented: verify developer.help.paycom.uz first';

/**
 * Payme adapteri.
 *
 * ⚠️ HALI YOZILMAGAN — ATAYLAB (docs/08 §2.5). Payme'da to'lov protokoli (Merchant
 * API — CheckPerformTransaction/CreateTransaction/PerformTransaction), imzo
 * (Basic auth / X-Auth) va xato kodlari rasmiy hujjatdan (https://developer.help.paycom.uz)
 * tasdiqlanmaguncha yozilmaydi. Taxminiy kod — production'da pul yo'qotadi.
 */
@Injectable()
export class PaymeAdapter implements PaymentProvider {
  readonly code = 'payme' as const;

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
    return Promise.reject(new Error(NOT_READY));
  }

  buildWebhookResponse(_result: 'accepted' | 'rejected', _error?: Error): unknown {
    throw new Error(NOT_READY);
  }
}
