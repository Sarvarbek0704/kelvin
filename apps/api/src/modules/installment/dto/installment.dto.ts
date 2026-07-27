import { IsInt, IsISO8601, IsNumberString, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  orderId!: string;

  @ApiPropertyOptional({ description: 'OWN (do‘kon) | PROVIDER', default: 'OWN' })
  @IsOptional()
  @IsString()
  kind?: string;

  @ApiPropertyOptional({ description: 'Boshlang‘ich badal, TIYIN (string)' })
  @IsOptional()
  @IsNumberString()
  downPaymentAmount?: string;

  @ApiPropertyOptional({ description: 'Foiz, basis point (1200 = 12%)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  interestRateBp?: number;

  @ApiProperty({ minimum: 1, maximum: 36 })
  @IsInt()
  @Min(1)
  @Max(36)
  termMonths!: number;

  @ApiProperty({ example: '2026-08-01' })
  @IsISO8601()
  firstDueDate!: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: 'To‘lov summasi, TIYIN (string)' })
  @IsNumberString()
  amount!: string;
}
