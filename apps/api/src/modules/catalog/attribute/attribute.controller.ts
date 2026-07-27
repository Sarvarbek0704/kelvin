import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, RequirePermission } from '../../../shared/auth/auth.decorators';
import { AttributeService } from './attribute.service';
import { type AttributeWithValues } from './attribute.repository';
import {
  CreateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto,
} from './dto/attribute.dto';

@ApiTags('catalog: attributes')
@Controller('attributes')
export class AttributeController {
  constructor(private readonly service: AttributeService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Atributlar reestri (qiymatlari bilan)' })
  list(): Promise<AttributeWithValues[]> {
    return this.service.list();
  }

  @Get(':code')
  @Public()
  @ApiOperation({ summary: 'Kod bo‘yicha atribut' })
  byCode(@Param('code') code: string): Promise<AttributeWithValues> {
    return this.service.getByCode(code);
  }

  @Post()
  @RequirePermission('attribute:write')
  @ApiOperation({ summary: 'Atribut yaratish' })
  create(@Body() dto: CreateAttributeDto): Promise<AttributeWithValues> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermission('attribute:write')
  @ApiOperation({ summary: 'Atributni yangilash' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateAttributeDto,
  ): Promise<AttributeWithValues> {
    return this.service.update(id, dto);
  }

  @Post(':id/values')
  @RequirePermission('attribute:write')
  @ApiOperation({ summary: 'Atributga qiymat qo‘shish' })
  addValue(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: CreateAttributeValueDto,
  ): Promise<AttributeWithValues> {
    return this.service.addValue(id, dto);
  }

  @Patch('values/:valueId')
  @RequirePermission('attribute:write')
  @ApiOperation({ summary: 'Atribut qiymatini yangilash' })
  async updateValue(
    @Param('valueId', new ParseUUIDPipe({ version: '7' })) valueId: string,
    @Body() dto: UpdateAttributeValueDto,
  ): Promise<{ ok: true }> {
    await this.service.updateValue(valueId, dto);
    return { ok: true };
  }
}
