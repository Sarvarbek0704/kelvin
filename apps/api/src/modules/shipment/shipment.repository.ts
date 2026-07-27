import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type ShipmentStatus } from '../../core/shipment/shipment-state';

export type ShipmentRow = Prisma.ShipmentGetPayload<Record<string, never>>;
export interface CourierOption {
  readonly id: string;
  readonly fullName: string;
  readonly phone: string;
}

/** Jo'natma — Prisma qatlami (docs/07, docs/09). */
@Injectable()
export class ShipmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { orderId: string; addressId: string; slotId?: string }): Promise<ShipmentRow> {
    return this.prisma.shipment.create({
      data: {
        orderId: data.orderId,
        addressId: data.addressId,
        status: 'PENDING',
        ...(data.slotId !== undefined && { slotId: data.slotId }),
      },
    });
  }

  findById(id: string): Promise<ShipmentRow | null> {
    return this.prisma.shipment.findUnique({ where: { id } });
  }

  findByOrder(orderId: string): Promise<ShipmentRow[]> {
    return this.prisma.shipment.findMany({ where: { orderId } });
  }

  /** Faol kuryerlar — tayinlash tanlovi uchun (shipment.courierId → Courier.id). */
  listActiveCouriers(): Promise<CourierOption[]> {
    return this.prisma.courier.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, phone: true },
      orderBy: { fullName: 'asc' },
    });
  }

  updateStatus(
    id: string,
    status: ShipmentStatus,
    patch: Prisma.ShipmentUpdateInput = {},
  ): Promise<ShipmentRow> {
    return this.prisma.shipment.update({ where: { id }, data: { ...patch, status } });
  }
}
