import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { type AppConfig } from '../../config/configuration';

/**
 * Redis ulanishi — efemer ma'lumot uchun (docs/02-architecture.md §8.2):
 * cache, BullMQ navbat, rate limit, sessiya, mehmon savati, idempotency,
 * OTP, deny-list.
 *
 * ⚠️ Qoldiq, pul, buyurtma Redis'da SAQLANMAYDI — ular PostgreSQL'da.
 *    Redis yo'qolsa qoldiq yo'qolmasligi kerak.
 */
@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService<AppConfig, true>) {
    const redis = config.get('redis', { infer: true });
    super({
      host: redis.host,
      port: redis.port,
      db: redis.db,
      ...(redis.password !== undefined && { password: redis.password }),
      // BullMQ va ehtiyotkorlik: buyruq navbatga qo'yilmasin, tez xato bersin.
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
    this.logger.log('Redis ulanishi tayyor');
  }

  onModuleDestroy(): void {
    this.disconnect();
  }
}
