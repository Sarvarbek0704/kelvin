import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';

export type AddressRow = Prisma.AddressGetPayload<Record<string, never>>;

export interface CustomerProfile {
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly phone: string | null;
  readonly email: string | null;
}

export interface AddressData {
  readonly region: string;
  readonly city: string;
  readonly street: string;
  readonly district?: string;
  readonly building?: string;
  readonly apartment?: string;
  readonly floor?: number;
  readonly hasElevator?: boolean;
  readonly note?: string;
}

/** Manzil — Prisma qatlami (docs/07). Mijozga tegishli (Cascade). */
@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForCustomer(customerId: string): Promise<AddressRow[]> {
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  findById(id: string): Promise<AddressRow | null> {
    return this.prisma.address.findUnique({ where: { id } });
  }

  create(customerId: string, data: AddressData, isDefault: boolean): Promise<AddressRow> {
    return this.prisma.address.create({
      data: {
        customerId,
        region: data.region,
        city: data.city,
        street: data.street,
        isDefault,
        ...(data.district !== undefined && { district: data.district }),
        ...(data.building !== undefined && { building: data.building }),
        ...(data.apartment !== undefined && { apartment: data.apartment }),
        ...(data.floor !== undefined && { floor: data.floor }),
        ...(data.hasElevator !== undefined && { hasElevator: data.hasElevator }),
        ...(data.note !== undefined && { note: data.note }),
      },
    });
  }

  update(id: string, data: Partial<AddressData>): Promise<AddressRow> {
    return this.prisma.address.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.address.delete({ where: { id } });
  }

  hasAny(customerId: string): Promise<AddressRow | null> {
    return this.prisma.address.findFirst({ where: { customerId } });
  }

  /** Mijoz profili — kabinet sahifasi uchun. */
  findProfile(customerId: string): Promise<CustomerProfile | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { firstName: true, lastName: true, phone: true, email: true },
    });
  }

  updateProfile(
    customerId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<CustomerProfile> {
    return this.prisma.customer.update({
      where: { id: customerId },
      data,
      select: { firstName: true, lastName: true, phone: true, email: true },
    });
  }

  /** Mijoz aloqa ma'lumoti (bildirishnoma uchun). */
  findCustomerContact(
    customerId: string,
  ): Promise<{ phone: string | null; email: string | null; firstName: string | null } | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { phone: true, email: true, firstName: true },
    });
  }

  /** Bitta manzilni default qiladi, qolganlarini bekor — bitta tranzaksiya. */
  async setDefault(customerId: string, addressId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.address.updateMany({ where: { customerId }, data: { isDefault: false } }),
      this.prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);
  }
}
