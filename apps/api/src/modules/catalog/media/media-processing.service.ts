import { Injectable, Logger } from '@nestjs/common';

import { StorageService } from '../../../shared/storage/storage.service';
import { toJson } from '../../../shared/json';
import { MediaRepository } from './media.repository';
import { ImageProcessor } from './image-processor';

interface DerivativeDescriptor {
  format: string;
  width: number;
  key: string;
  url: string;
}

/**
 * Rasm qayta ishlash — BullMQ job (worker'da chaqiriladi).
 *
 * ⚠️ IDEMPOTENT: qayta ishlash mavjud derivativlarni qayta yozadi (at-least-once).
 */
@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);

  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: StorageService,
    private readonly processor: ImageProcessor,
  ) {}

  async process(mediaId: string): Promise<void> {
    const media = await this.repo.findById(mediaId);
    if (media?.kind !== 'IMAGE') {
      return;
    }
    const meta = (media.derivatives ?? {}) as { original?: string };
    const originalKey = meta.original;
    if (typeof originalKey !== 'string') {
      this.logger.warn(`Media ${mediaId}: original kalit yo'q`);
      return;
    }

    const input = await this.storage.getObject(originalKey);
    const processed = await this.processor.process(input);

    const sizes: DerivativeDescriptor[] = [];
    for (const d of processed.derivatives) {
      const key = `media/${mediaId}/${String(d.width)}.${d.format}`;
      await this.storage.putObject(key, d.buffer, d.contentType);
      sizes.push({ format: d.format, width: d.width, key, url: this.storage.publicUrl(key) });
    }

    // Standart URL — eng katta webp (yoki mavjud birinchisi).
    const preferred =
      sizes.filter((s) => s.format === 'webp').sort((a, b) => b.width - a.width)[0] ?? sizes[0];

    await this.repo.update(mediaId, {
      ...(preferred !== undefined && { url: preferred.url }),
      derivatives: toJson({
        original: originalKey,
        status: 'READY',
        lqip: processed.lqip,
        width: processed.original.width,
        height: processed.original.height,
        sizes,
      }),
    });
    this.logger.log(`Media ${mediaId} qayta ishlandi: ${String(sizes.length)} derivativ`);
  }
}
