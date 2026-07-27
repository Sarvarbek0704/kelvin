import { Module } from '@nestjs/common';

import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { AddressRepository } from './address.repository';
import { CUSTOMER_PORT } from './customer.port';

/**
 * customer — mijoz manzillari (va kelajakda profil). docs/07.
 * Manzil shipment (Faza 7) va storefront checkout uchun kerak.
 */
@Module({
  controllers: [AddressController],
  providers: [AddressRepository, AddressService, { provide: CUSTOMER_PORT, useExisting: AddressService }],
  exports: [AddressService, CUSTOMER_PORT],
})
export class CustomerModule {}
