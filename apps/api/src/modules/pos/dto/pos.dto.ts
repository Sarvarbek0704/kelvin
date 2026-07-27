import { ArrayMinSize, IsArray, IsIn, IsInt, IsNumberString, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({ description: 'Boshlang‘ich kassa, TIYIN (string)' })
  @IsNumberString()
  openingCashAmount!: string;
}

export class CloseShiftDto {
  @ApiProperty({ description: 'Yopilishdagi kassa, TIYIN (string)' })
  @IsNumberString()
  closingCashAmount!: string;
}

export class SaleItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  variantId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateSaleDto {
  @ApiProperty({ enum: ['CASH', 'CARD'] })
  @IsIn(['CASH', 'CARD'])
  paymentMethod!: 'CASH' | 'CARD';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('7')
  warehouseId?: string;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}
