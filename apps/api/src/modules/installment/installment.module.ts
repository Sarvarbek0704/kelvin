import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';
import { InstallmentController } from './installment.controller';
import { InstallmentService } from './installment.service';
import { InstallmentRepository } from './installment.repository';

/**
 * installment — rassrochka QO'LDA rejim (docs/08 §7). ORDER_PORT orqali buyurtma
 * summasi (sikl yo'q). Tashqi provayder/litsenziya YO'Q — do'kon ichki rassrochkasi.
 */
@Module({
  imports: [OrderModule],
  controllers: [InstallmentController],
  providers: [InstallmentRepository, InstallmentService],
  exports: [InstallmentService],
})
export class InstallmentModule {}
