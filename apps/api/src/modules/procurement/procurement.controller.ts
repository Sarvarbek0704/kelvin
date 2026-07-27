import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, type CursorPage } from '@kelvin/contracts';

import { NotFoundError } from '../../core/errors/domain.error';
import { CurrentActor, RequirePermission } from '../../shared/auth/auth.decorators';
import { ProcurementService } from './procurement.service';
import { type PurchaseOrderWithItems, type SupplierRow } from './procurement.repository';
import { CreatePurchaseOrderDto, CreateSupplierDto } from './dto/procurement.dto';

interface POView {
  readonly id: string;
  readonly number: string;
  readonly status: string;
  readonly supplierId: string;
  readonly warehouseId: string;
  readonly totalAmount: string;
  readonly items: readonly {
    readonly variantId: string;
    readonly quantityOrdered: number;
    readonly quantityReceived: number;
    readonly unitCostAmount: string;
  }[];
}

function toPOView(po: PurchaseOrderWithItems): POView {
  return {
    id: po.id,
    number: po.number,
    status: po.status,
    supplierId: po.supplierId,
    warehouseId: po.warehouseId,
    totalAmount: po.totalAmount.toString(),
    items: po.items.map((it) => ({
      variantId: it.variantId,
      quantityOrdered: it.quantityOrdered,
      quantityReceived: it.quantityReceived,
      unitCostAmount: it.unitCostAmount.toString(),
    })),
  };
}

/** procurement — ta'minot (docs/15 §8, Faza 6). */
@ApiTags('procurement')
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Post('suppliers')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'Ta’minotchi yaratish' })
  createSupplier(@Body() dto: CreateSupplierDto): Promise<SupplierRow> {
    return this.procurement.createSupplier(dto);
  }

  @Get('suppliers')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'Ta’minotchilar ro‘yxati' })
  listSuppliers(): Promise<SupplierRow[]> {
    return this.procurement.listSuppliers();
  }

  @Post('purchase-orders')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'Xarid buyurtmasi (DRAFT)' })
  async createPO(@Body() dto: CreatePurchaseOrderDto): Promise<POView> {
    const po = await this.procurement.createPurchaseOrder({
      supplierId: dto.supplierId,
      warehouseId: dto.warehouseId,
      items: dto.items.map((it) => ({
        variantId: it.variantId,
        quantityOrdered: it.quantityOrdered,
        unitCostAmount: BigInt(it.unitCostAmount),
      })),
    });
    return toPOView(po);
  }

  @Get('purchase-orders')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'Xarid buyurtmalari ro‘yxati (cursor)' })
  async listPOs(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<POView>> {
    const page = await this.procurement.listPurchaseOrders({
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items.map(toPOView),
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Get('purchase-orders/:id')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'Xarid buyurtmasi' })
  async getPO(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<POView> {
    const po = await this.procurement.getPurchaseOrder(id);
    if (po === null) {
      throw new NotFoundError('Xarid buyurtmasi', id);
    }
    return toPOView(po);
  }

  @Post('purchase-orders/:id/submit')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'DRAFT → ORDERED' })
  async submit(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<POView> {
    return toPOView(await this.procurement.submit(id));
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermission('stock:movement_write')
  @ApiOperation({ summary: 'ORDERED → RECEIVED: tovar keldi, qoldiq oshadi' })
  async receive(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<POView> {
    return toPOView(await this.procurement.receive(id, actor.userId));
  }

  @Post('purchase-orders/:id/cancel')
  @RequirePermission('supplier:write')
  @ApiOperation({ summary: 'DRAFT/ORDERED → CANCELLED' })
  async cancel(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<POView> {
    return toPOView(await this.procurement.cancel(id));
  }
}
