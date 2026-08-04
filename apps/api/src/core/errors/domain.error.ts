/**
 * Domen xatolari.
 *
 * Tamoyil: domen xatosi va texnik xato ARALASHMAYDI.
 *
 *  - DomainError  → biznes qoidasi buzildi. Kutilgan holat. 4xx.
 *  - Boshqa xato  → bug yoki infratuzilma muammosi. Kutilmagan. 500.
 *
 * Global exception filter DomainError'ni RFC 9457 (Problem Details)
 * formatiga aylantiradi. Kutilmagan xatoda foydalanuvchi faqat traceId
 * ko'radi — ichki detal HECH QACHON chiqmaydi.
 *
 * Bu fayl `core/` da — ya'ni NestJS'ni bilmaydi (ADR-0001).
 * HTTP status kodi shu yerda, lekin bu HTTP bog'liqligi emas — oddiy raqam.
 *
 * @see docs/02-architecture.md §11
 * @see docs/04-api-spec.md §2.5
 */
export abstract class DomainError extends Error {
  /** Mashina uchun barqaror kod. Hech qachon o'zgarmaydi. */
  abstract readonly code: string;

  /** RFC 9457 javobidagi status. */
  abstract readonly httpStatus: number;

  /**
   * Xatolik bilan birga beriladigan tuzilmali ma'lumot.
   * Foydalanuvchiga ko'rsatiladi — sir bo'lmasligi kerak.
   */
  readonly meta: Readonly<Record<string, unknown>>;

  constructor(message: string, meta: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
    this.meta = Object.freeze({ ...meta });

    // TypeScript'da Error'dan meros olishda prototype zanjiri buziladi.
    // Busiz `instanceof DomainError` false qaytaradi.
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, new.target);
  }
}

/** Resurs topilmadi. Ruxsat yo'qligida ham shu qaytadi — ma'lumot sizdirmaslik uchun. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(resource: string, id?: string) {
    super(`${resource} topilmadi`, { resource, ...(id !== undefined && { id }) });
  }
}

/** Biznes qoidasi buzildi. Sintaksis to'g'ri, mantiq noto'g'ri. */
export class BusinessRuleError extends DomainError {
  readonly code: string;
  readonly httpStatus = 422;

  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message, meta);
    this.code = code;
  }
}

/** Resurs holati operatsiyaga ruxsat bermaydi. */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}

/**
 * Yetkazib berish sloti to'lgan — bron qilib bo'lmadi (docs/07 §8).
 * ⚠️ Oversell bilan bir xil race: atomik shartli UPDATE 0 qator qaytardi. 409.
 */
export class SlotUnavailableError extends DomainError {
  readonly code = 'SLOT_UNAVAILABLE';
  readonly httpStatus = 409;

  constructor(slotId: string) {
    super('Yetkazib berish sloti band', { slotId });
  }
}

/**
 * Yetarli qoldiq yo'q — rezerv qilib bo'lmadi (oversell'ga qarshi).
 *
 * ⚠️ Bu KUTILGAN holat, bug emas: atomik shartli UPDATE 0 qator qaytardi
 *    (docs/06 §2.4). Deadlock/timeout EMAS — aniq "qoldiq yetmadi". 409.
 */
export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly httpStatus = 409;

  constructor(variantId: string, requested: number) {
    super('Yetarli qoldiq yo‘q', { variantId, requested });
  }
}

/** Autentifikatsiya bor, lekin ruxsat yo'q. */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}

/**
 * Juda tez-tez so'rov — kutish kerak (masalan OTP qayta yuborish oynasi).
 * ⚠️ Bu KUTILGAN holat: `meta.retryAfter` (soniya) bilan qaytadi. 429.
 */
export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly httpStatus = 429;

  constructor(message: string, retryAfter: number) {
    super(message, { retryAfter });
  }
}

/**
 * Webhook hodisasi replay oynasidan tashqarida (docs/08 §11.4).
 * ⚠️ Juda eski YOKI kelajakdan — takroriy hujum (replay) signali. 400.
 */
export class ReplayAttackError extends DomainError {
  readonly code = 'REPLAY_REJECTED';
  readonly httpStatus = 400;

  constructor(reason: string) {
    super('Webhook hodisasi replay oynasidan tashqarida', { reason });
  }
}

/**
 * Webhook noma'lum tranzaksiyaga ishora qiladi (docs/08 §5.5).
 * ⚠️ Provayder ID'si bo'yicha to'lov topilmadi — yetim webhook. 404.
 */
export class UnknownTransactionError extends DomainError {
  readonly code = 'UNKNOWN_TRANSACTION';
  readonly httpStatus = 404;

  constructor(providerTransactionId: string) {
    super('Noma‘lum to‘lov tranzaksiyasi', { providerTransactionId });
  }
}

/** So'ralgan to'lov provayderi ro'yxatda yo'q (docs/08 §2.4). 404. */
export class UnknownProviderError extends DomainError {
  readonly code = 'UNKNOWN_PROVIDER';
  readonly httpStatus = 404;

  constructor(code: string) {
    super('Noma‘lum to‘lov provayderi', { provider: code });
  }
}
