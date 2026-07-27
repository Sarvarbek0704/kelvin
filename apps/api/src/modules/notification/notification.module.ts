import { Module } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { LogNotificationAdapter } from './notification.adapter';
import { NOTIFICATION_PORT } from './notification.port';

/**
 * notification — SMS/Telegram xabarlari (docs/09, Faza 3.15).
 *
 * ⚠️ Boshqa modullar (order/payment) NOTIFICATION_PORT orqali yuboradi.
 *    Hozircha LogAdapter; real Eskiz/Telegram — tashqi hisob bilan keyingi ish.
 */
@Module({
  providers: [
    NotificationRepository,
    LogNotificationAdapter,
    NotificationService,
    { provide: NOTIFICATION_PORT, useExisting: NotificationService },
  ],
  exports: [NOTIFICATION_PORT],
})
export class NotificationModule {}
