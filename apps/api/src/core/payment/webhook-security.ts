import { timingSafeEqual } from 'node:crypto';

import { ReplayAttackError } from '../errors/domain.error';

/**
 * Webhook xavfsizligi — SOF primitivlar (docs/08 §11.3-11.4). core/ da:
 * NestJS/Prisma bilmaydi. Har provayder adapteri IMZO tekshiruvida shulardan
 * foydalanadi (algoritm provayderga xos, lekin replay oynasi va timing-safe
 * taqqoslash umumiy).
 */

/** Replay oynasi — provayder timestamp'i shu oraliqda bo'lishi shart. §11.4 */
export const REPLAY_WINDOW_SECONDS = 300; // 5 daqiqa

/**
 * Hodisa vaqti "yangi"ligini tekshiradi. ⚠️ Ikki yo'nalish: juda ESKI (replay)
 * VA kelajakdan (soat buzilgan yoki soxta). Ikkalasi ham rad etiladi.
 *
 * @param occurredAt provayder aytgan hodisa vaqti (webhook ichidan)
 * @param now        joriy vaqt (test uchun uzatiladi — SOF qoladi)
 */
export function assertFresh(
  occurredAt: Date,
  now: Date,
  windowSeconds: number = REPLAY_WINDOW_SECONDS,
): void {
  const ageMs = now.getTime() - occurredAt.getTime();
  const windowMs = windowSeconds * 1000;
  if (ageMs > windowMs) {
    throw new ReplayAttackError('event too old');
  }
  if (ageMs < -windowMs) {
    throw new ReplayAttackError('event from the future');
  }
}

/**
 * ⚠️ Imzolarni TIMING-SAFE taqqoslash (docs/08 §11.3). Oddiy `===` imzo uzunligi
 * bo'yicha sirni sizdiradi (early-exit); `timingSafeEqual` doim to'liq o'qiydi.
 * Uzunlik farq qilsa — darhol false (bu sir emas: imzo formati ochiq).
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ba, bb);
}
