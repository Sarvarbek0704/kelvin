import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type CursorPage } from '@kelvin/contracts';

import { Public, RequirePermission } from '../../../shared/auth/auth.decorators';
import { ProductService } from './product.service';
import { VariantService } from './variant.service';
import { SearchIndexerService } from './search-indexer.service';
import {
  type ProductListRow,
  type ProductRow,
  type ProductWithVariants,
} from './product.repository';
import {
  CreateProductDto,
  GenerateVariantsDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/product.dto';

@ApiTags('catalog: products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly products: ProductService,
    private readonly variants: VariantService,
    private readonly indexer: SearchIndexerService,
  ) {}

  // --- Ommaviy o'qish -------------------------------------------------------

  @Get()
  @Public()
  @ApiOperation({ summary: 'Mahsulotlar ro‘yxati (cursor pagination)' })
  list(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<ProductListRow>> {
    return this.products.listPublic({
      ...(categoryId !== undefined && { categoryId }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
  }

  // --- Admin (⚠️ :slug'dan OLDIN — aks holda 'admin' slug sifatida ushlanadi) --

  @Get('lookup')
  @RequirePermission('stock:read')
  @ApiOperation({ summary: 'Shtrix-kod yoki SKU bo‘yicha variant (skaner/POS)' })
  lookup(@Query('code') code?: string): Promise<unknown> {
    if (code === undefined || code.trim() === '') {
      throw new BadRequestException('code parametri kerak');
    }
    return this.products.lookupByCode(code.trim());
  }

  @Post('reindex')
  @RequirePermission('product:publish')
  @ApiOperation({ summary: 'Qidiruv indeksini PostgreSQL’dan qayta qurish (docs/05 §3.3)' })
  reindex(): Promise<{ indexed: number }> {
    return this.indexer.reindexAll();
  }

  @Get('admin')
  @RequirePermission('product:read_draft')
  @ApiOperation({ summary: 'Admin: barcha mahsulotlar (draft ham)' })
  adminList(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<ProductListRow>> {
    return this.products.listAdmin({
      ...(categoryId !== undefined && { categoryId }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
  }

  @Get('admin/:id')
  @RequirePermission('product:read_draft')
  @ApiOperation({ summary: 'Admin: mahsulot (draft ham)' })
  adminGet(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ProductWithVariants> {
    return this.products.getForAdmin(id);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Slug bo‘yicha mahsulot (variantlari bilan)' })
  bySlug(@Param('slug') slug: string): Promise<ProductWithVariants> {
    return this.products.getPublicBySlug(slug);
  }

  @Post()
  @RequirePermission('product:write')
  @ApiOperation({ summary: 'Mahsulot yaratish (DRAFT)' })
  create(@Body() dto: CreateProductDto): Promise<ProductRow> {
    return this.products.create(dto);
  }

  @Patch(':id')
  @RequirePermission('product:write')
  @ApiOperation({ summary: 'Mahsulotni yangilash' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductRow> {
    return this.products.update(id, dto);
  }

  @Post(':id/publish')
  @RequirePermission('product:publish')
  @ApiOperation({ summary: 'Mahsulotni nashr qilish (to‘liqlik tekshiriladi)' })
  publish(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<ProductRow> {
    return this.products.publish(id);
  }

  // --- Variant matritsasi ---------------------------------------------------

  @Post(':id/variants/generate')
  @RequirePermission('product:write')
  @ApiOperation({ summary: 'Variant matritsasini generatsiya qilish (destruktiv emas)' })
  generate(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: GenerateVariantsDto,
  ): Promise<ProductWithVariants> {
    return this.variants.generate(id, dto);
  }

  @Patch('variants/:variantId')
  @RequirePermission('product:write')
  @ApiOperation({ summary: 'Variant atributlarini yangilash (ipSatisfies avto)' })
  async updateVariant(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<{ ok: true }> {
    await this.variants.updateVariant(variantId, dto);
    return { ok: true };
  }
}
