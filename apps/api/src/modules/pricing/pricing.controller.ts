import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

import { RequirePermission } from '../../shared/auth/auth.decorators';
import { PricingService } from './pricing.service';
import { type PriceRow } from './price.repository';

class SetPriceDto {
  @ApiProperty({ description: 'Narx, TIYIN (string). Masalan 1 250 000 so‘m = "125000000"' })
  @IsNumberString()
  amount!: string;
}

/**
 * pricing — narx boshqaruvi (admin). RETAIL ro'yxati bilan ishlaydi:
 * o'qish price:read, yozish price:write. ⚠️ Pul — TIYIN (JSON'da string).
 */
@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('variants/:variantId/prices')
  @RequirePermission('price:read')
  @ApiOperation({ summary: 'Variantning RETAIL narxlari (joriy, tierlar bilan)' })
  prices(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
  ): Promise<PriceRow[]> {
    return this.pricing.listRetailPrices(variantId);
  }

  @Put('variants/:variantId/price')
  @RequirePermission('price:write')
  @ApiOperation({ summary: 'RETAIL narxni o‘rnatish (upsert, minQuantity=1)' })
  setPrice(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() dto: SetPriceDto,
  ): Promise<PriceRow> {
    return this.pricing.setRetailPrice(variantId, BigInt(dto.amount));
  }
}
