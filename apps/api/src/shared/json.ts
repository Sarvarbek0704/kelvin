/**
 * JSON qiymat tipi — service qatlami `@prisma/client` ni import qilmasligi
 * uchun (arxitektura qoidasi: Prisma faqat repository qatlamida).
 *
 * `Prisma.InputJsonValue` ga strukturaviy mos.
 */
export type JsonInput = string | number | boolean | { [key: string]: JsonInput } | JsonInput[];

/** i18n/atribut obyektlarini JSON maydonga o'tkazish uchun toza cast. */
export function toJson(value: unknown): JsonInput {
  return value as JsonInput;
}
