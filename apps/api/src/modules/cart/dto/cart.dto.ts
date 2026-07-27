import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  variantId!: string;

  @ApiProperty({ minimum: 1, maximum: 999, example: 1 })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class SetQuantityDto {
  @ApiProperty({ minimum: 0, maximum: 999, description: '0 → qatorni o‘chiradi' })
  @IsInt()
  @Min(0)
  @Max(999)
  quantity!: number;
}
