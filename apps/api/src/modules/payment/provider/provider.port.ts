/**
 * To'lov provayderi PORTI (docs/08 §2.3). Domen provayderni BILMAYDI — faqat shu
 * interfeysni ko'radi. Har provayder (Click/Payme/Uzum/naqd) — alohida ADAPTER.
 *
 * ⚠️ Pul bu loyihada `bigint` tiyin (ADR-0003/0006) — doc'dagi `Money` klass
 *    o'rniga. Sxema/loyiha konvensiyasi g'olib.
 *
 * @see docs/08-payments-and-installments.md §2
 */

/** CANON §6: Click, Payme, Uzum + offline kanallar. Kichik harf (URL/kanal kodi). */
export type PaymentProviderCode = 'click' | 'payme' | 'uzum' | 'cash' | 'bank_transfer';

/**
 * Provayder qanday tasdiqlanadi.
 * - 'webhook': server-to-server xabar (Click, Payme, Uzum).
 * - 'manual':  inson tasdiqlaydi (naqd — kuryer; bank o'tkazmasi — buxgalter).
 */
export type ConfirmationMode = 'webhook' | 'manual';

export interface ProviderCapabilities {
  readonly confirmation: ConfirmationMode;
  readonly supportsPartialRefund: boolean;
  readonly supportsApiRefund: boolean;
  readonly supportsSettlementReport: boolean;
  /** Invoice/havola muddati (soniya). null — muddatsiz (naqd). */
  readonly invoiceTtlSeconds: number | null;
}

/** Kelvin → provayder: to'lov niyatini yarat. */
export interface CreateChargeInput {
  /** Kelvin tomonidagi yagona kalit (merchant order id) — provayderga uzatiladi. */
  readonly paymentId: string;
  readonly orderId: string;
  /** TIYIN. */
  readonly amount: bigint;
  readonly idempotencyKey: string;
  readonly returnUrl: string;
  readonly customerPhone: string | null;
  readonly description: string;
}

/** Provayder → Kelvin: niyat yaratildi. */
export interface CreateChargeResult {
  /** Provayderdagi ID (UNIQUE, §5.3). null — provayder hali bermagan. */
  readonly providerTransactionId: string | null;
  /** Mijoz yo'naltiriladigan havola. null — redirect kerak emas (naqd). */
  readonly redirectUrl: string | null;
  readonly expiresAt: Date | null;
  /** Xom javob — audit/debug. ⚠️ Karta ma'lumoti BO'LMAYDI (§11). */
  readonly raw: unknown;
}

export type ProviderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'partially_refunded'
  | 'unknown';

export interface ProviderPaymentState {
  readonly status: ProviderPaymentStatus;
  readonly providerTransactionId: string | null;
  /** TIYIN. */
  readonly paidAmount: bigint | null;
  readonly paidAt: Date | null;
  readonly raw: unknown;
}

export interface ProviderRefundInput {
  readonly paymentId: string;
  readonly providerTransactionId: string;
  readonly amount: bigint;
  readonly idempotencyKey: string;
  readonly reason: string;
}

export interface ProviderRefundResult {
  readonly providerRefundId: string | null;
  readonly status: 'succeeded' | 'pending' | 'failed';
  readonly raw: unknown;
}

/** Webhook'ning normallashtirilgan ko'rinishi — domen SHUNI ko'radi. */
export interface NormalizedWebhookEvent {
  readonly providerCode: PaymentProviderCode;
  /** Provayderdagi event ID — dedup uchun (§5.4). */
  readonly providerEventId: string;
  readonly providerTransactionId: string;
  /** Merchant order id (= Kelvin paymentId) agar provayder qaytarsa. */
  readonly paymentId: string | null;
  readonly state: ProviderPaymentState;
  /** Provayder tomonidagi vaqt — replay oynasi uchun (§11.4). */
  readonly occurredAt: Date;
}

/** Xom webhook so'rovi. RAW body — imzo tekshiruvi uchun (§11.3). */
export interface RawWebhookRequest {
  readonly headers: Readonly<Record<string, string | undefined>>;
  readonly rawBody: Buffer;
}

/**
 * PORT. Har provayder shuni bajaradi. Domen boshqa hech narsani ko'rmaydi.
 */
export interface PaymentProvider {
  readonly code: PaymentProviderCode;
  readonly capabilities: ProviderCapabilities;

  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;

  /** Holatni provayderdan so'rash — webhook kelmaganda / reconciliation (§12). */
  getState(providerTransactionId: string): Promise<ProviderPaymentState>;

  refund(input: ProviderRefundInput): Promise<ProviderRefundResult>;

  /**
   * Imzoni tekshiradi va normallashtiradi. ⚠️ Imzo noto'g'ri → MAJBURIY throw.
   * null qaytarish TAQIQLANADI (§11.3).
   */
  parseWebhook(req: RawWebhookRequest): Promise<NormalizedWebhookEvent>;

  /** Provayder webhook'ga kutadigan javob (format provayderga xos). */
  buildWebhookResponse(result: 'accepted' | 'rejected', error?: Error): unknown;
}

/** DI token — barcha ro'yxatdan o'tgan adapterlar massivi. */
export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');

/** Provayder kodi (kichik) → DB `PaymentProvider` enum (katta). */
const CODE_TO_DB: Readonly<Record<PaymentProviderCode, string>> = {
  click: 'CLICK',
  payme: 'PAYME',
  uzum: 'UZUM',
  cash: 'CASH',
  bank_transfer: 'BANK_TRANSFER',
};
const DB_TO_CODE: Readonly<Record<string, PaymentProviderCode>> = {
  CLICK: 'click',
  PAYME: 'payme',
  UZUM: 'uzum',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
};

export function toDbProvider(code: PaymentProviderCode): string {
  return CODE_TO_DB[code];
}

export function fromDbProvider(provider: string): PaymentProviderCode | null {
  return DB_TO_CODE[provider] ?? null;
}
