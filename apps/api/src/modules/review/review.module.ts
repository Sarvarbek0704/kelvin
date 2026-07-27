import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';
import { ReviewController } from './review.controller';
import { QaController } from './qa.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';

/**
 * review — mahsulot sharhlari (docs/10). Mijoz yozadi → moderatsiya → ommaviy.
 * ORDER_PORT — "tasdiqlangan xarid" belgisi uchun (sikl yo'q: order review'ni bilmaydi).
 */
@Module({
  imports: [OrderModule],
  controllers: [ReviewController, QaController],
  providers: [ReviewRepository, ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
