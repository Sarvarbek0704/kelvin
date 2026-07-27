import { Injectable, Logger } from '@nestjs/common';

import { MeiliService } from '../../../shared/search/meili.service';
import {
  buildSearchDocument,
  type IndexableProduct,
  type IndexableVariant,
} from '../../../core/search/search-document';
import { ProductRepository, type ProductWithVariants } from './product.repository';

/**
 * Qidiruv indekslovchisi — mahsulotni Meilisearch'ga yozadi.
 *
 * Katalog modulida joylashadi (ProductRepository shu yerda) va shared MeiliService
 * orqali yozadi. Worker outbox event'larida chaqiradi (at-least-once, upsert).
 *
 * ⚠️ Faqat ACTIVE mahsulotlar indekslanadi; boshqa holatlar/o'chirilganlar
 *    indeksdan olib tashlanadi. docs/05 §3.3
 */
@Injectable()
export class SearchIndexerService {
  private readonly logger = new Logger(SearchIndexerService.name);

  constructor(
    private readonly repo: ProductRepository,
    private readonly meili: MeiliService,
  ) {}

  async indexProduct(productId: string): Promise<void> {
    const product = await this.repo.findByIdWithVariants(productId);
    if (product?.status !== 'ACTIVE') {
      // Nashr qilinmagan yoki o'chirilgan → indeksdan olib tashlash.
      await this.meili.remove(productId).catch(() => undefined);
      return;
    }
    const doc = buildSearchDocument(this.toIndexable(product));
    await this.meili.upsert([doc as unknown as Record<string, unknown>]);
    this.logger.log(`Indekslandi: ${product.slug} (${String(doc.variant_count)} variant)`);
  }

  async removeProduct(productId: string): Promise<void> {
    await this.meili.remove(productId).catch(() => undefined);
  }

  /**
   * Butun indeksni PostgreSQL'dan qayta qurish (docs/05 §3.3: "Index yo'qolsa
   * qayta quriladi"). Barcha ACTIVE mahsulotni indekslaydi. Meili tayyor bo'lishini
   * ta'minlaydi (ensureIndex). @returns indekslangan mahsulotlar soni.
   */
  async reindexAll(): Promise<{ indexed: number }> {
    await this.meili.ensureIndex();
    const ids = await this.repo.findAllActiveIds();
    for (const id of ids) {
      await this.indexProduct(id);
    }
    this.logger.log(`Qidiruv indeksi qayta qurildi: ${String(ids.length)} mahsulot`);
    return { indexed: ids.length };
  }

  private toIndexable(product: ProductWithVariants): IndexableProduct {
    const asLoc = (json: unknown): IndexableProduct['name'] => json ?? {};

    // Media allaqachon isPrimary → sortOrder bo'yicha saralangan (repository) — birinchisi asosiy.
    const [primary] = product.media;
    const primaryImage: IndexableProduct['primaryImage'] =
      primary === undefined
        ? null
        : {
            url: primary.url,
            derivatives: (primary.derivatives ?? null) as Record<string, string> | null,
            alt: (primary.alt ?? null) as IndexableProduct['name'] | null,
          };

    const variants: IndexableVariant[] = product.variants.map((v) => ({
      sku: v.sku,
      axisValues: (v.axisValues ?? {}) as Record<string, string>,
      ipSatisfies: v.ipSatisfies,
      colorTemperature: v.colorTemperature,
      socketType: v.socketType,
      luminousFlux: v.luminousFlux,
      power: v.power !== null ? Number(v.power) : null,
      cri: v.cri,
      voltage: v.voltage,
      beamAngle: v.beamAngle,
      dimmable: v.dimmable,
      lightSource: v.lightSource,
      mountType: v.mountType,
    }));

    return {
      id: product.id,
      slug: product.slug,
      status: product.status,
      name: asLoc(product.name),
      brand: product.brand,
      isFragile: product.isFragile,
      category: {
        slug: product.category.slug,
        path: product.category.path,
        name: asLoc(product.category.name),
      },
      variants,
      primaryImage,
    };
  }
}
