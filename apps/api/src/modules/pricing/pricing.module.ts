import { Module } from '@nestjs/common';

import { PriceRepository } from './price.repository';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PRICING_PORT } from './pricing.port';

/**
 * pricing — narx dvigateli (docs/02 §5, docs/07 §7).
 *
 * ⚠️ Determinizm majburiy (CANON §9.5): bir xil savat → bir xil narx. Sof
 *    hisob `core/pricing` da (property test bilan qoplangan). Boshqa modullar
 *    `PRICING_PORT` orqali murojaat qiladi (arch:check — service.ts import emas).
 */
@Module({
  controllers: [PricingController],
  providers: [PriceRepository, PricingService, { provide: PRICING_PORT, useExisting: PricingService }],
  exports: [PRICING_PORT],
})
export class PricingModule {}
