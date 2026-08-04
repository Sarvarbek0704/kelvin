import { Injectable } from '@nestjs/common';

import { NotFoundError } from '../../core/errors/domain.error';
import { type AddressRef, type ContactInfo, type CustomerPort } from './customer.port';
import {
  AddressRepository,
  type AddressData,
  type AddressRow,
  type CustomerProfile,
} from './address.repository';

/**
 * customer — mijoz manzillari (docs/07). Har amal EGALIK bilan: begona manzil →
 * 404 (ma'lumot sizdirmaslik). Birinchi manzil avtomatik default.
 */
@Injectable()
export class AddressService implements CustomerPort {
  constructor(private readonly repo: AddressRepository) {}

  /** CustomerPort — shipment manzil egaligini tekshiradi. */
  async getAddress(addressId: string): Promise<AddressRef | null> {
    const a = await this.repo.findById(addressId);
    if (a === null) {
      return null;
    }
    return { id: a.id, customerId: a.customerId, region: a.region, city: a.city, street: a.street };
  }

  /** CustomerPort — bildirishnoma uchun aloqa ma'lumoti. */
  getContactInfo(customerId: string): Promise<ContactInfo | null> {
    return this.repo.findCustomerContact(customerId);
  }

  /** Kabinet profili. Mijoz topilmasa 404 (nazariy holat — token buzilgan). */
  async getProfile(customerId: string): Promise<CustomerProfile> {
    const profile = await this.repo.findProfile(customerId);
    if (profile === null) {
      throw new NotFoundError('Mijoz', customerId);
    }
    return profile;
  }

  updateProfile(
    customerId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<CustomerProfile> {
    return this.repo.updateProfile(customerId, data);
  }

  list(customerId: string): Promise<AddressRow[]> {
    return this.repo.listForCustomer(customerId);
  }

  async create(customerId: string, data: AddressData): Promise<AddressRow> {
    const existing = await this.repo.hasAny(customerId);
    return await this.repo.create(customerId, data, existing === null); // birinchisi → default
  }

  async update(customerId: string, id: string, data: Partial<AddressData>): Promise<AddressRow> {
    await this.assertOwned(customerId, id);
    return await this.repo.update(id, data);
  }

  async remove(customerId: string, id: string): Promise<void> {
    await this.assertOwned(customerId, id);
    await this.repo.delete(id);
  }

  async setDefault(customerId: string, id: string): Promise<void> {
    await this.assertOwned(customerId, id);
    await this.repo.setDefault(customerId, id);
  }

  /** ⚠️ Egalik: begona manzil → 404 (403 emas — mavjudligini sizdirmaymiz). */
  private async assertOwned(customerId: string, id: string): Promise<AddressRow> {
    const addr = await this.repo.findById(id);
    if (addr?.customerId !== customerId) {
      throw new NotFoundError('Manzil', id);
    }
    return addr;
  }
}
