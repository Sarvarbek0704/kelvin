import { Module } from '@nestjs/common';

import { CustomerModule } from '../customer/customer.module';
import { OrderModule } from '../order/order.module';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { LeadRepository } from './lead.repository';
import { SegmentController } from './segment.controller';
import { SegmentService } from './segment.service';
import { SegmentRepository } from './segment.repository';

/**
 * crm — lid (callback→voronka) + mijoz segmentatsiya/RFM (docs/10). RFM ORDER_PORT
 * agregatidan (sikl yo'q).
 */
@Module({
  imports: [OrderModule, CustomerModule],
  controllers: [LeadController, SegmentController],
  providers: [LeadRepository, LeadService, SegmentRepository, SegmentService],
  exports: [LeadService, SegmentService],
})
export class CrmModule {}
