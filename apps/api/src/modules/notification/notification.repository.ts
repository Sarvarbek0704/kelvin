import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type JsonInput } from '../../shared/json';

export type NotificationRow = Prisma.NotificationGetPayload<Record<string, never>>;

/** Bildirishnoma — Prisma qatlami (docs/09). */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    channel: string;
    recipient: string;
    templateKey: string;
    payload: JsonInput;
  }): Promise<NotificationRow> {
    return this.prisma.notification.create({
      data: {
        channel: data.channel,
        recipient: data.recipient,
        templateKey: data.templateKey,
        payload: data.payload,
      },
    });
  }

  async markSent(id: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { sentAt: new Date() } });
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { failedAt: new Date(), failureReason: reason.slice(0, 500) },
    });
  }
}
