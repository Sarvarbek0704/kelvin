import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

import { IsLocalizedText, LocalizedTextDto } from '../../shared/dto/localized-text.dto';
import { Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { ContentService } from './content.service';
import { type BannerRow } from './content.repository';

class CreateBannerDto {
  @IsObject() @IsLocalizedText() title!: LocalizedTextDto;
  @IsUrl({ require_tld: false }) imageUrl!: string;
  @IsOptional() @IsUrl({ require_tld: false }) linkUrl?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

class UpdateBannerDto {
  @IsOptional() @IsObject() @IsLocalizedText() title?: LocalizedTextDto;
  @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @IsOptional() @IsUrl({ require_tld: false }) linkUrl?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/** banners — reklama bloklari (docs/10 §9.5). Ommaviy faol; admin content:write. */
@ApiTags('content: banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Faol bannerlar (pozitsiya bo‘yicha) — storefront' })
  listActive(@Query('position') position?: string): Promise<BannerRow[]> {
    return this.content.listActiveBanners(position);
  }

  @Get('admin')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Admin: barcha bannerlar' })
  listAll(): Promise<BannerRow[]> {
    return this.content.listAllBanners();
  }

  @Post()
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Banner yaratish' })
  create(@Body() dto: CreateBannerDto): Promise<BannerRow> {
    return this.content.createBanner(dto);
  }

  @Patch(':id')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Bannerni yangilash' })
  update(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string, @Body() dto: UpdateBannerDto): Promise<BannerRow> {
    return this.content.updateBanner(id, dto);
  }

  @Delete(':id')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Bannerni o‘chirish' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<{ ok: true }> {
    await this.content.deleteBanner(id);
    return { ok: true };
  }
}
