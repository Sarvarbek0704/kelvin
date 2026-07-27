import { Injectable, Logger } from '@nestjs/common';

import { type JsonInput } from '../../shared/json';

export interface DeliverInput {
  readonly channel: string;
  readonly recipient: string;
  readonly templateKey: string;
  readonly payload: JsonInput;
}

/**
 * Yetkazish adapteri — real kanal (SMS/Telegram) o'rniga. ⚠️ Real adapterlar
 * (Eskiz.uz, Telegram Bot API) tashqi hisob/token talab qiladi — keyingi ish.
 */
export interface NotificationAdapter {
  deliver(input: DeliverInput): Promise<void>;
}

/**
 * LogAdapter — dev/test uchun: xabarni logga yozadi (haqiqiy yuborish yo'q).
 * Har doim muvaffaqiyat. Notification yozuvi baribir saqlanadi (service).
 */
@Injectable()
export class LogNotificationAdapter implements NotificationAdapter {
  private readonly log = new Logger('Notification');

  async deliver(input: DeliverInput): Promise<void> {
    this.log.log(`[${input.channel}] → ${input.recipient}: ${input.templateKey}`);
    await Promise.resolve();
  }
}
