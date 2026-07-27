import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ description: 'Ko‘p tilli nom', example: { ru: 'Ташкент центр' } })
  @IsObject()
  name!: Record<string, string>;

  @ApiProperty({ type: [String], example: ['Yunusobod', 'Mirzo Ulug‘bek'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  districts!: string[];

  @ApiProperty({ description: 'Narx, TIYIN (string)', example: '3000000' })
  @IsNumberString()
  priceAmount!: string;

  @ApiPropertyOptional({ description: 'Bepul yetkazish chegarasi, TIYIN' })
  @IsOptional()
  @IsNumberString()
  freeThresholdAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  etaDaysMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  etaDaysMax?: number;
}

export class CreateSlotDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  zoneId!: string;

  @ApiProperty({ example: '2026-08-01', description: 'Sana (ISO)' })
  @IsISO8601()
  date!: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @ApiProperty({ example: '12:00' })
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;

  @ApiProperty({ minimum: 1, example: 10 })
  @IsInt()
  @Min(1)
  capacity!: number;
}
