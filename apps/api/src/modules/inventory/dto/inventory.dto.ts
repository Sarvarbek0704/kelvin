import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Kirim (qoldiq qabul qilish) — omborga tovar keldi. */
export class ReceiveStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  variantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  warehouseId!: string;

  @ApiProperty({ minimum: 1, example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Inventarizatsiya — fizik sanoq bilan qoldiqni tuzatish. */
export class AdjustStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  variantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  warehouseId!: string;

  @ApiProperty({ minimum: 0, description: 'Fizik sanoq (haqiqiy qoldiq)' })
  @IsInt()
  @Min(0)
  physicalCount!: number;

  @ApiProperty({ description: 'Sabab — MAJBURIY (audit)' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}
