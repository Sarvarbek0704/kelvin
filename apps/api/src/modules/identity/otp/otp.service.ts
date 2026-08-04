import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type OtpRequestResponse } from '@kelvin/contracts';

import { RateLimitError } from '../../../core/errors/domain.error';
import { RedisService } from '../../../shared/redis/redis.service';
import { NOTIFICATION_PORT, type NotificationPort } from '../../notification/notification.port';

/** Kod amal qilish muddati (soniya). */
export const OTP_TTL_SECONDS = 300;
/** Qayta yuborishgacha kutish oynasi (soniya). */
export const OTP_RESEND_SECONDS = 60;
/** Bitta kod uchun maksimal tekshirish urinishlari. */
export const OTP_MAX_ATTEMPTS = 5;

/** Redis'dagi challenge — kod XESHI (plain saqlanmaydi) + urinishlar soni. */
interface OtpChallenge {
  readonly h: string;
  a: number;
}

/**
 * Email OTP — bir martalik 6 xonali kod (docs/11-security.md §2.7).
 *
 * Himoyalar:
 *  - kod Redis'da FAQAT SHA-256 xesh ko'rinishida, TTL 5 daqiqa;
 *  - qayta yuborish oynasi 60s (spam/enumeration'ga qarshi);
 *  - ≤5 noto'g'ri urinish — keyin challenge o'chadi (brute-force'ga qarshi);
 *  - taqqoslash timing-safe.
 *
 * Kod FAQAT email orqali boradi (SmtpEmailAdapter; SMTP sozlanmagan dev'da
 * LogAdapter — kod Notification yozuvida ko'rinadi). Javobda kod QAYTMAYDI.
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    @Inject(NOTIFICATION_PORT) private readonly notifications: NotificationPort,
  ) {}

  /** Kod yaratib email'ga yuboradi. Email mavjudligini OSHKOR QILMAYDI. */
  async request(email: string): Promise<OtpRequestResponse> {
    const cooldownKey = this.cooldownKey(email);
    const cooldownTtl = await this.redis.ttl(cooldownKey);
    if (cooldownTtl > 0) {
      throw new RateLimitError('Kod allaqachon yuborilgan — biroz kuting', cooldownTtl);
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const challenge: OtpChallenge = { h: this.hash(code), a: 0 };
    await this.redis.set(this.challengeKey(email), JSON.stringify(challenge), 'EX', OTP_TTL_SECONDS);
    await this.redis.set(cooldownKey, '1', 'EX', OTP_RESEND_SECONDS);

    // Best-effort (notification xatoni yutadi) — dev'da LogAdapter yozadi.
    await this.notifications.send({
      channel: 'EMAIL',
      recipient: email,
      templateKey: 'auth.otp_code',
      payload: { code, ttlMinutes: OTP_TTL_SECONDS / 60 },
    });

    return { expiresIn: OTP_TTL_SECONDS, resendAfter: OTP_RESEND_SECONDS };
  }

  /**
   * Kodni tekshiradi va MUVAFFAQIYATDA challenge'ni o'chiradi (bir martalik).
   * Yo'q/eskirgan/noto'g'ri kod — bir xil 401 (enumeration yo'q).
   */
  async verify(email: string, code: string): Promise<void> {
    const key = this.challengeKey(email);
    const raw = await this.redis.get(key);
    if (raw === null) {
      throw new UnauthorizedException({ code: 'OTP_INVALID' });
    }

    const challenge = JSON.parse(raw) as OtpChallenge;
    if (this.matches(challenge.h, code)) {
      await this.redis.del(key, this.cooldownKey(email));
      return;
    }

    challenge.a += 1;
    if (challenge.a >= OTP_MAX_ATTEMPTS) {
      await this.redis.del(key);
    } else {
      await this.redis.set(key, JSON.stringify(challenge), 'KEEPTTL');
    }
    throw new UnauthorizedException({ code: 'OTP_INVALID' });
  }

  private challengeKey(email: string): string {
    return `otp:ch:${email}`;
  }

  private cooldownKey(email: string): string {
    return `otp:cd:${email}`;
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private matches(storedHash: string, code: string): boolean {
    const a = Buffer.from(storedHash, 'hex');
    const b = createHash('sha256').update(code).digest();
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
