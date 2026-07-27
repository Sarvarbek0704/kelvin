import { randomUUID } from 'node:crypto';
import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { NotFoundError } from '../../core/errors/domain.error';
import { RequirePermission } from '../../shared/auth/auth.decorators';
import { ShipmentService, toShipmentView, type ShipmentView } from './shipment.service';
import { type CourierOption, type ShipmentRow } from './shipment.repository';
import { AssignCourierDto, CreateShipmentDto } from './dto/shipment.dto';

/** shipment — jo'natma (docs/07, docs/09). Xodim: shipment:write. */
@ApiTags('shipment')
@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipments: ShipmentService) {}

  @Post()
  @RequirePermission('shipment:write')
  @ApiOperation({ summary: 'Jo‘natma yaratish (CONFIRMED buyurtma + manzil + slot)' })
  async create(@Body() dto: CreateShipmentDto): Promise<ShipmentView> {
    const s = await this.shipments.createForOrder({
      orderId: dto.orderId,
      addressId: dto.addressId,
      ...(dto.slotId !== undefined && { slotId: dto.slotId }),
    });
    return toShipmentView(s);
  }

  @Get()
  @RequirePermission('shipment:read')
  @ApiOperation({ summary: 'Buyurtmaning jo‘natmalari (orderId) — admin' })
  async listByOrder(@Query('orderId') orderId?: string): Promise<ShipmentView[]> {
    if (orderId === undefined || orderId.trim() === '') {
      throw new BadRequestException('orderId parametri kerak');
    }
    const shipments = await this.shipments.listByOrder(orderId);
    return shipments.map(toShipmentView);
  }

  @Get('couriers')
  @RequirePermission('shipment:write')
  @ApiOperation({ summary: 'Faol kuryerlar (tayinlash tanlovi)' })
  couriers(): Promise<CourierOption[]> {
    return this.shipments.listCouriers();
  }

  @Get(':id')
  @RequirePermission('shipment:read')
  @ApiOperation({ summary: 'Jo‘natma' })
  async get(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<ShipmentRow> {
    const s = await this.shipments.getById(id);
    if (s === null) {
      throw new NotFoundError('Jo‘natma', id);
    }
    return s;
  }

  @Post(':id/assign')
  @RequirePermission('shipment:write')
  @ApiOperation({ summary: 'Kuryer tayinlash: PENDING → ASSIGNED' })
  async assign(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: AssignCourierDto,
  ): Promise<ShipmentView> {
    const tracking = `KLV-SHIP-${randomUUID().slice(0, 8).toUpperCase()}`;
    return toShipmentView(await this.shipments.assignCourier(id, dto.courierId, tracking));
  }

  @Post(':id/transit')
  @RequirePermission('shipment:write')
  @ApiOperation({ summary: 'Yo‘lda: ASSIGNED → IN_TRANSIT' })
  async transit(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<ShipmentView> {
    return toShipmentView(await this.shipments.markInTransit(id));
  }

  @Post(':id/deliver')
  @RequirePermission('shipment:write')
  @ApiOperation({ summary: 'Yetkazildi: IN_TRANSIT → DELIVERED' })
  async deliver(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<ShipmentView> {
    return toShipmentView(await this.shipments.markDelivered(id));
  }
}
