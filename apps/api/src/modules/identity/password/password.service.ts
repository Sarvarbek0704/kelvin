import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

import { type AppConfig } from '../../../config/configuration';

/**
 * Parol xeshlash — Argon2id (bcrypt EMAS).
 *
 * Nega Argon2id: memory-hard → GPU hujumini qimmatlashtiradi. OWASP tavsiyasi.
 * Parametrlar xesh ICHIDA saqlanadi (PHC string) → oshirilganda migration
 * kerak emas, `needsRehash` + login paytida qayta xeshlash.
 *
 * @see docs/11-security.md §2.1
 * @see docs/adr/0002-argon2id-over-bcrypt.md
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options;

  constructor(config: ConfigService<AppConfig, true>) {
    const a = config.get('argon2', { infer: true });
    this.options = {
      type: argon2.argon2id,
      memoryCost: a.memoryCost,
      timeCost: a.timeCost,
      parallelism: a.parallelism,
    };
  }

  async hash(plain: string): Promise<string> {
    // argon2 salt'ni o'zi generatsiya qiladi (16 bayt CSPRNG).
    return await argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // Buzilgan xesh → false. Xato turini oshkor qilmaymiz.
      return false;
    }
  }

  /** Parametrlar oshgach eski xeshni asta ko'chirish (login paytida). */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, this.options);
  }
}
