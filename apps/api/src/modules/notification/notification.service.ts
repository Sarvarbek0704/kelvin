import { Injectable, Logger } from '@nestjs/common';

import { LogNotificationAdapter, type NotificationAdapter } from './notification.adapter';
import { SmtpEmailAdapter } from './smtp-email.adapter';
import { NotificationRepository } from './notification.repository';
import { type NotificationPort, type NotifyInput } from './notification.port';

/**
 * notification — xabar yuborish (docs/09). Notification yozuvi + adapter.
 *
 * Kanal routing: EMAIL + SMTP sozlangan → SmtpEmailAdapter (real jo'natish);
 * qolgan hamma narsa (SMS/Telegram, yoki SMTP yo'q) → LogAdapter.
 *
 * ⚠️ Best-effort: yuborish yiqilsa xato YUTILADI (buyurtma oqimini buzmaydi) —
 *    faqat failedAt yoziladi. Xabar SAQLANADI (audit + qayta yuborish uchun).
 */
@Injectable()
export class NotificationService implements NotificationPort {
  private readonly log = new Logger(NotificationService.name);

  constructor(
    private readonly repo: NotificationRepository,
    private readonly logAdapter: LogNotificationAdapter,
    private readonly smtpAdapter: SmtpEmailAdapter,
  ) {}

  private adapterFor(channel: string): NotificationAdapter {
    if (channel === 'EMAIL' && this.smtpAdapter.enabled) {
      return this.smtpAdapter;
    }
    return this.logAdapter;
  }

  async send(input: NotifyInput): Promise<void> {
    const record = await this.repo.create({
      channel: input.channel,
      recipient: input.recipient,
      templateKey: input.templateKey,
      payload: input.payload,
    });
    try {
      // ⚠️ Hard-limit 20s: adapter (SMTP/DNS) qanday osilmasin, so'rov bundan
      //    uzoq kutmaydi — yuborish baribir best-effort.
      await Promise.race([
        this.adapterFor(input.channel).deliver(input),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Yuborish 20s da ulgurmadi (timeout)'));
          }, 20_000).unref();
        }),
      ]);
      await this.repo.markSent(record.id);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await this.repo.markFailed(record.id, reason);
      this.log.warn(`Bildirishnoma yuborilmadi (${input.templateKey}): ${reason}`);
    }
  }
}
