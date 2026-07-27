import { Injectable } from '@nestjs/common';

import { AuditService } from '../../../shared/audit/audit.service';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { toJson } from '../../../shared/json';
import { BusinessRuleError, NotFoundError } from '../../../core/errors/domain.error';
import { MediaRepository, type MediaRow } from './media.repository';
import { type CreateUploadDto, type ReorderMediaDto, type UpdateMediaDto } from './dto/media.dto';

export interface UploadTicket {
  readonly mediaId: string;
  readonly uploadUrl: string;
  readonly key: string;
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
};

@Injectable()
export class MediaService {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: StorageService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
  ) {}

  private ext(contentType: string, filename: string): string {
    return EXT_BY_TYPE[contentType] ?? filename.split('.').pop() ?? 'bin';
  }

  /**
   * Yuklash uchun presigned URL. Media yozuvi PENDING holatda yaratiladi;
   * mijoz to'g'ridan-to'g'ri S3'ga yuklaydi, keyin `confirm` chaqiradi.
   */
  async createUpload(dto: CreateUploadDto): Promise<UploadTicket> {
    if (dto.productId === undefined && dto.variantId === undefined) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'productId yoki variantId kerak');
    }

    // ⚠️ ID Prisma tomonidan UUID v7 sifatida generatsiya qilinadi (randomUUID
    //    v4 beradi va ParseUUIDPipe(v7) uni rad etadi). Shuning uchun avval
    //    yaratamiz, keyin id'dan kalit quramiz.
    const media = await this.repo.create({
      kind: dto.kind,
      url: '',
      ...(dto.alt !== undefined && { alt: toJson(dto.alt) }),
      ...(dto.productId !== undefined && { product: { connect: { id: dto.productId } } }),
      ...(dto.variantId !== undefined && { variant: { connect: { id: dto.variantId } } }),
    });

    const key = `media/${media.id}/original.${this.ext(dto.contentType, dto.filename)}`;
    await this.repo.update(media.id, {
      url: this.storage.publicUrl(key),
      derivatives: toJson({ original: key, status: 'PENDING' }),
    });

    const uploadUrl = await this.storage.presignPut(key, dto.contentType);
    await this.audit.record({
      action: 'MEDIA_UPLOAD_REQUEST',
      resourceType: 'Media',
      resourceId: media.id,
    });
    return { mediaId: media.id, uploadUrl, key };
  }

  /** Yuklash tugadi — rasm bo'lsa qayta ishlash job'i navbatga qo'yiladi. */
  async confirm(mediaId: string): Promise<MediaRow> {
    const media = await this.repo.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }
    if (media.kind === 'IMAGE') {
      // Outbox → worker MediaUploaded'ni qayta ishlaydi (at-least-once).
      await this.outbox.enqueue({
        eventType: 'MediaUploaded',
        aggregateType: 'Media',
        aggregateId: mediaId,
        payload: {},
      });
      await this.repo.update(mediaId, {
        derivatives: toJson(this.mergeStatus(media, 'PROCESSING')),
      });
    }
    return media;
  }

  private mergeStatus(media: MediaRow, status: string): unknown {
    const current = (media.derivatives ?? {}) as Record<string, unknown>;
    return { ...current, status };
  }

  listForProduct(productId: string): Promise<MediaRow[]> {
    return this.repo.listForProduct(productId);
  }

  async setPrimary(mediaId: string): Promise<void> {
    const media = await this.repo.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }
    await this.repo.setPrimary(mediaId, {
      ...(media.productId !== null && { productId: media.productId }),
      ...(media.variantId !== null && { variantId: media.variantId }),
    });
    await this.audit.record({
      action: 'MEDIA_SET_PRIMARY',
      resourceType: 'Media',
      resourceId: mediaId,
    });
  }

  async reorder(dto: ReorderMediaDto): Promise<void> {
    for (const [i, id] of dto.order.entries()) {
      await this.repo.update(id, { sortOrder: i });
    }
  }

  async update(mediaId: string, dto: UpdateMediaDto): Promise<MediaRow> {
    const media = await this.repo.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }
    return await this.repo.update(mediaId, {
      ...(dto.alt !== undefined && { alt: toJson(dto.alt) }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
  }

  async remove(mediaId: string): Promise<void> {
    const media = await this.repo.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Media', mediaId);
    }
    // S3 obyektlarini o'chirish best-effort (asosiy — DB yozuvi).
    const derivatives = (media.derivatives ?? {}) as { original?: string };
    if (typeof derivatives.original === 'string') {
      await this.storage.deleteObject(derivatives.original).catch(() => undefined);
    }
    await this.repo.delete(mediaId);
    await this.audit.record({
      action: 'MEDIA_DELETE',
      resourceType: 'Media',
      resourceId: mediaId,
    });
  }
}
