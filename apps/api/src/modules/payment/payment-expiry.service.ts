import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PaymentService } from './payment.service';

/**
 * Muddati o'tgan to'lovlarni EXPIRED qiluvchi job (docs/08 §4 — invoice TTL).
 *
 * ⚠️ Onlayn to'lov havolasi cheksiz ochiq qolmasligi kerak: mijoz to'lamay ketsa,
 *    PENDING to'lov TTL'dan keyin EXPIRED bo'ladi (holat toza qoladi, reconciliation
 *    aniq). Rezervlar alohida ReservationSweeper bilan bo'shaydi.
 */
@Injectable()
export class PaymentExpiryService {
  private readonly logger = new Logger(PaymentExpiryService.name);

  constructor(private readonly payments: PaymentService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expire(): Promise<void> {
    const count = await this.payments.expireStalePayments(30);
    if (count > 0) {
      this.logger.log(`TTL: ${String(count)} to‘lov EXPIRED`);
    }
  }
}
