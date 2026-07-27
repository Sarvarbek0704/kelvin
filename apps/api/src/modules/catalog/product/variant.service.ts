import { Injectable } from '@nestjs/common';

import { AuditService } from '../../../shared/audit/audit.service';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { toJson } from '../../../shared/json';
import { BusinessRuleError, NotFoundError } from '../../../core/errors/domain.error';
import { computeIpSatisfies, isValidIpCode } from '../../../core/catalog/ip-rating';
import {
  buildCombinations,
  buildSku,
  combinationKey,
  TooManyCombinationsError,
  type AxisCombination,
  type VariantAxis,
} from '../../../core/catalog/variant-matrix';
import { AttributeRepository } from '../attribute/attribute.repository';
import { ProductRepository, type ProductWithVariants } from './product.repository';
import { type GenerateVariantsDto, type UpdateVariantDto } from './dto/product.dto';

@Injectable()
export class VariantService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly attributes: AttributeRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  private skuBase(slug: string): string {
    return (slug.split('-')[0] ?? slug).replace(/[^a-z0-9]/gi, '').toUpperCase() || 'SKU';
  }

  /**
   * Variant matritsasini generatsiya qiladi (DESTRUKTIV EMAS).
   *
   * - Faqat MAVJUD kombinatsiyalar saqlanadi (excludedKeys chiqariladi).
   * - Mavjud variantlar (qoldiq/buyurtma tarixi bor) TEGILMAYDI.
   * - Endi kerak bo'lmagan kombinatsiyalar SOFT-DELETE qilinadi (hard delete
   *   hech qachon — OrderItem bog'langan).
   *
   * docs/05-catalog-and-search.md §1.3
   */
  async generate(productId: string, dto: GenerateVariantsDto): Promise<ProductWithVariants> {
    const product = await this.repo.findById(productId);
    if (!product) {
      throw new NotFoundError('Mahsulot', productId);
    }

    // --- 1. O'qlarni validatsiya (attribute variant o'qi + qiymatlar mavjud) --
    const axes: VariantAxis[] = [];
    for (const axis of dto.axes) {
      const attr = await this.attributes.findByCode(axis.attributeCode);
      if (!attr) {
        throw new NotFoundError('Atribut', axis.attributeCode);
      }
      if (!attr.isVariantAxis) {
        throw new BusinessRuleError(
          'INCOMPATIBLE_COMPONENTS',
          `"${axis.attributeCode}" variant o'qi emas (isVariantAxis=false)`,
        );
      }
      const known = new Set(attr.values.map((v) => v.code));
      for (const code of axis.valueCodes) {
        if (!known.has(code)) {
          throw new BusinessRuleError(
            'VALIDATION_FAILED',
            `"${axis.attributeCode}" da "${code}" qiymati yo'q`,
          );
        }
      }
      axes.push({ attributeCode: axis.attributeCode, valueCodes: axis.valueCodes });
    }

    // --- 2. Dekart ko'paytmasi (guard rail bilan) ---------------------------
    let combinations: AxisCombination[];
    try {
      combinations = buildCombinations(axes);
    } catch (err) {
      if (err instanceof TooManyCombinationsError) {
        throw new BusinessRuleError('VALIDATION_FAILED', err.message);
      }
      throw err;
    }

    const excluded = new Set(dto.excludedKeys ?? []);
    const desired = combinations.filter((c) => !excluded.has(combinationKey(c)));
    const desiredKeys = new Set(desired.map(combinationKey));
    const axisOrder = axes.map((a) => a.attributeCode);
    const base = this.skuBase(product.slug);

    // --- 3. Mavjud variantlar bilan solishtirish ----------------------------
    const existing = await this.repo.activeVariants(productId);
    const existingByKey = new Map<string, (typeof existing)[number]>();
    for (const v of existing) {
      existingByKey.set(combinationKey({ values: v.axisValues as Record<string, string> }), v);
    }

    let created = 0;
    let removed = 0;

    await this.repo.transaction(async (tx) => {
      // Yangi kombinatsiyalar
      for (const combo of desired) {
        const key = combinationKey(combo);
        if (existingByKey.has(key)) {
          continue; // mavjud — tegilmaydi
        }
        const sku = buildSku(base, combo, axisOrder, (_attr, val) => val);
        const ipCode = combo.values.ip_rating;
        const hasIp = typeof ipCode === 'string' && isValidIpCode(ipCode);
        await tx.productVariant.create({
          data: {
            productId,
            sku,
            axisValues: toJson(combo.values),
            ipSatisfies: hasIp ? computeIpSatisfies(ipCode) : [],
            ...(hasIp && { ipRating: ipCode }),
          },
        });
        created += 1;
      }

      // Kerak bo'lmagan kombinatsiyalar — soft-delete
      for (const [key, variant] of existingByKey) {
        if (!desiredKeys.has(key)) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { deletedAt: new Date(), isActive: false },
          });
          removed += 1;
        }
      }

      // O'qlar sxemasini mahsulotга saqlaymiz
      await tx.product.update({
        where: { id: productId },
        data: { variantAxes: toJson(axes) },
      });

      // Outbox — search reindex uchun (Faza 2)
      await this.outbox.enqueue(
        {
          eventType: 'ProductVariantsGenerated',
          aggregateType: 'Product',
          aggregateId: productId,
          payload: { created, removed, total: desired.length },
        },
        tx,
      );
    });

    await this.audit.record({
      action: 'PRODUCT_VARIANTS_GENERATE',
      resourceType: 'Product',
      resourceId: productId,
      after: { created, removed, total: desired.length },
    });

    const result = await this.repo.findByIdWithVariants(productId);
    if (!result) {
      throw new NotFoundError('Mahsulot', productId);
    }
    return result;
  }

  /** Variant atributlarini yangilash — ipRating berilsa ipSatisfies qayta hisoblanadi. */
  async updateVariant(variantId: string, dto: UpdateVariantDto): Promise<void> {
    const variant = await this.repo.findVariantById(variantId);
    if (!variant) {
      throw new NotFoundError('Variant', variantId);
    }

    // ⚠️ IP MATERIALIZATSIYASI: ipRating o'zgarsa, ipSatisfies qayta hisoblanadi.
    await this.repo.updateVariant(variantId, {
      ...(dto.barcode !== undefined && { barcode: dto.barcode }),
      ...(dto.luminousFlux !== undefined && { luminousFlux: dto.luminousFlux }),
      ...(dto.colorTemperature !== undefined && { colorTemperature: dto.colorTemperature }),
      ...(dto.cri !== undefined && { cri: dto.cri }),
      ...(dto.socketType !== undefined && { socketType: dto.socketType }),
      ...(dto.voltage !== undefined && { voltage: dto.voltage }),
      ...(dto.dimmable !== undefined && { dimmable: dto.dimmable }),
      ...(dto.beamAngle !== undefined && { beamAngle: dto.beamAngle }),
      ...(dto.bulbsIncluded !== undefined && { bulbsIncluded: dto.bulbsIncluded }),
      ...(dto.lightSource !== undefined && { lightSource: dto.lightSource }),
      ...(dto.attributes !== undefined && { attributes: toJson(dto.attributes) }),
      ...(dto.weightGrams !== undefined && { weightGrams: dto.weightGrams }),
      ...(dto.costPriceAmount !== undefined && { costPriceAmount: BigInt(dto.costPriceAmount) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.ipRating !== undefined && {
        ipRating: dto.ipRating,
        ipSatisfies: computeIpSatisfies(dto.ipRating),
      }),
    });
    await this.audit.record({
      action: 'PRODUCT_VARIANT_UPDATE',
      resourceType: 'ProductVariant',
      resourceId: variantId,
      ...(dto.ipRating !== undefined && { after: { ipRating: dto.ipRating } }),
    });
  }
}
