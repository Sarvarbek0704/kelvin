import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  orderId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  addressId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Yetkazish sloti (bron qilinadi)' })
  @IsOptional()
  @IsUUID('7')
  slotId?: string;
}

export class AssignCourierDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  courierId!: string;
}
