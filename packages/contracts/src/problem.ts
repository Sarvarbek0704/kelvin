/**
 * Xatolik formati — RFC 9457 (Problem Details).
 *
 * `Content-Type: application/problem+json`.
 *
 * @see docs/04-api-spec.md §3
 */

/** Mashina uchun barqaror xato kodlari. HECH QACHON tarjima qilinmaydi. */
export const ERROR_CODES = [
  // 400
  'MALFORMED_REQUEST',
  'INVALID_CURSOR',
  'INVALID_FILTER',
  'UNSUPPORTED_SORT_FIELD',
  // 401
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'REFRESH_TOKEN_REUSED',
  // 403
  'PERMISSION_DENIED',
  // 404
  'RESOURCE_NOT_FOUND',
  // 409
  'INSUFFICIENT_STOCK',
  'RESERVATION_EXPIRED',
  'INVALID_STATE_TRANSITION',
  'IDEMPOTENCY_KEY_CONFLICT',
  'CONCURRENT_MODIFICATION',
  'SHIFT_ALREADY_OPEN',
  // 422
  'VALIDATION_FAILED',
  'INCOMPLETE_PRODUCT',
  'INCOMPATIBLE_COMPONENTS',
  'PRICE_CHANGED',
  // 429
  'RATE_LIMIT_EXCEEDED',
  // 500 / 502 / 503
  'INTERNAL_ERROR',
  'PAYMENT_PROVIDER_ERROR',
  'SERVICE_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface FieldError {
  /** JSON Pointer (RFC 6901): "/items/0/quantity" */
  readonly pointer: string;
  readonly code: string;
  readonly message: string;
}

export interface ProblemDetails {
  /** Xato turi hujjatiga havola. */
  readonly type: string;
  /** Qisqa, inson uchun sarlavha. Tarjima qilinadi. */
  readonly title: string;
  /** HTTP status kodi (dublikat — loglarda qulay). */
  readonly status: number;
  /** Bu holat uchun tushuntirish. Tarjima qilinadi. */
  readonly detail: string;
  /** Xato sodir bo'lgan resurs (instance URI). */
  readonly instance?: string;

  // --- Kelvin kengaytmalari ---

  /**
   * MASHINA UCHUN. Barqaror. HECH QACHON tarjima qilinmaydi.
   * Mijoz mantiqi FAQAT shunga tayanadi, `title`/`detail` ga emas.
   */
  readonly code: ErrorCode;
  /** HAR DOIM bor — 500 da ham. Foydalanuvchi shu bilan murojaat qiladi. */
  readonly traceId: string;
  /** Faqat validatsiya/maydon darajasidagi xatolarda. */
  readonly errors?: readonly FieldError[];
}

/** Muammo turi URI'sini kod'dan yasaydi (bo'sh manba — hujjat sahifasi). */
export function problemType(slug: string): string {
  return `https://api.kelvin.uz/problems/${slug}`;
}
