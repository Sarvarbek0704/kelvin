import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor } from '@kelvin/contracts';

import { BusinessRuleError, ForbiddenError, NotFoundError } from '../../core/errors/domain.error';
import { Authenticated, CurrentActor, RequirePermission } from '../../shared/auth/auth.decorators';
import { PaymentService } from './payment.service';
import { type PaymentRow } from './payment.repository';
import { CreatePaymentDto, RefundDto, SettleDto } from './dto/payment.dto';
import { ORDER_PORT } from '../order/order.port';
import { Inject } from '@nestjs/common';
import { type OrderPort } from '../order/order.port';

/** JSON javob — pul TIYINDA, string. */
interface PaymentView {
  readonly id: string;
  readonly orderId: string;
  readonly provider: string;
  readonly status: string;
  readonly amount: string;
  readonly currency: string;
}

function toView(p: PaymentRow): PaymentView {
  return {
    id: p.id,
    orderId: p.orderId,
    provider: p.provider,
    status: p.status,
    amount: p.amount.toString(),
    currency: p.currency,
  };
}

/**
 * payment — to'lov (docs/08). ⚠️ confirm (webhook/manual capture) provayder
 * imzosi bilan alohida keladi (§2.5) — bu yerda create + o'qish.
 */
@ApiTags('payment')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly payments: PaymentService,
    @Inject(ORDER_PORT) private readonly orders: OrderPort,
  ) {}

  @Post()
  @Authenticated()
  @ApiOperation({ summary: 'To‘lov yaratish (o‘z buyurtmasi uchun)' })
  async create(@Body() dto: CreatePaymentDto, @CurrentActor() actor: Actor): Promise<PaymentView> {
    if (actor.customerId === undefined) {
      throw new BusinessRuleError('NOT_A_CUSTOMER', 'To‘lov faqat mijoz uchun');
    }
    const order = await this.orders.getPayableOrder(dto.orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', dto.orderId);
    }
    if (order.customerId !== actor.customerId) {
      throw new ForbiddenError('Bu buyurtma sizniki emas');
    }
    const payment = await this.payments.createPayment({
      orderId: dto.orderId,
      provider: dto.provider,
      idempotencyKey: dto.idempotencyKey,
    });
    return toView(payment);
  }

  @Get('admin/stats')
  @RequirePermission('payment:read')
  @ApiOperation({ summary: 'Admin: tushum statistikasi (dashboard)' })
  adminRevenue(): Promise<{ paidTotal: string; refundedTotal: string; net: string }> {
    return this.payments.revenueStats();
  }

  @Get('admin')
  @RequirePermission('payment:read')
  @ApiOperation({ summary: 'Admin: buyurtmaning to‘lovlari (orderId)' })
  async adminListByOrder(@Query('orderId') orderId?: string): Promise<PaymentView[]> {
    if (orderId === undefined || orderId.trim() === '') {
      throw new BadRequestException('orderId parametri kerak');
    }
    const payments = await this.payments.listByOrder(orderId);
    return payments.map(toView);
  }

  @Get(':id')
  @Authenticated()
  @ApiOperation({ summary: 'To‘lov (o‘z buyurtmasiniki)' })
  async get(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<PaymentView> {
    const payment = await this.payments.getById(id);
    if (payment === null) {
      throw new NotFoundError('To‘lov', id);
    }
    const order = await this.orders.getPayableOrder(payment.orderId);
    if (order === null || order.customerId !== actor.customerId) {
      throw new NotFoundError('To‘lov', id);
    }
    return toView(payment);
  }

  @Post(':id/simulate-webhook')
  @Authenticated()
  @ApiOperation({ summary: '⚠️ DEV: onlayn to‘lovni MOCK webhook bilan yakunlash (§2.5)' })
  async simulate(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<PaymentView> {
    const payment = await this.payments.getById(id);
    if (payment === null) {
      throw new NotFoundError('To‘lov', id);
    }
    const order = await this.orders.getPayableOrder(payment.orderId);
    if (order === null || order.customerId !== actor.customerId) {
      throw new NotFoundError('To‘lov', id); // egalik — sizdirmaslik
    }
    await this.payments.simulateWebhook(id);
    return toView((await this.payments.getById(id)) ?? payment);
  }

  @Post(':id/settle')
  @RequirePermission('payment:settle')
  @ApiOperation({ summary: 'Provayder settlement — receivable→bank+komissiya (§6.5)' })
  async settle(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: SettleDto,
  ): Promise<PaymentView> {
    return toView(await this.payments.settle(id, BigInt(dto.feeAmount)));
  }

  @Post(':id/capture')
  @RequirePermission('payment:capture')
  @ApiOperation({ summary: 'Qo‘lda capture (naqd/bank) — kassir/kuryer tasdiqlaydi' })
  async capture(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<PaymentView> {
    // ⚠️ Faqat manual provayder (naqd/bank); webhook'li → service rad etadi (§4.4).
    const payment = await this.payments.captureManual(id);
    return toView(payment);
  }

  @Post(':id/refund')
  @RequirePermission('payment:refund')
  @ApiOperation({ summary: 'Refund (xodim) — teskari ledger + payment holati' })
  async refund(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: RefundDto,
  ): Promise<{ id: string; paymentId: string; amount: string; status: string }> {
    const refund = await this.payments.refund({
      paymentId: id,
      amount: BigInt(dto.amount),
      reason: dto.reason,
      idempotencyKey: dto.idempotencyKey,
    });
    return {
      id: refund.id,
      paymentId: refund.paymentId,
      amount: refund.amount.toString(),
      status: refund.status,
    };
  }
}
