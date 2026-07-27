import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';
import { CustomerModule } from '../customer/customer.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';
import { ShipmentRepository } from './shipment.repository';

/**
 * shipment — jo'natma (docs/07 §3.3, docs/09, Faza 7).
 *
 * ⚠️ ALOHIDA modul (Order↔Delivery siklidan qochish): shipment → ORDER_PORT +
 *    CUSTOMER_PORT + DELIVERY_PORT. Hech kim shipment'ga bog'lanmaydi.
 */
@Module({
  imports: [OrderModule, CustomerModule, DeliveryModule],
  controllers: [ShipmentController],
  providers: [ShipmentRepository, ShipmentService],
  exports: [ShipmentService],
})
export class ShipmentModule {}
