import {
  Controller,
  HttpCode,
  Logger,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';

import { Public } from '../../shared/auth/auth.decorators';
import { PaymentService } from './payment.service';
import { PaymentProviderRegistry } from './provider/provider.registry';
import { type PaymentProvider, type PaymentProviderCode } from './provider/provider.port';

/**
 * To'lov webhook'lari (docs/08 §5.5). Provayder server-to-server xabar yuboradi.
 *
 * ⚠️ IMZO RAW BODY ustidan tekshiriladi (§11.3) — shuning uchun `rawBody: true`
 *    (main.ts). Parse qilingan JSON EMAS: JSON qayta serializatsiya imzoni buzadi.
 * ⚠️ @Public: provayder JWT bermaydi. Himoya = IMZO (adapter.parseWebhook throw).
 */
@ApiTags('payment')
@Controller('payments')
export class WebhookController {
  private readonly log = new Logger(WebhookController.name);

  constructor(
    private readonly registry: PaymentProviderRegistry,
    private readonly payments: PaymentService,
  ) {}

  @Post(':providerCode/webhook')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'To‘lov provayderi webhook’i (imzo tekshiriladi)' })
  async handle(
    @Param('providerCode') providerCode: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<unknown> {
    // Noma'lum provayder → UnknownProviderError (404) filter orqali.
    const provider = this.registry.get(providerCode as PaymentProviderCode);

    let event;
    try {
      // ⚠️ Imzo RAW body ustidan (§11.3). Noto'g'ri → throw → 4xx + LOG (hujum).
      event = await provider.parseWebhook({
        headers: req.headers as Readonly<Record<string, string | undefined>>,
        rawBody: req.rawBody ?? Buffer.alloc(0),
      });
    } catch (err) {
      this.log.warn(`webhook imzo rad etildi: ${providerCode}`);
      return this.safeResponse(provider, 'rejected', err instanceof Error ? err : undefined);
    }

    // ⚠️ applyWebhookEvent IDEMPOTENT: takror → allaqachon PAID → jim OK (§5.5).
    //    UnknownTransaction/AmountMismatch/Replay xatolari filter orqali 4xx.
    await this.payments.applyWebhookEvent(event);
    return this.safeResponse(provider, 'accepted');
  }

  /** Adapter javob formatini bermasa (skelet) — sodda fallback (500 o'rniga). */
  private safeResponse(provider: PaymentProvider, result: 'accepted' | 'rejected', err?: Error): unknown {
    try {
      return provider.buildWebhookResponse(result, err);
    } catch {
      return { result };
    }
  }
}
