import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor } from '@kelvin/contracts';

import { ForbiddenError } from '../../core/errors/domain.error';
import { Authenticated, CurrentActor, RequirePermission } from '../../shared/auth/auth.decorators';
import { AddressService } from './address.service';
import { type AddressRow } from './address.repository';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

/**
 * customer — mijoz manzillari. @Authenticated + mijoz (actor.customerId).
 * Xodim (customerId yo'q) → 403. Egalik service'da tekshiriladi.
 */
@ApiTags('customer: addresses')
@Controller('addresses')
export class AddressController {
  constructor(private readonly addresses: AddressService) {}

  private customerId(actor: Actor): string {
    if (actor.customerId === undefined) {
      throw new ForbiddenError('Faqat mijoz manzil boshqaradi');
    }
    return actor.customerId;
  }

  @Get()
  @Authenticated()
  @ApiOperation({ summary: 'Mening manzillarim' })
  list(@CurrentActor() actor: Actor): Promise<AddressRow[]> {
    return this.addresses.list(this.customerId(actor));
  }

  @Get('admin')
  @RequirePermission('customer:read')
  @ApiOperation({ summary: 'Xodim: mijoz manzillari (jo‘natma yaratish uchun)' })
  adminList(@Query('customerId') customerId?: string): Promise<AddressRow[]> {
    if (customerId === undefined || customerId.trim() === '') {
      throw new BadRequestException('customerId parametri kerak');
    }
    return this.addresses.list(customerId);
  }

  @Post()
  @Authenticated()
  @ApiOperation({ summary: 'Manzil qo‘shish (birinchisi → default)' })
  create(@Body() dto: CreateAddressDto, @CurrentActor() actor: Actor): Promise<AddressRow> {
    return this.addresses.create(this.customerId(actor), dto);
  }

  @Patch(':id')
  @Authenticated()
  @ApiOperation({ summary: 'Manzilni yangilash (o‘ziniki)' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentActor() actor: Actor,
  ): Promise<AddressRow> {
    return this.addresses.update(this.customerId(actor), id, dto);
  }

  @Delete(':id')
  @Authenticated()
  @ApiOperation({ summary: 'Manzilni o‘chirish (o‘ziniki)' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ ok: true }> {
    await this.addresses.remove(this.customerId(actor), id);
    return { ok: true };
  }

  @Post(':id/default')
  @Authenticated()
  @ApiOperation({ summary: 'Standart manzil qilish' })
  async setDefault(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ ok: true }> {
    await this.addresses.setDefault(this.customerId(actor), id);
    return { ok: true };
  }
}
