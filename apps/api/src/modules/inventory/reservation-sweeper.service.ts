import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InventoryService } from './inventory.service';

/**
 * Muddati tugagan rezervlarni bo'shatuvchi job (docs/06 §4.2, ish 3.6).
 *
 * ⚠️ Checkout tashlab ketilsa rezerv "abadiy" band bo'lib qolmasligi kerak —
 *    aks holda tovar hech kimga ko'rinmaydi. TTL tugagach avtomatik bo'shaydi.
 */
@Injectable()
export class ReservationSweeperService {
  private readonly logger = new Logger(ReservationSweeperService.name);

  constructor(private readonly inventory: InventoryService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep(): Promise<void> {
    const released = await this.inventory.releaseExpired();
    if (released > 0) {
      this.logger.log(`Muddati tugagan rezerv bo‘shatildi: ${String(released)}`);
    }
  }
}
