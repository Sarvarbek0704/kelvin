import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, type CursorPage } from '@kelvin/contracts';

import { CurrentActor, RequirePermission } from '../../shared/auth/auth.decorators';
import { InventoryService, type StockView } from './inventory.service';
import { type StockItemRow, type WarehouseRow } from './stock.repository';
import { AdjustStockDto, ReceiveStockDto } from './dto/inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('receipts')
  @RequirePermission('stock:movement_write')
  @ApiOperation({ summary: 'Kirim: qoldiq qabul qilish (on_hand += qty + ledger)' })
  receive(@Body() dto: ReceiveStockDto, @CurrentActor() actor: Actor): Promise<StockItemRow> {
    return this.inventory.receive({
      variantId: dto.variantId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      actorUserId: actor.userId,
      ...(dto.note !== undefined && { note: dto.note }),
    });
  }

  @Post('adjustments')
  @RequirePermission('stock:adjust')
  @ApiOperation({ summary: 'Inventarizatsiya: fizik sanoq → farq ADJUSTMENT + on_hand tuzatish' })
  adjust(@Body() dto: AdjustStockDto, @CurrentActor() actor: Actor): Promise<StockItemRow> {
    return this.inventory.adjustStock({
      variantId: dto.variantId,
      warehouseId: dto.warehouseId,
      physicalCount: dto.physicalCount,
      reason: dto.reason,
      actorUserId: actor.userId,
    });
  }

  @Get('warehouses')
  @RequirePermission('stock:read')
  @ApiOperation({ summary: 'Faol omborlar (tanlash ro‘yxatlari)' })
  warehouses(): Promise<WarehouseRow[]> {
    return this.inventory.listWarehouses();
  }

  @Get('stats')
  @RequirePermission('stock:read')
  @ApiOperation({ summary: 'Qoldiq statistikasi (dashboard) — jami + kam qoldiq' })
  stats(): Promise<{ totalItems: number; lowStock: number }> {
    return this.inventory.stats();
  }

  @Get('stock')
  @RequirePermission('stock:read')
  @ApiOperation({ summary: 'Ombor ko‘rinishi — cursor + ombor filtri (admin)' })
  async stockOverview(
    @Query('warehouseId') warehouseId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<StockView>> {
    const page = await this.inventory.listStockOverview({
      ...(warehouseId !== undefined && { warehouseId }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items,
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Get('stock/:variantId')
  @RequirePermission('stock:read')
  @ApiOperation({ summary: 'Variant qoldig‘i (barcha omborlar bo‘yicha)' })
  stock(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
  ): Promise<StockItemRow[]> {
    return this.inventory.listStock(variantId);
  }
}
