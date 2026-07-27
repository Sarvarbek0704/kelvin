import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

/** analytics — hisobotlar (docs/10 §9.6-9.7). ORDER_PORT agregatlaridan (sikl yo'q). */
@Module({
  imports: [OrderModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
