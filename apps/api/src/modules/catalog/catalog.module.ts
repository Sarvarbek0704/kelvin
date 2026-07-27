import { Module } from '@nestjs/common';

import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { CategoryRepository } from './category/category.repository';
import { AttributeController } from './attribute/attribute.controller';
import { AttributeService } from './attribute/attribute.service';
import { AttributeRepository } from './attribute/attribute.repository';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { ProductRepository } from './product/product.repository';
import { VariantService } from './product/variant.service';
import { SearchIndexerService } from './product/search-indexer.service';
import { MediaController } from './media/media.controller';
import { MediaService } from './media/media.service';
import { MediaRepository } from './media/media.repository';
import { MediaProcessingService } from './media/media-processing.service';
import { ImageProcessor } from './media/image-processor';
import { CATALOG_PORT } from './catalog.port';

/**
 * catalog — mahsulot, variant, atribut, kategoriya (docs/02 §5 №2).
 *
 * Nozik joyi: variant matritsasi portlashi (§1.3) va IP qisman-tartib
 * materializatsiyasi (core/catalog). docs/05-catalog-and-search.md
 */
@Module({
  controllers: [CategoryController, AttributeController, ProductController, MediaController],
  providers: [
    CategoryRepository,
    CategoryService,
    AttributeRepository,
    AttributeService,
    ProductRepository,
    ProductService,
    VariantService,
    SearchIndexerService,
    MediaRepository,
    MediaService,
    MediaProcessingService,
    ImageProcessor,
    { provide: CATALOG_PORT, useExisting: ProductService },
  ],
  exports: [
    CategoryService,
    AttributeService,
    ProductService,
    MediaProcessingService,
    SearchIndexerService,
    CATALOG_PORT,
  ],
})
export class CatalogModule {}
