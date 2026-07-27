import { Module } from '@nestjs/common';

import { PricingModule } from '../pricing/pricing.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';

/**
 * pos — offline kassa (docs/15 §10, Faza 8). ⚠️ Fiskalsiz/offlinesiz. Sotuv
 * oversell himoyasi bilan (INVENTORY_PORT reserve→consume), narx PRICING_PORT'dan.
 */
@Module({
  imports: [PricingModule, InventoryModule],
  controllers: [PosController],
  providers: [PosRepository, PosService],
  exports: [PosService],
})
export class PosModule {}
