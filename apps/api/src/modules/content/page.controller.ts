import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { ContentService } from './content.service';
import { type PageRow } from './content.repository';
import { UpsertPageDto } from './dto/content.dto';

/** pages — statik sahifalar (О компании, Возврат…). Ommaviy o'qish; admin content:write. */
@ApiTags('content: pages')
@Controller('pages')
export class PageController {
  constructor(private readonly content: ContentService) {}

  @Get('admin')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Admin: barcha sahifalar' })
  listAll(): Promise<PageRow[]> {
    return this.content.listPages();
  }

  @Post()
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Sahifa yaratish/yangilash (slug bo‘yicha upsert)' })
  upsert(@Body() dto: UpsertPageDto): Promise<PageRow> {
    return this.content.upsertPage(dto);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Nashr etilgan sahifa (slug) — storefront' })
  getBySlug(@Param('slug') slug: string): Promise<PageRow> {
    return this.content.getPublishedPage(slug);
  }
}
