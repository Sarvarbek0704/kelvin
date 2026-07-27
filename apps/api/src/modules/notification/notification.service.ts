import { Injectable, Logger } from '@nestjs/common';

import { LogNotificationAdapter } from './notification.adapter';
import { NotificationRepository } from './notification.repository';
import { type NotificationPort, type NotifyInput } from './notification.port';

/**
 * notification — xabar yuborish (docs/09). Notification yozuvi + adapter.
 *
 * ⚠️ Best-effort: yuborish yiqilsa xato YUTILADI (buyurtma oqimini buzmaydi) —
 *    faqat failedAt yoziladi. Xabar SAQLANADI (audit + qayta yuborish uchun).
 */
@Injectable()
export class NotificationService implements NotificationPort {
  private readonly log = new Logger(NotificationService.name);

  constructor(
    private readonly repo: NotificationRepository,
    private readonly adapter: LogNotificationAdapter,
  ) {}

  async send(input: NotifyInput): Promise<void> {
    const record = await this.repo.create({
      channel: input.channel,
      recipient: input.recipient,
      templateKey: input.templateKey,
      payload: input.payload,
    });
    try {
      await this.adapter.deliver(input);
      await this.repo.markSent(record.id);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await this.repo.markFailed(record.id, reason);
      this.log.warn(`Bildirishnoma yuborilmadi (${input.templateKey}): ${reason}`);
    }
  }
}
