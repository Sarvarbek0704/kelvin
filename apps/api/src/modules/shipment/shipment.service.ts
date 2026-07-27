import { Inject, Injectable, Logger } from '@nestjs/common';

import { BusinessRuleError, ConflictError, NotFoundError } from '../../core/errors/domain.error';
import { canTransition, nextShipmentStates, type ShipmentStatus } from '../../core/shipment/shipment-state';
import { ORDER_PORT, type OrderPort } from '../order/order.port';
import { CUSTOMER_PORT, type CustomerPort } from '../customer/customer.port';
import { DELIVERY_PORT, type DeliveryPort } from '../delivery/delivery.port';
import { ShipmentRepository, type CourierOption, type ShipmentRow } from './shipment.repository';

export interface CreateShipmentInput {
  readonly orderId: string;
  readonly addressId: string;
  readonly slotId?: string;
}

/** Admin ko'rinishi — holat mashinasidan ruxsat etilgan o'tishlar bilan. */
export interface ShipmentView {
  readonly id: string;
  readonly orderId: string;
  readonly addressId: string;
  readonly slotId: string | null;
  readonly status: string;
  readonly courierId: string | null;
  readonly trackingNumber: string | null;
  readonly allowedTransitions: readonly string[];
  readonly createdAt: string;
}

export function toShipmentView(s: ShipmentRow): ShipmentView {
  return {
    id: s.id,
    orderId: s.orderId,
    addressId: s.addressId,
    slotId: s.slotId,
    status: s.status,
    courierId: s.courierId,
    trackingNumber: s.trackingNumber,
    allowedTransitions: nextShipmentStates(s.status),
    createdAt: s.createdAt.toISOString(),
  };
}

/**
 * shipment — jo'natma (docs/07 §3.3, docs/09). Order CONFIRMED bo'lgach yaratiladi.
 *
 * ⚠️ Slot bron ATOMIK (DELIVERY_PORT) + KOMPENSATSIYA: jo'natma yaratish yiqilsa
 *    bron bo'shatiladi (saga qadami). Manzil order mijoziga tegishli bo'lishi shart.
 */
@Injectable()
export class ShipmentService {
  private readonly log = new Logger(ShipmentService.name);

  constructor(
    private readonly repo: ShipmentRepository,
    @Inject(ORDER_PORT) private readonly orders: OrderPort,
    @Inject(CUSTOMER_PORT) private readonly customers: CustomerPort,
    @Inject(DELIVERY_PORT) private readonly delivery: DeliveryPort,
  ) {}

  getById(id: string): Promise<ShipmentRow | null> {
    return this.repo.findById(id);
  }

  /** Buyurtmaning jo'natmalari (admin — buyurtma detali). */
  listByOrder(orderId: string): Promise<ShipmentRow[]> {
    return this.repo.findByOrder(orderId);
  }

  /** Faol kuryerlar — tayinlash tanlovi (admin). */
  listCouriers(): Promise<CourierOption[]> {
    return this.repo.listActiveCouriers();
  }

  async createForOrder(input: CreateShipmentInput): Promise<ShipmentRow> {
    const order = await this.orders.getPayableOrder(input.orderId);
    if (order === null) {
      throw new NotFoundError('Buyurtma', input.orderId);
    }
    if (order.status !== 'CONFIRMED') {
      throw new ConflictError('Jo‘natma faqat CONFIRMED buyurtma uchun', { status: order.status });
    }
    // Bitta buyurtma → bitta jo'natma (bu bosqichda).
    if ((await this.repo.findByOrder(order.id)).length > 0) {
      throw new ConflictError('Buyurtma uchun jo‘natma allaqachon mavjud');
    }

    // ⚠️ Manzil order mijoziga tegishli bo'lishi shart.
    const address = await this.customers.getAddress(input.addressId);
    if (address?.customerId !== order.customerId) {
      throw new BusinessRuleError('INVALID_ADDRESS', 'Manzil bu buyurtma mijoziga tegishli emas');
    }

    // Slot bron (berilsa) — ATOMIK, to'la → SlotUnavailableError.
    if (input.slotId !== undefined) {
      await this.delivery.bookSlot(input.slotId);
    }

    try {
      const shipment = await this.repo.create({
        orderId: order.id,
        addressId: input.addressId,
        ...(input.slotId !== undefined && { slotId: input.slotId }),
      });
      this.log.log(`Jo‘natma yaratildi: ${shipment.id} (order ${order.id})`);
      return shipment;
    } catch (err) {
      if (input.slotId !== undefined) {
        await this.delivery.releaseSlot(input.slotId); // KOMPENSATSIYA
      }
      throw err;
    }
  }

  /** Kuryer tayinlash: PENDING → ASSIGNED + kuzatuv raqami. */
  async assignCourier(shipmentId: string, courierId: string, trackingNumber: string): Promise<ShipmentRow> {
    return await this.transition(shipmentId, 'ASSIGNED', { courierId, trackingNumber });
  }

  /** Yo'lda: ASSIGNED → IN_TRANSIT. */
  async markInTransit(shipmentId: string): Promise<ShipmentRow> {
    return await this.transition(shipmentId, 'IN_TRANSIT', { shippedAt: new Date() });
  }

  /** Yetkazildi: IN_TRANSIT → DELIVERED. */
  async markDelivered(shipmentId: string): Promise<ShipmentRow> {
    return await this.transition(shipmentId, 'DELIVERED', { deliveredAt: new Date() });
  }

  private async transition(
    id: string,
    to: ShipmentStatus,
    patch: Record<string, unknown> = {},
  ): Promise<ShipmentRow> {
    const shipment = await this.repo.findById(id);
    if (shipment === null) {
      throw new NotFoundError('Jo‘natma', id);
    }
    if (!canTransition(shipment.status, to)) {
      throw new ConflictError(`Ruxsat etilmagan jo‘natma o‘tishi: ${shipment.status} → ${to}`, {
        from: shipment.status,
        to,
      });
    }
    return await this.repo.updateStatus(id, to, patch);
  }
}
