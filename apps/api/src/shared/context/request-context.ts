import { type Actor } from '@kelvin/contracts';

/**
 * So'rov konteksti — CLS orqali butun so'rov davomida saqlanadi.
 *
 * traceId — nestjs-cls o'zi generatsiya qiladi (`cls.getId()`).
 * Qolganlari guard/middleware tomonidan to'ldiriladi.
 */
export const CLS_ACTOR = 'actor';
export const CLS_IP = 'ip';
export const CLS_USER_AGENT = 'userAgent';

export interface RequestContextStore {
  [CLS_ACTOR]?: Actor;
  [CLS_IP]?: string;
  [CLS_USER_AGENT]?: string;
}
