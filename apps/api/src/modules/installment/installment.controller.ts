import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type CursorPage } from '@kelvin/contracts';

import { NotFoundError } from '../../core/errors/domain.error';
import { RequirePermission } from '../../shared/auth/auth.decorators';
import { InstallmentService, toPlanView, type PlanView } from './installment.service';
import { CreatePlanDto, RecordPaymentDto } from './dto/installment.dto';

/** installment — rassrochka QO'LDA rejim (docs/08 §7). Xodim: installment:write/read. */
@ApiTags('installment')
@Controller('installments')
export class InstallmentController {
  constructor(private readonly installments: InstallmentService) {}

  @Post()
  @RequirePermission('installment:write')
  @ApiOperation({ summary: 'Rassrochka rejasi yaratish (CONFIRMED buyurtma)' })
  async create(@Body() dto: CreatePlanDto): Promise<PlanView> {
    const plan = await this.installments.createPlanForOrder({
      orderId: dto.orderId,
      termMonths: dto.termMonths,
      firstDueDate: new Date(dto.firstDueDate),
      ...(dto.kind !== undefined && { kind: dto.kind }),
      ...(dto.downPaymentAmount !== undefined && { downPaymentAmount: BigInt(dto.downPaymentAmount) }),
      ...(dto.interestRateBp !== undefined && { interestRateBp: dto.interestRateBp }),
    });
    return toPlanView(plan);
  }

  @Get()
  @RequirePermission('installment:read')
  @ApiOperation({ summary: 'Rassrochka rejalari (cursor)' })
  async list(@Query('limit') limit?: string, @Query('cursor') cursor?: string): Promise<CursorPage<PlanView>> {
    const page = await this.installments.listPlans({
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items.map(toPlanView),
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Get(':id')
  @RequirePermission('installment:read')
  @ApiOperation({ summary: 'Rassrochka rejasi + grafik' })
  async get(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<PlanView> {
    const plan = await this.installments.getPlan(id);
    if (plan === null) {
      throw new NotFoundError('Rassrochka rejasi', id);
    }
    return toPlanView(plan);
  }

  @Post('schedule/:scheduleId/pay')
  @RequirePermission('installment:write')
  @ApiOperation({ summary: 'Grafik oyiga to‘lov qabul qilish (kassir)' })
  async pay(
    @Param('scheduleId', new ParseUUIDPipe({ version: '7' })) scheduleId: string,
    @Body() dto: RecordPaymentDto,
  ): Promise<{ id: string; status: string; paidAmount: string }> {
    const line = await this.installments.recordPayment(scheduleId, BigInt(dto.amount));
    return { id: line.id, status: line.status, paidAmount: line.paidAmount.toString() };
  }
}
