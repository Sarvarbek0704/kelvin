import { IsIn, IsNumberString, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const PAYMENT_PROVIDERS = [
  'CLICK',
  'PAYME',
  'UZUM',
  'CASH',
  'BANK_TRANSFER',
] as const;

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  orderId!: string;

  @ApiProperty({ enum: PAYMENT_PROVIDERS })
  @IsIn(PAYMENT_PROVIDERS)
  provider!: (typeof PAYMENT_PROVIDERS)[number];

  @ApiProperty({ description: 'Takror to‘lovni oldini oluvchi kalit' })
  @IsString()
  @MaxLength(128)
  idempotencyKey!: string;
}

export class SettleDto {
  @ApiProperty({ description: 'Provayder komissiyasi, TIYIN (string)', example: '5000000' })
  @IsNumberString()
  feeAmount!: string;
}

export class RefundDto {
  @ApiProperty({ description: 'Refund summasi, TIYIN (string)', example: '200000000' })
  @IsNumberString()
  amount!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ description: 'Takror refundni oldini oluvchi kalit' })
  @IsString()
  @MaxLength(128)
  idempotencyKey!: string;
}
