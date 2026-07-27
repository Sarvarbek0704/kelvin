import { Module } from '@nestjs/common';

import { InventoryModule } from '../inventory/inventory.module';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { ProcurementRepository } from './procurement.repository';

/**
 * procurement — ta'minot: Supplier, PurchaseOrder, qabul (docs/15 §8, Faza 6).
 *
 * ⚠️ Qabul → INVENTORY_PORT.receiveStock (arch:check — service.ts import emas).
 *    Stock tizimga aynan shu modul orqali kiradi.
 */
@Module({
  imports: [InventoryModule],
  controllers: [ProcurementController],
  providers: [ProcurementRepository, ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
