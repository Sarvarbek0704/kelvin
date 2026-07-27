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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, RequirePermission } from '../../../shared/auth/auth.decorators';
import { CategoryService, type CategoryNode } from './category.service';
import { type CategoryRow } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('catalog: categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Kategoriya daraxti' })
  tree(@Query('activeOnly') activeOnly?: string): Promise<CategoryNode[]> {
    return this.service.getTree(activeOnly !== 'false');
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Slug bo‘yicha kategoriya' })
  bySlug(@Param('slug') slug: string): Promise<CategoryRow> {
    return this.service.getBySlug(slug);
  }

  @Post()
  @RequirePermission('category:write')
  @ApiOperation({ summary: 'Kategoriya yaratish' })
  create(@Body() dto: CreateCategoryDto): Promise<CategoryRow> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermission('category:write')
  @ApiOperation({ summary: 'Kategoriyani yangilash' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryRow> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('category:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Kategoriyani o‘chirish (soft)' })
  remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
