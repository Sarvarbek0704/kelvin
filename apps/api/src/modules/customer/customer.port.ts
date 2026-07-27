/**
 * customer modulining PUBLIC porti (docs/02 §6.1) — shipment uchun.
 * boshqa modullar manzil egaligini FAQAT shu port orqali tekshiradi.
 */

export interface AddressRef {
  readonly id: string;
  readonly customerId: string;
  readonly region: string;
  readonly city: string;
  readonly street: string;
}

export interface ContactInfo {
  readonly phone: string;
  readonly firstName: string | null;
}

export const CUSTOMER_PORT = Symbol('CustomerPort');

export interface CustomerPort {
  getAddress(addressId: string): Promise<AddressRef | null>;
  /** Mijoz aloqa ma'lumoti (bildirishnoma uchun). Yo'q → null. */
  getContactInfo(customerId: string): Promise<ContactInfo | null>;
}
