import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, RequirePermission } from '../../../shared/auth/auth.decorators';
import { MediaService, type UploadTicket } from './media.service';
import { type MediaRow } from './media.repository';
import { CreateUploadDto, ReorderMediaDto, UpdateMediaDto } from './dto/media.dto';

@ApiTags('catalog: media')
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get('product/:productId')
  @Public()
  @ApiOperation({ summary: 'Mahsulot media galereyasi' })
  forProduct(
    @Param('productId', new ParseUUIDPipe({ version: '7' })) productId: string,
  ): Promise<MediaRow[]> {
    return this.service.listForProduct(productId);
  }

  @Post('upload-url')
  @RequirePermission('media:write')
  @ApiOperation({ summary: 'Yuklash uchun presigned URL (mijoz to‘g‘ridan S3‘ga yuklaydi)' })
  createUpload(@Body() dto: CreateUploadDto): Promise<UploadTicket> {
    return this.service.createUpload(dto);
  }

  @Post(':id/confirm')
  @RequirePermission('media:write')
  @ApiOperation({ summary: 'Yuklash tugadi — rasm bo‘lsa qayta ishlash boshlanadi' })
  confirm(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<MediaRow> {
    return this.service.confirm(id);
  }

  @Post(':id/primary')
  @RequirePermission('media:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Asosiy rasm qilish' })
  setPrimary(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<void> {
    return this.service.setPrimary(id);
  }

  @Post('reorder')
  @RequirePermission('media:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Galereya tartibini o‘zgartirish' })
  reorder(@Body() dto: ReorderMediaDto): Promise<void> {
    return this.service.reorder(dto);
  }

  @Patch(':id')
  @RequirePermission('media:write')
  @ApiOperation({ summary: 'Media (alt/tartib) yangilash' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<MediaRow> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('media:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Media o‘chirish' })
  remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
