import { Module } from '@nestjs/common';

import { PricingModule } from '../pricing/pricing.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { CART_PORT } from './cart.port';

/**
 * cart — savat, mehmon savati, birlashtirish (docs/02 §5, docs/07 §1).
 *
 * ⚠️ Narx PricingModule (PRICING_PORT) orqali qayta hisoblanadi — savatda
 *    muzlatilmaydi. Order/checkout kelganda savat rezerv qilinadi (InventoryPort).
 */
@Module({
  imports: [PricingModule, CatalogModule],
  controllers: [CartController],
  providers: [CartRepository, CartService, { provide: CART_PORT, useExisting: CartService }],
  exports: [CART_PORT],
})
export class CartModule {}
