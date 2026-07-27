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

const NOT_READY = 'Not implemented: verify Uzum official docs first (Q-11)';

/**
 * Uzum adapteri.
 *
 * ⚠️ HALI YOZILMAGAN — ATAYLAB (docs/08 §2.5, Ochiq savol Q-11: rasmiy hujjat
 * havolasi hali aniqlanmagan). Protokol, imzo va refund API tasdiqlanmaguncha
 * yozilmaydi.
 */
@Injectable()
export class UzumAdapter implements PaymentProvider {
  readonly code = 'uzum' as const;

  readonly capabilities: ProviderCapabilities = {
    confirmation: 'webhook',
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
