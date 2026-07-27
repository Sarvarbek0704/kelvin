import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { DeliveryService, type DeliveryQuote } from './delivery.service';
import { type SlotRow, type ZoneRow } from './delivery.repository';
import { CreateSlotDto, CreateZoneDto } from './dto/delivery.dto';

/** delivery — zona, narx, slot (docs/09, docs/07 §8). */
@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post('zones')
  @RequirePermission('delivery:config_write')
  @ApiOperation({ summary: 'Yetkazish zonasi yaratish' })
  createZone(@Body() dto: CreateZoneDto): Promise<ZoneRow> {
    return this.delivery.createZone({
      name: dto.name,
      districts: dto.districts,
      priceAmount: BigInt(dto.priceAmount),
      ...(dto.freeThresholdAmount !== undefined && { freeThresholdAmount: BigInt(dto.freeThresholdAmount) }),
      ...(dto.etaDaysMin !== undefined && { etaDaysMin: dto.etaDaysMin }),
      ...(dto.etaDaysMax !== undefined && { etaDaysMax: dto.etaDaysMax }),
    });
  }

  @Get('zones')
  @Public()
  @ApiOperation({ summary: 'Yetkazish zonalari (checkout uchun)' })
  listZones(): Promise<ZoneRow[]> {
    return this.delivery.listZones();
  }

  @Get('zones/:id/quote')
  @Public()
  @ApiOperation({ summary: 'Yetkazish narxi (subtotal freeThreshold’dan katta → bepul)' })
  quote(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Query('subtotal') subtotal?: string,
  ): Promise<DeliveryQuote> {
    if (subtotal === undefined || !/^\d+$/.test(subtotal)) {
      throw new BadRequestException('subtotal (tiyin) kerak');
    }
    return this.delivery.quote(id, BigInt(subtotal));
  }

  @Post('slots')
  @RequirePermission('delivery:config_write')
  @ApiOperation({ summary: 'Yetkazish sloti yaratish' })
  createSlot(@Body() dto: CreateSlotDto): Promise<SlotRow> {
    return this.delivery.createSlot({
      zoneId: dto.zoneId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      capacity: dto.capacity,
    });
  }

  @Get('slots')
  @Public()
  @ApiOperation({ summary: 'Bo‘sh slotlar (zona + sana)' })
  listSlots(@Query('zoneId') zoneId?: string, @Query('date') date?: string): Promise<SlotRow[]> {
    if (zoneId === undefined || date === undefined) {
      throw new BadRequestException('zoneId va date kerak');
    }
    return this.delivery.listAvailableSlots(zoneId, new Date(date));
  }
}
