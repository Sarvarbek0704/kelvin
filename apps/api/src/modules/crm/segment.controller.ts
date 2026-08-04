import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

import { IsLocalizedText, LocalizedTextDto } from '../../shared/dto/localized-text.dto';
import { RequirePermission } from '../../shared/auth/auth.decorators';
import { SegmentService, type MemberView } from './segment.service';
import { type MemberRow, type SegmentRow } from './segment.repository';

class CreateSegmentDto {
  @Matches(/^[a-z0-9-]+$/) @MaxLength(60) code!: string;
  @IsObject() @IsLocalizedText() name!: LocalizedTextDto;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

class AddMemberDto {
  @IsUUID('7') customerId!: string;
}

/** segments — mijoz segmentatsiya + RFM (docs/10 §9.1, §9.3). Xodim: segment:write. */
@ApiTags('crm: segments')
@Controller('segments')
export class SegmentController {
  constructor(private readonly segments: SegmentService) {}

  @Get()
  @RequirePermission('segment:write')
  @ApiOperation({ summary: 'Segmentlar (a‘zolar soni bilan)' })
  list(): Promise<SegmentRow[]> {
    return this.segments.listSegments();
  }

  @Post()
  @RequirePermission('segment:write')
  @ApiOperation({ summary: 'Qo‘lda segment yaratish' })
  create(@Body() dto: CreateSegmentDto): Promise<SegmentRow> {
    return this.segments.createSegment(dto);
  }

  @Post('rfm/recompute')
  @RequirePermission('segment:write')
  @ApiOperation({ summary: '⚠️ RFM qayta hisoblash (rfm-auto segment a‘zolari)' })
  recomputeRfm(): Promise<{ segmentId: string; memberCount: number }> {
    return this.segments.recomputeRfm();
  }

  @Get(':id/members')
  @RequirePermission('segment:write')
  @ApiOperation({ summary: 'Segment a‘zolari (RFM skori + aloqa ma‘lumoti bilan)' })
  members(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<MemberView[]> {
    return this.segments.listMembers(id);
  }

  @Post(':id/members')
  @RequirePermission('segment:write')
  @ApiOperation({ summary: 'Segmentga mijoz qo‘shish (qo‘lda)' })
  addMember(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string, @Body() dto: AddMemberDto): Promise<MemberRow> {
    return this.segments.addMember(id, dto.customerId);
  }
}
