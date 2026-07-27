import { execFileSync } from 'node:child_process';
import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';

import { PrismaService } from '../../../src/shared/prisma/prisma.service';
import { RedisService } from '../../../src/shared/redis/redis.service';

/**
 * Integration test harness — REAL PostgreSQL + Redis (Testcontainers).
 * Ixtiyoriy: MinIO (S3) — media testlari uchun.
 *
 * Mock DB ISHLATILMAYDI — u constraint, tranzaksiya izolyatsiyasi va
 * trigger'larni sinamaydi. docs/14-testing-strategy.md §3
 */
export interface TestHarness {
  app: INestApplication;
  prisma: PrismaService;
  redis: RedisService;
  teardown: () => Promise<void>;
}

export interface HarnessOptions {
  /** MinIO (S3) konteynerini ko'tarish — media testlari uchun. */
  storage?: boolean;
  /** Meilisearch konteynerini ko'tarish — qidiruv testlari uchun. */
  search?: boolean;
}

export async function createHarness(options: HarnessOptions = {}): Promise<TestHarness> {
  const postgres: StartedPostgreSqlContainer = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('kelvin_test')
    .withUsername('kelvin')
    .withPassword('kelvin_test')
    .start();

  const redis: StartedRedisContainer = await new RedisContainer('redis:7-alpine').start();

  let minio: StartedTestContainer | undefined;
  let meili: StartedTestContainer | undefined;

  const databaseUrl = postgres.getConnectionUri();

  // --- Env (config validateEnv talab qiladi) --------------------------------
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_HOST = redis.getHost();
  process.env.REDIS_PORT = String(redis.getMappedPort(6379));
  process.env.REDIS_DB = '0';
  process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_at_least_32_characters_long_xx';
  process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_at_least_32_characters_long_y';
  process.env.JWT_ACCESS_TTL = '15m';
  process.env.JWT_REFRESH_TTL = '30d';
  process.env.ARGON2_MEMORY_COST = '19456';
  process.env.ARGON2_TIME_COST = '2';
  process.env.ARGON2_PARALLELISM = '1';

  if (options.storage) {
    minio = await new GenericContainer('minio/minio:latest')
      .withEnvironment({ MINIO_ROOT_USER: 'kelvin', MINIO_ROOT_PASSWORD: 'kelvin_test_secret' })
      .withCommand(['server', '/data'])
      .withExposedPorts(9000)
      .withWaitStrategy(Wait.forHttp('/minio/health/live', 9000))
      .start();
    process.env.S3_ENDPOINT = `http://${minio.getHost()}:${String(minio.getMappedPort(9000))}`;
    process.env.S3_ACCESS_KEY = 'kelvin';
    process.env.S3_SECRET_KEY = 'kelvin_test_secret';
    process.env.S3_BUCKET = 'kelvin-test';
    process.env.S3_FORCE_PATH_STYLE = 'true';
  }

  if (options.search) {
    meili = await new GenericContainer('getmeili/meilisearch:v1.11')
      .withEnvironment({ MEILI_ENV: 'development', MEILI_NO_ANALYTICS: 'true' })
      .withExposedPorts(7700)
      .withWaitStrategy(Wait.forHttp('/health', 7700))
      .start();
    process.env.MEILISEARCH_HOST = `http://${meili.getHost()}:${String(meili.getMappedPort(7700))}`;
    process.env.MEILISEARCH_API_KEY = '';
  }

  // --- Migratsiyalarni qo'llash (trigger'lar bilan) -------------------------
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  });

  // ⚠️ AppModule DINAMIK import: @nestjs/config forRoot import paytida env'ni
  //    tekshiradi (fail-fast). Shuning uchun env O'RNATILGANDAN keyin yuklanadi.
  const { AppModule } = await import('../../../src/app.module');
  // Rate limiting NODE_ENV=test da skip qilinadi (app.module skipIf).
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  app.use(cookieParser());
  app.setGlobalPrefix('api', { exclude: ['health', 'health/live', 'health/ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  const redisService = app.get(RedisService);

  if (options.storage) {
    const { StorageService } = await import('../../../src/shared/storage/storage.service');
    await app.get(StorageService).ensureBucket();
  }

  return {
    app,
    prisma,
    redis: redisService,
    teardown: async (): Promise<void> => {
      await app.close();
      await postgres.stop();
      await redis.stop();
      if (minio) {
        await minio.stop();
      }
      if (meili) {
        await meili.stop();
      }
    },
  };
}
