import { Inject, Injectable } from '@nestjs/common';

import { UnknownProviderError } from '../../../core/errors/domain.error';
import {
  PAYMENT_PROVIDERS,
  type PaymentProvider,
  type PaymentProviderCode,
} from './provider.port';

/**
 * Provayder reestri (docs/08 §2.4). Adapterni kod bo'yicha topadi. Yangi
 * provayder = yangi adapter + massivга bitta qator; PaymentService tegilmaydi.
 *
 * ⚠️ FAIL-FAST: ikki adapter bitta kodni da'vo qilsa — konfiguratsiya xatosi,
 *    ishga tushishda yiqiladi (jim noto'g'ri marshrutlash o'rniga).
 */
@Injectable()
export class PaymentProviderRegistry {
  private readonly byCode: ReadonlyMap<PaymentProviderCode, PaymentProvider>;

  constructor(@Inject(PAYMENT_PROVIDERS) providers: readonly PaymentProvider[]) {
    const map = new Map<PaymentProviderCode, PaymentProvider>();
    for (const p of providers) {
      if (map.has(p.code)) {
        throw new Error(`Duplicate payment provider code: ${p.code}`);
      }
      map.set(p.code, p);
    }
    this.byCode = map;
  }

  get(code: PaymentProviderCode): PaymentProvider {
    const provider = this.byCode.get(code);
    if (provider === undefined) {
      throw new UnknownProviderError(code);
    }
    return provider;
  }

  /** Storefront "to'lov usuli" ro'yxati uchun. */
  listEnabled(): readonly PaymentProviderCode[] {
    return [...this.byCode.keys()];
  }
}
