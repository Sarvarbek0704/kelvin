import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ORDER_STATUSES, type OrderStatus } from '../../../core/order/order-status';

export class CheckoutDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  cartId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Berilmasa standart ombor' })
  @IsOptional()
  @IsUUID('7')
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Yetkazish zonasi (narx snapshot)' })
  @IsOptional()
  @IsUUID('7')
  deliveryZoneId?: string;
}

export class TransitionDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  to!: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
