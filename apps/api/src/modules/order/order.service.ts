import { Inject, Injectable, Logger } from '@nestjs/common';

import { BusinessRuleError, ConflictError, NotFoundError } from '../../core/errors/domain.error';
import { toJson } from '../../shared/json';
import { type OrderStatus } from '../../core/order/order-status';
import { canTransition, nextStates, transitionError } from '../../core/order/order-state-machine';
import { AuditService } from '../../shared/audit/audit.service';
import { CART_PORT, type CartPort } from '../cart/cart.port';
import { PRICING_PORT, type PricingPort } from '../pricing/pricing.port';
import { INVENTORY_PORT, type InventoryPort } from '../inventory/inventory.port';
import { CATALOG_PORT, type CatalogPort } from '../catalog/catalog.port';
import { DELIVERY_PORT, type DeliveryPort } from '../delivery/delivery.port';
import { CUSTOMER_PORT, type CustomerPort } from '../customer/customer.port';
import { NOTIFICATION_PORT, type NotificationPort } from '../notification/notification.port';
import { type OrderPort, type PayableOrder } from './order.port';
import { OrderRepository, type CreateOrderItemInput, type OrderWithItems } from './order.repository';

export interface CheckoutInput {
  readonly customerId: string;
  readonly cartId: string;
  /** Berilmasa standart sotiladigan ombor tanlanadi (mijoz ombor bilmaydi). */
  readonly warehouseId?: string;
  /** Yetkazish zonasi — berilsa narx snapshot buyurtmaga qo'shiladi. */
  readonly deliveryZoneId?: string;
  /** Mijoz manzili — EGALIK tekshiriladi (begona manzil → 404). */
  readonly addressId?: string;
  /** Afzal slot — bron QILINMAYDI (jo'natma yaratishda bron bo'ladi). */
  readonly slotId?: string;
  /** Mijoz izohi. */
  readonly note?: string;
}

/** JSON javob — pul TIYINDA, string (BigInt JSON'ga sig'maydi). */
export interface OrderView {
  readonly id: string;
  readonly number: string;
  readonly status: string;
  readonly customerId: string;
  readonly subtotalAmount: string;
  readonly discountAmount: string;
  readonly deliveryAmount: string;
  readonly totalAmount: string;
  readonly currency: string;
  readonly items: readonly {
    readonly variantId: string;
    readonly sku: string;
    readonly quantity: number;
    readonly unitAmount: string;
    readonly totalAmount: string;
  }[];
}

export function toOrderView(order: OrderWithItems): OrderView {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    customerId: order.customerId,
    subtotalAmount: order.subtotalAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    deliveryAmount: order.deliveryAmount.toString(),
    totalAmount: order.totalAmount.toString(),
    currency: order.currency,
    items: order.items.map((it) => ({
      variantId: it.variantId,
      sku: it.sku,
      quantity: it.quantity,
      unitAmount: it.unitAmount.toString(),
      totalAmount: it.totalAmount.toString(),
    })),
  };
}

/** Admin ko'rinishi — mijoznikidan farqli: kanal, sana, RUXSAT ETILGAN o'tishlar. */
export interface AdminOrderView extends OrderView {
  readonly channel: string;
  readonly createdAt: string;
  /** ⚠️ Holat mashinasidan (yagona manba) — admin tugmalarini shu boshqaradi. */
  readonly allowedTransitions: readonly string[];
}

export function toAdminOrderView(order: OrderWithItems): AdminOrderView {
  return {
    ...toOrderView(order),
    channel: order.channel,
    createdAt: order.createdAt.toISOString(),
    allowedTransitions: nextStates(order.status),
  };
}

/** Admin buyurtma DETALI — mijoz kontakti + holat tarixi (timeline) bilan. */
export interface AdminOrderDetailView extends AdminOrderView {
  readonly customer: {
    readonly phone: string | null;
    readonly email: string | null;
    readonly firstName: string | null;
  } | null;
  readonly timeline: readonly {
    readonly fromStatus: string | null;
    readonly toStatus: string;
    readonly reason: string | null;
    readonly createdAt: string;
  }[];
  /** Mijoz checkout'da tanlaganlari — jo'natma yaratishda default qiymatlar. */
  readonly deliveryAddress: {
    readonly id: string;
    readonly region: string;
    readonly city: string;
    readonly street: string;
  } | null;
  readonly deliverySlotId: string | null;
  readonly customerNote: string | null;
}

/**
 * order — checkout SAGA + holat mashinasi (docs/07 §2, §3).
 *
 * ⚠️ SAGA (distributed tranzaksiya EMAS, §3): rezerv har biri alohida tranzaksiya;
 *    biror qadam yiqilsa KOMPENSATSIYA (oldingi rezervlar bo'shatiladi). Idempotentlik
 *    darvozasi: savatni ATOMIK da'vo qilish (parallel ikki checkout → 1 buyurtma).
 *
 * ⚠️ Barcha o'tishlar SOF holat mashinasi orqali tekshiriladi (illegal → 409).
 */
@Injectable()
export class OrderService implements OrderPort {
  private readonly log = new Logger(OrderService.name);

  constructor(
    private readonly repo: OrderRepository,
    @Inject(CART_PORT) private readonly cart: CartPort,
    @Inject(PRICING_PORT) private readonly pricing: PricingPort,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    @Inject(CATALOG_PORT) private readonly catalog: CatalogPort,
    @Inject(DELIVERY_PORT) private readonly delivery: DeliveryPort,
    @Inject(CUSTOMER_PORT) private readonly customers: CustomerPort,
    @Inject(NOTIFICATION_PORT) private readonly notifications: NotificationPort,
    private readonly audit: AuditService,
  ) {}

  getById(orderId: string): Promise<OrderWithItems | null> {
    return this.repo.findById(orderId);
  }

  /** Mijozning buyurtmalari (kabinet). */
  listForCustomer(customerId: string, limit = 50): Promise<OrderWithItems[]> {
    return this.repo.findByCustomer(customerId, Math.min(limit, 100));
  }

  /** Admin buyurtma detali — mijoz kontakti (CUSTOMER_PORT) + holat tarixi. */
  async getDetailForAdmin(orderId: string): Promise<AdminOrderDetailView | null> {
    const order = await this.repo.findByIdWithHistory(orderId);
    if (order === null) {
      return null;
    }
    const contact = await this.customers.getContactInfo(order.customerId);
    const address =
      order.deliveryAddressId !== null
        ? await this.customers.getAddress(order.deliveryAddressId)
        : null;
    return {
      ...toAdminOrderView(order),
      customer: contact,
      timeline: order.statusHistory.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
      })),
      deliveryAddress:
        address !== null
          ? { id: address.id, region: address.region, city: address.city, street: address.street }
          : null,
      deliverySlotId: order.deliverySlotId,
      customerNote: order.customerNote,
    };
  }

  /** Dashboard statistikasi — holat bo'yicha son + jami. */
  async statsForAdmin(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const byStatus = await this.repo.countByStatus();
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return { total, byStatus };
  }

  /** Admin ro'yxati — cursor + status filtri (xodim, order:read). */
  listForAdmin(params: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: OrderWithItems[]; nextCursor: string | null }> {
    return this.repo.listForAdmin({
      ...(params.status !== undefined && { status: params.status }),
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  // --- OrderPort (to'lov moduliga) ------------------------------------------

  async getPayableOrder(orderId: string): Promise<PayableOrder | null> {
    const order = await this.repo.findById(orderId);
    if (order === null) {
      return null;
    }
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
    };
  }

  /** DRAFT → PENDING_PAYMENT (to'lovga o'tish). Idempotent. */
  async markPendingPayment(orderId: string): Promise<void> {
    const order = await this.repo.findById(orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', orderId);
    }
    if (order.status === 'PENDING_PAYMENT') {
      return; // idempotent
    }
    await this.transitionTo(orderId, 'PENDING_PAYMENT', undefined, 'checkout');
  }

  /**
   * To'lov o'tdi — order sagasi (docs/08 §3.3): PENDING_PAYMENT → PAID →
   * CONFIRMED + rezervlarni tasdiqlash. ⚠️ IDEMPOTENT (webhook takrori xavfsiz):
   * allaqachon CONFIRMED bo'lsa no-op.
   */
  async onPaymentSucceeded(orderId: string): Promise<void> {
    const order = await this.repo.findById(orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', orderId);
    }
    if (order.status === 'PENDING_PAYMENT') {
      await this.transitionTo(orderId, 'PAID', undefined, 'payment succeeded');
    }
    // Rezervlarni tasdiqlash (idempotent — faqat PENDING'lar).
    await this.inventory.confirmReservationsForOrder(orderId);
    const current = await this.repo.findById(orderId);
    if (current?.status === 'PAID') {
      const confirmed = await this.transitionTo(orderId, 'CONFIRMED', undefined, 'reservations confirmed');
      // ⚠️ Saga oxirgi qadami (docs/07 §3.3): mijozga xabar (best-effort, oqimni buzmaydi).
      const contact = await this.customers.getContactInfo(confirmed.customerId);
      // Telefon bo'lsa SMS, bo'lmasa email (email+OTP mijozida telefon yo'q).
      const recipient =
        contact?.phone !== null && contact?.phone !== undefined
          ? { channel: 'SMS', to: contact.phone }
          : contact?.email !== null && contact?.email !== undefined
            ? { channel: 'EMAIL', to: contact.email }
            : null;
      if (recipient !== null) {
        await this.notifications.send({
          channel: recipient.channel,
          recipient: recipient.to,
          templateKey: 'order_confirmed',
          payload: { orderNumber: confirmed.number, total: confirmed.totalAmount.toString() },
        });
      }
    }
  }

  /** ⚠️ To'langan+ holatlar — mahsulot "sotib olingan" hisoblanadi (sharh uchun). */
  private static readonly PURCHASED_STATUSES: readonly OrderStatus[] = [
    'PAID',
    'CONFIRMED',
    'PICKING',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
  ];

  /** ORDER_PORT — mijoz mahsulotni sotib olganmi (sharh tasdiqlangan xarid). */
  hasPurchased(customerId: string, productId: string): Promise<boolean> {
    return this.repo.hasPurchasedProduct(customerId, productId, OrderService.PURCHASED_STATUSES);
  }

  /** ORDER_PORT — mijoz agregati (RFM, docs/10 §9.3). */
  customerAggregates(): Promise<{ customerId: string; orderCount: number; totalSpent: bigint; lastOrderAt: Date | null }[]> {
    return this.repo.customerAggregates(OrderService.PURCHASED_STATUSES);
  }

  /** ORDER_PORT — mahsulot sotuv agregati (ABC, docs/10 §9.7). */
  productSalesAggregates(): Promise<{ productId: string; unitsSold: number; revenue: bigint }[]> {
    return this.repo.productSalesAggregates(OrderService.PURCHASED_STATUSES);
  }

  /** ORDER_PORT — umumiy sotuv xulosasi. AOV = jami / son (0 → 0). */
  async salesSummary(): Promise<{ orderCount: number; totalRevenue: bigint; averageOrderValue: bigint }> {
    const s = await this.repo.salesSummary(OrderService.PURCHASED_STATUSES);
    const averageOrderValue = s.orderCount > 0 ? s.totalRevenue / BigInt(s.orderCount) : 0n;
    return { ...s, averageOrderValue };
  }

  /**
   * To'liq refund → buyurtmani bekor qilish (bekor qilinadigan holatда) + rezerv
   * release. Jo'natilgan/terminal (SHIPPED/DELIVERED/CANCELLED...) → tegilmaydi.
   */
  async cancelForRefund(orderId: string): Promise<void> {
    const order = await this.repo.findById(orderId);
    if (order === null) {
      return; // yo'q — hech narsa qilmaymiz
    }
    if (canTransition(order.status, 'CANCELLED')) {
      await this.transitionTo(orderId, 'CANCELLED', undefined, 'refund');
    }
  }

  /**
   * Checkout: savatdan DRAFT buyurtma. Rezerv → (kompensatsiya) → savatni da'vo →
   * buyurtma yaratish → rezervlarni buyurtmaga ko'chirish.
   */
  async checkout(input: CheckoutInput): Promise<OrderWithItems> {
    const cart = await this.cart.getCartForCheckout(input.cartId);
    if (cart === null || cart.items.length === 0) {
      throw new BusinessRuleError('CART_EMPTY', 'Savat bo‘sh — checkout mumkin emas');
    }

    // Manzil EGALIGI — begona addressId bilan buyurtma berish mumkin emas (404).
    if (input.addressId !== undefined) {
      const address = await this.customers.getAddress(input.addressId);
      if (address?.customerId !== input.customerId) {
        throw new NotFoundError('Manzil', input.addressId);
      }
    }

    const [priced, snapshots] = await Promise.all([
      this.pricing.priceCart({
        lines: cart.items.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      }),
      this.catalog.getVariantSnapshots(cart.items.map((l) => l.variantId)),
    ]);
    const snapByVariant = new Map(snapshots.map((s) => [s.variantId, s]));
    const warehouseId = input.warehouseId ?? (await this.inventory.resolveSellableWarehouseId());

    // Yetkazish narxi (berilsa) — snapshot buyurtmaga qo'shiladi (§07 §5).
    const deliveryFee =
      input.deliveryZoneId !== undefined
        ? (await this.delivery.quote(input.deliveryZoneId, priced.subtotal)).fee
        : 0n;

    // 1. Rezerv — har biri alohida tranzaksiya. Xato bo'lsa KOMPENSATSIYA.
    // ⚠️ ADR-0007 mitigatsiyasi: variantId bo'yicha DETERMINISTIK tartibda
    //    rezerv qilamiz. Har rezerv alohida tranzaksiyada bo'lsa-da, bir vaqtda
    //    ikki checkout bir xil variant to'plamini teskari tartibda qulflasa
    //    deadlock ehtimoli bor — bir xil global tartib uni yo'qotadi.
    //    (Tegishli konkurent test bu sortsiz yiqilishi kerak.)
    const reserveLines = [...cart.items].sort((a, b) =>
      a.variantId < b.variantId ? -1 : a.variantId > b.variantId ? 1 : 0,
    );
    const reservationIds: string[] = [];
    try {
      for (const line of reserveLines) {
        const r = await this.inventory.reserve({
          variantId: line.variantId,
          warehouseId,
          quantity: line.quantity,
          cartId: input.cartId,
        });
        reservationIds.push(r.id);
      }
    } catch (err) {
      await this.releaseAll(reservationIds); // kompensatsiya
      throw err; // InsufficientStockError
    }

    // 2. Idempotentlik darvozasi — savatni ATOMIK da'vo qilish.
    const claimed = await this.cart.claimForCheckout(input.cartId);
    if (!claimed) {
      await this.releaseAll(reservationIds); // kompensatsiya
      throw new ConflictError('Savat allaqachon checkout qilingan');
    }

    // 3. DRAFT buyurtma yaratish (snapshot).
    const items: CreateOrderItemInput[] = priced.lines.map((l) => {
      const snap = snapByVariant.get(l.variantId);
      return {
        variantId: l.variantId,
        sku: snap?.sku ?? l.variantId,
        productName: toJson(snap?.productName ?? {}),
        variantAxis: toJson(snap?.variantAxis ?? {}),
        attributesSnapshot: toJson(snap?.attributes ?? {}),
        quantity: l.quantity,
        unitAmount: l.unitPrice,
        totalAmount: l.lineTotal,
        currency: 'UZS',
      };
    });

    let order: OrderWithItems;
    try {
      order = await this.repo.createDraft(
        {
          customerId: input.customerId,
          subtotalAmount: priced.subtotal,
          discountAmount: priced.discountTotal,
          deliveryAmount: deliveryFee,
          totalAmount: priced.totalAmount + deliveryFee,
          currency: 'UZS',
          appliedDiscounts: toJson(
            priced.trace
              .filter((t) => t.delta < 0n)
              .map((t) => ({ ruleId: t.ruleId, stage: t.stage, delta: t.delta.toString() })),
          ),
          ...(input.addressId !== undefined && { deliveryAddressId: input.addressId }),
          ...(input.slotId !== undefined && { deliverySlotId: input.slotId }),
          ...(input.note !== undefined && { customerNote: input.note }),
          items,
        },
        new Date().getUTCFullYear(),
      );
    } catch (err) {
      await this.releaseAll(reservationIds); // kompensatsiya
      throw err;
    }

    // 4. Rezervlarni buyurtmaga ko'chirish (savat egaligi → buyurtma egaligi).
    await this.inventory.transferReservationsToOrder(reservationIds, order.id);
    this.log.log(`Buyurtma yaratildi: ${order.number} (${String(items.length)} qator)`);
    return order;
  }

  /**
   * Holat o'tishi — SOF holat mashinasi orqali (docs/07 §2.2). Yon ta'sirlar:
   * PACKED → rezerv consume (on_hand kamayadi, §2.2 #13); CANCELLED → rezerv release.
   */
  async transitionTo(
    orderId: string,
    to: OrderStatus,
    actorUserId?: string,
    reason?: string,
  ): Promise<OrderWithItems> {
    const order = await this.repo.findById(orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', orderId);
    }
    const err = transitionError(order.status, to);
    if (err !== null) {
      throw new ConflictError(err, { from: order.status, to });
    }

    if (to === 'PACKED') {
      await this.inventory.consumeReservationsForOrder(orderId);
    } else if (to === 'CANCELLED') {
      await this.inventory.releaseReservationsForOrder(orderId);
    }

    const updated = await this.repo.transitionStatus(orderId, order.status, to, actorUserId, reason);

    // ⚠️ Audit (docs/11 §11): buyurtma bekor qilish — sezgir amal.
    if (to === 'CANCELLED') {
      await this.audit.record({
        action: 'ORDER_CANCELLED',
        resourceType: 'Order',
        resourceId: orderId,
        before: { status: order.status },
        after: { status: 'CANCELLED', ...(reason !== undefined && { reason }) },
        ...(actorUserId !== undefined && { actorUserId }),
      });
    }
    return updated;
  }

  /** Bekor qilish → CANCELLED (holat mashinasi ruxsat bersa) + rezerv release. */
  async cancel(orderId: string, actorUserId?: string, reason?: string): Promise<OrderWithItems> {
    return await this.transitionTo(orderId, 'CANCELLED', actorUserId, reason ?? 'cancelled');
  }

  /** Kompensatsiya — barcha rezervlarni bo'shatish (xato yutiladi, best-effort). */
  private async releaseAll(reservationIds: readonly string[]): Promise<void> {
    for (const id of reservationIds) {
      try {
        await this.inventory.release(id);
      } catch (e) {
        this.log.error(`Kompensatsiya (release) xato: ${id}`, e instanceof Error ? e.stack : undefined);
      }
    }
  }
}
