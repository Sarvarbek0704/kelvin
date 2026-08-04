import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, type CursorPage } from '@kelvin/contracts';

import { BusinessRuleError, NotFoundError } from '../../core/errors/domain.error';
import { ORDER_STATUSES, type OrderStatus } from '../../core/order/order-status';
import { Authenticated, CurrentActor, RequirePermission } from '../../shared/auth/auth.decorators';
import {
  OrderService,
  toAdminOrderView,
  toOrderView,
  type AdminOrderDetailView,
  type AdminOrderView,
  type OrderView,
} from './order.service';
import { CancelDto, CheckoutDto, TransitionDto } from './dto/order.dto';

@ApiTags('order')
@Controller('orders')
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post('checkout')
  @Authenticated()
  @ApiOperation({ summary: 'Checkout: savatdan DRAFT buyurtma (saga + rezerv)' })
  async checkout(@Body() dto: CheckoutDto, @CurrentActor() actor: Actor): Promise<OrderView> {
    if (actor.customerId === undefined) {
      throw new BusinessRuleError('NOT_A_CUSTOMER', 'Checkout faqat mijoz uchun');
    }
    const order = await this.orders.checkout({
      customerId: actor.customerId,
      cartId: dto.cartId,
      ...(dto.warehouseId !== undefined && { warehouseId: dto.warehouseId }),
      ...(dto.deliveryZoneId !== undefined && { deliveryZoneId: dto.deliveryZoneId }),
      ...(dto.addressId !== undefined && { addressId: dto.addressId }),
      ...(dto.slotId !== undefined && { slotId: dto.slotId }),
      ...(dto.note !== undefined && { note: dto.note }),
    });
    return toOrderView(order);
  }

  @Get()
  @Authenticated()
  @ApiOperation({ summary: 'Mening buyurtmalarim (kabinet)' })
  async listOwn(@CurrentActor() actor: Actor): Promise<OrderView[]> {
    if (actor.customerId === undefined) {
      return [];
    }
    const orders = await this.orders.listForCustomer(actor.customerId);
    return orders.map(toOrderView);
  }

  // --- Admin (⚠️ ':id'dan OLDIN — aks holda 'admin' UUID sifatida ushlanadi) ---

  @Get('admin')
  @RequirePermission('order:read')
  @ApiOperation({ summary: 'Admin: buyurtmalar ro‘yxati (cursor + status filtri)' })
  async adminList(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<AdminOrderView>> {
    if (status !== undefined && !ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException('Noma‘lum status');
    }
    const page = await this.orders.listForAdmin({
      ...(status !== undefined && { status: status as OrderStatus }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items.map(toAdminOrderView),
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Get('admin/stats')
  @RequirePermission('order:read')
  @ApiOperation({ summary: 'Admin: buyurtma statistikasi (dashboard)' })
  adminStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    return this.orders.statsForAdmin();
  }

  @Get('admin/:id')
  @RequirePermission('order:read')
  @ApiOperation({ summary: 'Admin: buyurtma detali (mijoz kontakti + holat tarixi)' })
  async adminGet(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<AdminOrderDetailView> {
    const detail = await this.orders.getDetailForAdmin(id);
    if (detail === null) {
      throw new NotFoundError('Buyurtma', id);
    }
    return detail;
  }

  @Get(':id')
  @Authenticated()
  @ApiOperation({ summary: 'Buyurtma (faqat o‘ziniki)' })
  async get(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<OrderView> {
    const order = await this.orders.getById(id);
    // ⚠️ Ownership: begona buyurtma → 404 (ma'lumot sizdirmaslik, docs/04 §4).
    if (order === null || order.customerId !== actor.customerId) {
      throw new NotFoundError('Buyurtma', id);
    }
    return toOrderView(order);
  }

  @Post(':id/cancel')
  @RequirePermission('order:cancel')
  @ApiOperation({ summary: 'Bekor qilish → CANCELLED + rezerv release' })
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: CancelDto,
    @CurrentActor() actor: Actor,
  ): Promise<OrderView> {
    const existing = await this.orders.getById(id);
    if (existing === null || (actor.customerId !== undefined && existing.customerId !== actor.customerId)) {
      throw new NotFoundError('Buyurtma', id);
    }
    const order = await this.orders.cancel(id, actor.userId, dto.reason);
    return toOrderView(order);
  }

  @Post(':id/transition')
  @RequirePermission('order:transition')
  @ApiOperation({ summary: 'Holat o‘tishi (xodim: fulfillment)' })
  async transition(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: TransitionDto,
    @CurrentActor() actor: Actor,
  ): Promise<OrderView> {
    const order = await this.orders.transitionTo(id, dto.to, actor.userId, dto.reason);
    return toOrderView(order);
  }
}
