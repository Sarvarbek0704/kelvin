/**
 * Cursor-based pagination.
 *
 * ⚠️ `Buffer` — Node API. Bu funksiyalar SERVER tomonida ishlatiladi.
 *    Mijoz cursor'ni parse QILMAYDI (u opaque). Tiplar (`CursorPage`,
 *    `CursorQuery`) esa ikkala tomonda ham ishlatiladi.
 *
 * @see docs/04-api-spec.md §6
 */

export interface CursorPage<T> {
  readonly items: readonly T[];
  readonly pageInfo: {
    readonly nextCursor: string | null;
    readonly hasNextPage: boolean;
  };
}

export interface CursorQuery {
  readonly limit?: number | undefined;
  readonly cursor?: string | undefined;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

/** Cursor ichi — mijozga OSHKOR EMAS. O'zgarishi buzuvchi emas. */
interface CursorPayload {
  readonly id: string;
}

export class InvalidCursorError extends Error {
  readonly code = 'INVALID_CURSOR' as const;
  constructor() {
    super('Cursor dekodlanmadi');
    this.name = 'InvalidCursorError';
  }
}

export function encodeCursor(id: string): string {
  const payload: CursorPayload = { id };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      typeof parsed.id === 'string'
    ) {
      return { id: parsed.id };
    }
    throw new Error('shape');
  } catch {
    // 400, 422 emas: cursor — bizning formatimiz. Buzuq bo'lsa parse muammosi.
    throw new InvalidCursorError();
  }
}
