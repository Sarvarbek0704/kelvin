import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type AccessTokenPayload, type Role } from '@kelvin/contracts';

import { type AppConfig } from '../../../config/configuration';

/**
 * Access token (JWT) — imzolangan, shifrlanmagan, ~15 daqiqa.
 *
 * Payload'da shaxsiy ma'lumot yo'q — faqat `sub`, `roles`, `fid`, `cid`.
 * docs/11-security.md §2.3
 */
export interface AccessClaims {
  readonly sub: string;
  readonly roles: readonly Role[];
  readonly fid: string;
  readonly cid?: string | undefined;
}

@Injectable()
export class AccessTokenService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<AppConfig, true>,
  ) {
    const jwtCfg = config.get('jwt', { infer: true });
    this.secret = jwtCfg.accessSecret;
    this.ttlSeconds = parseTtlSeconds(jwtCfg.accessTtl);
  }

  get expiresInSeconds(): number {
    return this.ttlSeconds;
  }

  async sign(claims: AccessClaims): Promise<string> {
    return await this.jwt.signAsync(
      {
        sub: claims.sub,
        roles: claims.roles,
        fid: claims.fid,
        ...(claims.cid !== undefined && { cid: claims.cid }),
      },
      { secret: this.secret, expiresIn: this.ttlSeconds },
    );
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwt.verifyAsync<AccessTokenPayload>(token, { secret: this.secret });
    } catch (err) {
      const expired = err instanceof Error && err.name === 'TokenExpiredError';
      throw new UnauthorizedException({ code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID' });
    }
  }
}

/** "15m" / "30d" / "900" → sekund. */
export function parseTtlSeconds(ttl: string): number {
  const match = /^(\d+)([smhd]?)$/.exec(ttl.trim());
  if (!match) {
    throw new Error(`Yaroqsiz TTL formati: ${ttl}`);
  }
  const value = Number(match[1]);
  const unit = match[2] ?? '';
  const multiplier: Record<string, number> = { '': 1, s: 1, m: 60, h: 3600, d: 86_400 };
  return value * (multiplier[unit] ?? 1);
}
