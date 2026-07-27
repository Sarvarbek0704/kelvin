import { Module } from '@nestjs/common';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockRepository } from './stock.repository';
import { ReservationSweeperService } from './reservation-sweeper.service';
import { INVENTORY_PORT } from './inventory.port';

/**
 * inventory — qoldiq va rezerv (docs/02 §5 №5, docs/06).
 *
 * ⚠️ Loyihaning eng nozik moduli: oversell'ga qarshi atomik shartli UPDATE
 *    (ADR-0007). Boshqa modullar (order) `INVENTORY_PORT` orqali reserve/
 *    release/consume/transfer chaqiradi (arch:check — service.ts import emas).
 */
@Module({
  controllers: [InventoryController],
  providers: [
    StockRepository,
    InventoryService,
    ReservationSweeperService,
    { provide: INVENTORY_PORT, useExisting: InventoryService },
  ],
  exports: [INVENTORY_PORT],
})
export class InventoryModule {}
