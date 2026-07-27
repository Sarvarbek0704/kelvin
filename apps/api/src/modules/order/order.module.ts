import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { CartModule } from '../cart/cart.module';
import { PricingModule } from '../pricing/pricing.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { CustomerModule } from '../customer/customer.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ORDER_PORT } from './order.port';

/**
 * order — checkout saga, holat mashinasi (docs/02 §5, docs/07 §2-3).
 *
 * ⚠️ Faza 3 doirasi: checkout → DRAFT (rezerv + kompensatsiya + idempotentlik) va
 *    holat o'tishlari. To'lov sagasi (paid → confirmed) — Faza 4.
 *
 * Cross-module: CART_PORT (savat), PRICING_PORT (narx), INVENTORY_PORT (rezerv),
 * CATALOG_PORT (snapshot) — hammasi *.port.ts orqali (arch:check).
 */
@Module({
  imports: [CatalogModule, CartModule, PricingModule, InventoryModule, DeliveryModule, CustomerModule, NotificationModule],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService, { provide: ORDER_PORT, useExisting: OrderService }],
  exports: [OrderService, ORDER_PORT],
})
export class OrderModule {}
