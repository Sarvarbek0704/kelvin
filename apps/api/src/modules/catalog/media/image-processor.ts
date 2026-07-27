import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Rasm qayta ishlash (sharp) — CANON §6, docs/05 §1.5.
 *
 * Har rasmdan: 5 o'lcham × 3 format (AVIF/WebP/JPEG) + LQIP (blur placeholder).
 * BullMQ job'ida ishlaydi (CPU og'ir → API'dan alohida).
 *
 * Bu servis S3'ni bilmaydi — faqat bayt → bayt. Yuklashni chaqiruvchi qiladi.
 */
export interface DerivativeBuffer {
  readonly format: 'avif' | 'webp' | 'jpeg';
  readonly width: number;
  readonly buffer: Buffer;
  readonly contentType: string;
}

export interface ProcessedImage {
  readonly original: { width: number; height: number };
  readonly derivatives: DerivativeBuffer[];
  /** LQIP — kichik blur, base64 data URI (sahifa yuklanishida placeholder). */
  readonly lqip: string;
}

/** Responsive kenglik nuqtalari (px). */
export const IMAGE_WIDTHS = [400, 800, 1200, 1600, 2000] as const;

const FORMATS = ['avif', 'webp', 'jpeg'] as const;
const CONTENT_TYPE: Record<(typeof FORMATS)[number], string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

@Injectable()
export class ImageProcessor {
  async process(input: Buffer): Promise<ProcessedImage> {
    const meta = await sharp(input).metadata();
    const srcWidth = meta.width ?? 0;
    const srcHeight = meta.height ?? 0;

    // Faqat manba kengligidan katta bo'lmagan o'lchamlar (kattalashtirmaymiz).
    const targetWidths = IMAGE_WIDTHS.filter((w) => w <= srcWidth || w === IMAGE_WIDTHS[0]);

    const derivatives: DerivativeBuffer[] = [];
    for (const width of targetWidths) {
      for (const format of FORMATS) {
        const buffer = await this.encode(input, width, format);
        derivatives.push({ format, width, buffer, contentType: CONTENT_TYPE[format] });
      }
    }

    const lqip = await this.makeLqip(input);

    return { original: { width: srcWidth, height: srcHeight }, derivatives, lqip };
  }

  private async encode(
    input: Buffer,
    width: number,
    format: (typeof FORMATS)[number],
  ): Promise<Buffer> {
    const pipeline = sharp(input).resize({ width, withoutEnlargement: true });
    switch (format) {
      case 'avif':
        return await pipeline.avif({ quality: 50 }).toBuffer();
      case 'webp':
        return await pipeline.webp({ quality: 78 }).toBuffer();
      case 'jpeg':
        return await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    }
  }

  private async makeLqip(input: Buffer): Promise<string> {
    const buffer = await sharp(input)
      .resize({ width: 24, withoutEnlargement: true })
      .blur()
      .webp({ quality: 20 })
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString('base64')}`;
  }
}
