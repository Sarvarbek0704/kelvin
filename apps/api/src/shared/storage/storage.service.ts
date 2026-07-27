import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { type AppConfig } from '../../config/configuration';

/**
 * S3-mos obyekt xotira (MinIO). Rasm fayllari.
 *
 * ⚠️ Rasmni Kelvin serveri EMAS, mijoz TO'G'RIDAN-TO'G'RI S3'ga yuklaydi
 *    (presigned URL) — server RAM/bandwidth tejaydi. docs/05 §1.5
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const s3 = config.get('storage', { infer: true });
    this.bucket = s3.bucket;
    this.publicBase = s3.publicUrl ?? `${s3.endpoint}/${s3.bucket}`;
    this.client = new S3Client({
      endpoint: s3.endpoint,
      region: s3.region,
      forcePathStyle: s3.forcePathStyle,
      credentials: { accessKeyId: s3.accessKey, secretAccessKey: s3.secretKey },
    });
  }

  /** Bucket mavjudligini ta'minlaydi (dev/test). */
  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket yaratildi: ${this.bucket}`);
    }
  }

  /** Yuklash uchun presigned PUT URL (mijoz to'g'ridan-to'g'ri yuklaydi). */
  async presignPut(key: string, contentType: string, expiresIn = 900): Promise<string> {
    return await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn },
    );
  }

  /** O'qish uchun presigned GET URL (xususiy obyektlar uchun). */
  async presignGet(key: string, expiresIn = 900): Promise<string> {
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      {
        expiresIn,
      },
    );
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async getObject(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error(`Obyekt bo'sh: ${key}`);
    }
    return Buffer.from(bytes);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /** Kalitdan ommaviy URL. */
  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }
}
