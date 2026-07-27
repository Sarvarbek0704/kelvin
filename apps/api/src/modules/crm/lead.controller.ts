import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { type CursorPage } from '@kelvin/contracts';

import { Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { LeadService, toLeadView, type LeadView } from './lead.service';
import { type LeadStatus } from './lead.repository';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

/**
 * crm — lid (docs/10). ⚠️ Ommaviy callback (POST) + xodim voronka (lead:read_all).
 * ⚠️ Lid boshqaruvi (o'zgartirish) `lead:read_all` bilan — bu panel MENEJER
 *    funksiyasi (voronka nazorati). Sotuvchi tayinlash keyingi ish.
 */
@ApiTags('crm: leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leads: LeadService) {}

  @Post()
  @Public()
  // ⚠️ Ommaviy forma — spam himoyasi (docs/04 §8): daqiqada 10 ta.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Callback so‘rovi (storefront) — lid yaratadi' })
  async create(@Body() dto: CreateLeadDto): Promise<LeadView> {
    const lead = await this.leads.create(dto);
    return toLeadView(lead);
  }

  @Get()
  @RequirePermission('lead:read_all')
  @ApiOperation({ summary: 'Lidlar ro‘yxati (cursor + status filtri)' })
  async list(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<LeadView>> {
    const page = await this.leads.list({
      ...(status !== undefined && { status: status as LeadStatus }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items.map(toLeadView),
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Get('funnel')
  @RequirePermission('lead:read_all')
  @ApiOperation({ summary: 'Voronka statistikasi (holat bo‘yicha son)' })
  funnel(): Promise<Record<string, number>> {
    return this.leads.funnelStats();
  }

  @Patch(':id')
  @RequirePermission('lead:read_all')
  @ApiOperation({ summary: 'Lidni yangilash (holat/izoh/tayinlash)' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateLeadDto,
  ): Promise<LeadView> {
    const lead = await this.leads.update(id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
      ...(dto.estimatedAmount !== undefined && { estimatedAmount: BigInt(dto.estimatedAmount) }),
      ...(dto.lostReason !== undefined && { lostReason: dto.lostReason }),
    });
    return toLeadView(lead);
  }
}
