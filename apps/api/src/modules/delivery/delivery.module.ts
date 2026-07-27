import { Module } from '@nestjs/common';

import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryRepository } from './delivery.repository';
import { DELIVERY_PORT } from './delivery.port';

/**
 * delivery — zona, narx, slot bron (docs/09, docs/07 §8, Faza 7).
 *
 * ⚠️ Slot bron = inventory oversell naqshi (atomik shartli UPDATE). Order
 *    checkout'da slot bron qilinadi (kelajakda DELIVERY_PORT orqali).
 */
@Module({
  controllers: [DeliveryController],
  providers: [DeliveryRepository, DeliveryService, { provide: DELIVERY_PORT, useExisting: DeliveryService }],
  exports: [DeliveryService, DELIVERY_PORT],
})
export class DeliveryModule {}
