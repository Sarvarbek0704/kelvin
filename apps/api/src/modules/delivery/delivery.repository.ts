import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type JsonInput } from '../../shared/json';

export type ZoneRow = Prisma.DeliveryZoneGetPayload<Record<string, never>>;
export type SlotRow = Prisma.DeliverySlotGetPayload<Record<string, never>>;

/**
 * delivery — Prisma qatlami (docs/09, docs/07 §8). ⚠️ Slot bron ATOMIK shartli
 * UPDATE (`booked < capacity` shart UPDATE ichida) — inventory oversell naqshi.
 */
@Injectable()
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  createZone(data: {
    name: JsonInput;
    districts: string[];
    priceAmount: bigint;
    freeThresholdAmount?: bigint;
    etaDaysMin?: number;
    etaDaysMax?: number;
  }): Promise<ZoneRow> {
    return this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        districts: data.districts,
        priceAmount: data.priceAmount,
        ...(data.freeThresholdAmount !== undefined && { freeThresholdAmount: data.freeThresholdAmount }),
        ...(data.etaDaysMin !== undefined && { etaDaysMin: data.etaDaysMin }),
        ...(data.etaDaysMax !== undefined && { etaDaysMax: data.etaDaysMax }),
      },
    });
  }

  listZones(): Promise<ZoneRow[]> {
    return this.prisma.deliveryZone.findMany({ where: { isActive: true } });
  }

  findZone(id: string): Promise<ZoneRow | null> {
    return this.prisma.deliveryZone.findUnique({ where: { id } });
  }

  createSlot(data: {
    zoneId: string;
    date: Date;
    startTime: string;
    endTime: string;
    capacity: number;
  }): Promise<SlotRow> {
    return this.prisma.deliverySlot.create({ data });
  }

  findSlot(id: string): Promise<SlotRow | null> {
    return this.prisma.deliverySlot.findUnique({ where: { id } });
  }

  /** Zonaning berilgan sanadagi joyi bor (booked<capacity) faol slotlari. */
  listAvailableSlots(zoneId: string, date: Date): Promise<SlotRow[]> {
    return this.prisma.$queryRaw<SlotRow[]>`
      SELECT * FROM "delivery_slots"
       WHERE "zone_id" = ${zoneId}::uuid
         AND "date" = ${date}
         AND "is_active" = true
         AND "booked" < "capacity"
       ORDER BY "start_time" ASC`;
  }

  /**
   * ⚠️ ATOMIK bron: `booked += 1`, faqat `booked < capacity` va faol bo'lsa.
   * @returns ta'sirlangan qatorlar — 1 = bron qilindi, 0 = band/yo'q.
   */
  bookSlotAtomic(slotId: string): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE "delivery_slots"
         SET "booked" = "booked" + 1, "updated_at" = now()
       WHERE "id" = ${slotId}::uuid
         AND "is_active" = true
         AND "booked" < "capacity"`;
  }

  /** Bronni bo'shatish: `booked -= 1` (0 dan pastga tushmaydi — CHECK). */
  releaseSlotAtomic(slotId: string): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE "delivery_slots"
         SET "booked" = "booked" - 1, "updated_at" = now()
       WHERE "id" = ${slotId}::uuid
         AND "booked" > 0`;
  }
}
