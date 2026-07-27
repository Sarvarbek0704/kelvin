import { Injectable } from '@nestjs/common';

import { AuditService } from '../../../shared/audit/audit.service';
import { toJson } from '../../../shared/json';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../../core/errors/domain.error';
import { isValidIpCode } from '../../../core/catalog/ip-rating';
import { AttributeRepository, type AttributeWithValues } from './attribute.repository';
import {
  type CreateAttributeDto,
  type CreateAttributeValueDto,
  type UpdateAttributeDto,
  type UpdateAttributeValueDto,
} from './dto/attribute.dto';

@Injectable()
export class AttributeService {
  constructor(
    private readonly repo: AttributeRepository,
    private readonly audit: AuditService,
  ) {}

  list(): Promise<AttributeWithValues[]> {
    return this.repo.findAll();
  }

  async getByCode(code: string): Promise<AttributeWithValues> {
    const attr = await this.repo.findByCode(code);
    if (!attr) {
      throw new NotFoundError('Atribut', code);
    }
    return attr;
  }

  async create(dto: CreateAttributeDto): Promise<AttributeWithValues> {
    if (await this.repo.findByCode(dto.code)) {
      throw new ConflictError(`Bu atribut kodi band: ${dto.code}`, { code: dto.code });
    }
    // ⚠️ IP DARAJASI ORDINAL EMAS — qisman tartib. ipSatisfies materializatsiyasi
    //    ishlatiladi (docs/03 §3.3). ORDINAL rank IP uchun noto'g'ri javob beradi.
    if (dto.code === 'ip_rating' && dto.type === 'ORDINAL') {
      throw new BusinessRuleError(
        'INCOMPATIBLE_COMPONENTS',
        'ip_rating ORDINAL bo‘la olmaydi — u qisman tartib (ipSatisfies materializatsiyasi)',
      );
    }

    const created = await this.repo.create({
      code: dto.code,
      type: dto.type,
      name: toJson(dto.name),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.isFilterable !== undefined && { isFilterable: dto.isFilterable }),
      ...(dto.isVariantAxis !== undefined && { isVariantAxis: dto.isVariantAxis }),
      ...(dto.isComparable !== undefined && { isComparable: dto.isComparable }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
    await this.audit.record({
      action: 'ATTRIBUTE_CREATE',
      resourceType: 'Attribute',
      resourceId: created.id,
      after: { code: created.code, type: created.type },
    });
    return created;
  }

  async update(id: string, dto: UpdateAttributeDto): Promise<AttributeWithValues> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Atribut', id);
    }
    const updated = await this.repo.update(id, {
      ...(dto.name !== undefined && { name: toJson(dto.name) }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.isFilterable !== undefined && { isFilterable: dto.isFilterable }),
      ...(dto.isVariantAxis !== undefined && { isVariantAxis: dto.isVariantAxis }),
      ...(dto.isComparable !== undefined && { isComparable: dto.isComparable }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
    await this.audit.record({
      action: 'ATTRIBUTE_UPDATE',
      resourceType: 'Attribute',
      resourceId: id,
    });
    return updated;
  }

  async addValue(attributeId: string, dto: CreateAttributeValueDto): Promise<AttributeWithValues> {
    const attr = await this.repo.findById(attributeId);
    if (!attr) {
      throw new NotFoundError('Atribut', attributeId);
    }
    // IP qiymatlari to'g'ri formatda bo'lsin (materializatsiya ishlashi uchun).
    if (attr.code === 'ip_rating' && !isValidIpCode(dto.code)) {
      throw new BusinessRuleError('VALIDATION_FAILED', `Yaroqsiz IP kodi: ${dto.code}`);
    }
    if (attr.values.some((v) => v.code === dto.code)) {
      throw new ConflictError(`Bu qiymat kodi band: ${dto.code}`, { code: dto.code });
    }

    await this.repo.createValue({
      attribute: { connect: { id: attributeId } },
      code: dto.code,
      label: toJson(dto.label),
      ...(dto.rank !== undefined && { rank: dto.rank }),
      ...(dto.hexColor !== undefined && { hexColor: dto.hexColor }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
    await this.audit.record({
      action: 'ATTRIBUTE_VALUE_CREATE',
      resourceType: 'Attribute',
      resourceId: attributeId,
      after: { valueCode: dto.code },
    });
    return await this.getById(attributeId);
  }

  async updateValue(valueId: string, dto: UpdateAttributeValueDto): Promise<void> {
    const value = await this.repo.findValue(valueId);
    if (!value) {
      throw new NotFoundError('Atribut qiymati', valueId);
    }
    await this.repo.updateValue(valueId, {
      ...(dto.label !== undefined && { label: toJson(dto.label) }),
      ...(dto.rank !== undefined && { rank: dto.rank }),
      ...(dto.hexColor !== undefined && { hexColor: dto.hexColor }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
    await this.audit.record({
      action: 'ATTRIBUTE_VALUE_UPDATE',
      resourceType: 'AttributeValue',
      resourceId: valueId,
    });
  }

  private async getById(id: string): Promise<AttributeWithValues> {
    const attr = await this.repo.findById(id);
    if (!attr) {
      throw new NotFoundError('Atribut', id);
    }
    return attr;
  }
}
