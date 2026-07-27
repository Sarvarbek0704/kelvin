import { type JsonInput } from '../../shared/json';

/**
 * notification modulining PUBLIC porti (docs/02 §6.1). order/payment shu port
 * orqali xabar yuboradi. ⚠️ Real Eskiz(SMS)/Telegram adapterlari — keyingi ish
 * (docs §2.5 pattern); hozircha LogAdapter (yozib qo'yadi, Notification saqlaydi).
 */

export interface NotifyInput {
  /** 'SMS' | 'TELEGRAM' | 'EMAIL'. */
  readonly channel: string;
  /** Telefon / chatId / email. */
  readonly recipient: string;
  readonly templateKey: string;
  readonly payload: JsonInput;
}

export const NOTIFICATION_PORT = Symbol('NotificationPort');

export interface NotificationPort {
  /** Xabar yuborish — Notification yozuvi + adapter. Best-effort (xato yutiladi). */
  send(input: NotifyInput): Promise<void>;
}
