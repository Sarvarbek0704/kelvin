import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'ACME' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Yetkazish muddati (kun)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;
}

export class PurchaseOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  variantId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantityOrdered!: number;

  @ApiProperty({ description: 'Birlik tannarxi, TIYIN (string)', example: '150000000' })
  @IsNumberString()
  unitCostAmount!: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  supplierId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  warehouseId!: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}
