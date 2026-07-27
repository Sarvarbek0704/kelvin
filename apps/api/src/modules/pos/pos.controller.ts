import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor } from '@kelvin/contracts';

import { CurrentActor, RequirePermission } from '../../shared/auth/auth.decorators';
import { PosService, toShiftView, toTxView, type ShiftView, type TxView } from './pos.service';
import { CloseShiftDto, CreateSaleDto, OpenShiftDto } from './dto/pos.dto';

/** pos — kassa (docs/15 §10). Xodim: pos:shift_manage_own / pos:transaction_create. */
@ApiTags('pos')
@Controller('pos')
export class PosController {
  constructor(private readonly pos: PosService) {}

  @Post('shifts')
  @RequirePermission('pos:shift_manage_own')
  @ApiOperation({ summary: 'Smena ochish' })
  async openShift(@Body() dto: OpenShiftDto, @CurrentActor() actor: Actor): Promise<ShiftView> {
    return toShiftView(await this.pos.openShift(actor.userId, BigInt(dto.openingCashAmount)));
  }

  @Get('shifts/current')
  @RequirePermission('pos:shift_manage_own')
  @ApiOperation({ summary: 'Joriy ochiq smena (yo‘q → null)' })
  async current(@CurrentActor() actor: Actor): Promise<ShiftView | null> {
    const shift = await this.pos.getCurrentShift(actor.userId);
    return shift === null ? null : toShiftView(shift);
  }

  @Post('shifts/:id/close')
  @RequirePermission('pos:shift_manage_own')
  @ApiOperation({ summary: 'Smenani yopish (kassa farqi hisoblanadi)' })
  async closeShift(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: CloseShiftDto,
    @CurrentActor() actor: Actor,
  ): Promise<ShiftView> {
    return toShiftView(await this.pos.closeShift(id, actor.userId, BigInt(dto.closingCashAmount)));
  }

  @Post('transactions')
  @RequirePermission('pos:transaction_create')
  @ApiOperation({ summary: 'POS sotuvi (ochiq smena kerak)' })
  async sale(@Body() dto: CreateSaleDto, @CurrentActor() actor: Actor): Promise<TxView> {
    const tx = await this.pos.createSale({
      userId: actor.userId,
      paymentMethod: dto.paymentMethod,
      items: dto.items,
      ...(dto.warehouseId !== undefined && { warehouseId: dto.warehouseId }),
    });
    return toTxView(tx);
  }

  @Get('transactions')
  @RequirePermission('pos:shift_manage_own')
  @ApiOperation({ summary: 'Smena tranzaksiyalari (shiftId)' })
  async list(@Query('shiftId') shiftId?: string): Promise<TxView[]> {
    if (shiftId === undefined || shiftId.trim() === '') {
      throw new BadRequestException('shiftId parametri kerak');
    }
    const list = await this.pos.listTransactions(shiftId);
    return list.map(toTxView);
  }
}
