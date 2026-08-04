import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Muhit o'zgaruvchilari — validatsiya.
 *
 * Tamoyil: noto'g'ri konfiguratsiya bilan ilova ISHGA TUSHMASLIGI kerak.
 * Xato ishga tushish paytida chiqsin, uch oydan keyin prod'da emas.
 *
 * @see docs/10-security.md §8
 */
export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Staging = 'staging',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  API_PREFIX = 'api';

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  // --- Ma'lumotlar bazasi -------------------------------------------------
  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  // --- Redis --------------------------------------------------------------
  @IsString()
  REDIS_HOST = 'localhost';

  @IsInt()
  REDIS_PORT = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsInt()
  REDIS_DB = 0;

  // --- JWT ----------------------------------------------------------------
  /**
   * ⚠️  32 belgi — MINIMUM, tavsiya emas.
   *
   * Eski loyihada kalit `"SMD_access"` edi va u GitHub'ga commit qilingan edi.
   * Bunday kalit HMAC-SHA256 uchun bir necha soatda ochiladi.
   *
   * Generatsiya: openssl rand -base64 64
   */
  @IsString()
  @MinLength(32, {
    message:
      "JWT_ACCESS_SECRET kamida 32 belgi bo'lishi kerak. Generatsiya: openssl rand -base64 64",
  })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32, {
    message: "JWT_REFRESH_SECRET kamida 32 belgi bo'lishi kerak va ACCESS dan FARQ qilishi shart",
  })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_TTL = '15m';

  @IsString()
  JWT_REFRESH_TTL = '30d';

  // --- Argon2id (ADR-0004) ------------------------------------------------
  @IsInt()
  @Min(19456, {
    message:
      "ARGON2_MEMORY_COST kamida 19456 (19 MiB) bo'lishi kerak — OWASP tavsiyasi. " +
      'docs/adr/0004-argon2id-over-bcrypt.md',
  })
  ARGON2_MEMORY_COST = 19456;

  @IsInt()
  @Min(2)
  ARGON2_TIME_COST = 2;

  @IsInt()
  @Min(1)
  ARGON2_PARALLELISM = 1;

  // --- Meilisearch (docs/05-catalog-and-search.md) -------------------------
  @IsString()
  MEILISEARCH_HOST = 'http://localhost:7700';

  @IsString()
  @IsOptional()
  MEILISEARCH_API_KEY?: string;

  // --- Object storage (S3-mos, MinIO) — docs/05 §1.5 -----------------------
  @IsString()
  S3_ENDPOINT = 'http://localhost:9000';

  @IsString()
  S3_REGION = 'us-east-1';

  @IsString()
  S3_BUCKET = 'kelvin-dev';

  @IsString()
  S3_ACCESS_KEY = 'kelvin';

  @IsString()
  S3_SECRET_KEY = 'kelvin_dev_only';

  /** MinIO uchun path-style majburiy (virtual-host emas). */
  @IsBoolean()
  @IsOptional()
  S3_FORCE_PATH_STYLE = true;

  /** Ommaviy URL bazasi (CDN/MinIO). Bo'sh bo'lsa endpoint+bucket ishlatiladi. */
  @IsString()
  @IsOptional()
  S3_PUBLIC_URL?: string;

  // --- Rezerv (docs/06-inventory-and-reservations.md §3) -------------------
  /**
   * Savat rezervi qancha yashaydi (sekundda).
   *
   * ⚠️ Bu qiymat TAXMINIY. Juda qisqa → mijoz checkout'ni tugatolmaydi.
   *    Juda uzun → tovar bekorga bloklanadi. Real konversiya vaqti
   *    o'lchangandan keyin sozlanadi.
   */
  @IsInt()
  @Min(60)
  RESERVATION_TTL_SECONDS = 900;

  // --- Kuzatuv ------------------------------------------------------------
  @IsString()
  LOG_LEVEL = 'info';

  @IsBoolean()
  @IsOptional()
  OTEL_ENABLED = false;

  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  // --- Rate limiting ------------------------------------------------------
  @IsInt()
  THROTTLE_TTL = 60;

  @IsInt()
  THROTTLE_LIMIT = 300;

  // --- SMTP (email — OTP kodlari, buyurtma xabarlari) -----------------------
  /**
   * SMTP_HOST + SMTP_USER + SMTP_PASSWORD uchalasi ham berilsa — real jo'natish.
   * Aks holda EMAIL kanal LogAdapter'ga tushadi (dev qulayligi).
   * Gmail: smtp.gmail.com + App Password (oddiy parol ISHLAMAYDI).
   */
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsInt()
  SMTP_PORT = 587;

  /** true → 465 (implicit TLS); false → 587 STARTTLS. */
  @IsBoolean()
  @IsOptional()
  SMTP_SECURE = false;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  /** "From" manzili; berilmasa SMTP_USER ishlatiladi. */
  @IsString()
  @IsOptional()
  SMTP_FROM?: string;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  database: { url: string };
  redis: { host: string; port: number; password?: string; db: number };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  argon2: { memoryCost: number; timeCost: number; parallelism: number };
  search: { host: string; apiKey?: string };
  storage: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
    publicUrl?: string;
  };
  inventory: { reservationTtlSeconds: number };
  observability: { logLevel: string; otelEnabled: boolean; sentryDsn?: string };
  throttle: { ttl: number; limit: number };
  /** SMTP to'liq sozlanganda mavjud; aks holda undefined → LogAdapter. */
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
}

/**
 * Env qiymatlari — matn. Bu maydonlar son/boolean ga aylantiriladi.
 *
 * ⚠️ Nega qo'lda: `enableImplicitConversion` `emitDecoratorMetadata` ga tayanadi.
 *    tsc uni emit qiladi, lekin esbuild/tsx va ba'zi ts-jest rejimlarida yo'q —
 *    natijada "6380" string qolib, @IsInt yiqiladi. Aniq coerce transpiler'dan
 *    MUSTAQIL: ilova ham (tsc), test ham (tsx/ts-jest) bir xil ishlaydi.
 */
const NUMERIC_ENV_KEYS = [
  'PORT',
  'REDIS_PORT',
  'REDIS_DB',
  'ARGON2_MEMORY_COST',
  'ARGON2_TIME_COST',
  'ARGON2_PARALLELISM',
  'RESERVATION_TTL_SECONDS',
  'THROTTLE_TTL',
  'THROTTLE_LIMIT',
  'SMTP_PORT',
] as const;

const BOOLEAN_ENV_KEYS = ['OTEL_ENABLED', 'S3_FORCE_PATH_STYLE', 'SMTP_SECURE'] as const;

function coerceEnv(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  for (const key of NUMERIC_ENV_KEYS) {
    const value = out[key];
    if (typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        out[key] = num;
      }
    }
  }
  for (const key of BOOLEAN_ENV_KEYS) {
    const value = out[key];
    if (typeof value === 'string') {
      out[key] = value.toLowerCase() === 'true' || value === '1';
    }
  }
  return out;
}

/**
 * Muhit o'zgaruvchilarini tekshirish.
 *
 * Xato bo'lsa — ilova ishga tushmaydi va sabab aniq ko'rsatiladi.
 */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, coerceEnv(raw), {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `  • ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Konfiguratsiya xatosi:\n${details}\n\n.env.example fayliga qarang.`);
  }

  // --- Qo'shimcha semantik tekshiruvlar ------------------------------------
  if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_ACCESS_SECRET va JWT_REFRESH_SECRET bir xil bo'lishi MUMKIN EMAS. " +
        'Aks holda access token refresh sifatida ishlatilishi mumkin.',
    );
  }

  if (validated.NODE_ENV === NodeEnv.Production) {
    const weak = ['CHANGE_ME', 'secret', 'password', 'SMD_access', 'SMD_refresh'];
    for (const secret of [validated.JWT_ACCESS_SECRET, validated.JWT_REFRESH_SECRET]) {
      if (weak.some((w) => secret.includes(w))) {
        throw new Error('Production muhitida shablon/zaif JWT kaliti ishlatilmoqda.');
      }
    }
  }

  return validated;
}

export function loadConfig(): AppConfig {
  const env = validateEnv(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    corsOrigins: env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [],
    database: { url: env.DATABASE_URL },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      ...(env.REDIS_PASSWORD !== undefined && { password: env.REDIS_PASSWORD }),
      db: env.REDIS_DB,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshTtl: env.JWT_REFRESH_TTL,
    },
    argon2: {
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    },
    search: {
      host: env.MEILISEARCH_HOST,
      ...(env.MEILISEARCH_API_KEY !== undefined && { apiKey: env.MEILISEARCH_API_KEY }),
    },
    storage: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      ...(env.S3_PUBLIC_URL !== undefined && { publicUrl: env.S3_PUBLIC_URL }),
    },
    inventory: { reservationTtlSeconds: env.RESERVATION_TTL_SECONDS },
    observability: {
      logLevel: env.LOG_LEVEL,
      otelEnabled: env.OTEL_ENABLED,
      ...(env.SENTRY_DSN !== undefined && { sentryDsn: env.SENTRY_DSN }),
    },
    throttle: { ttl: env.THROTTLE_TTL, limit: env.THROTTLE_LIMIT },
    // Bo'sh string ("SMTP_PASS=") sozlangan hisoblanMAYDI — .env odati shunaqa.
    ...(isNonEmpty(env.SMTP_HOST) &&
      isNonEmpty(env.SMTP_USER) &&
      isNonEmpty(env.SMTP_PASSWORD) && {
        smtp: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
          from: isNonEmpty(env.SMTP_FROM) ? env.SMTP_FROM : env.SMTP_USER,
        },
      }),
  };
}

function isNonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}
