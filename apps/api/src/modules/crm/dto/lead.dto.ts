import { IsIn, IsNumberString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const;
const LEAD_SOURCES = ['WEBSITE_FORM', 'PHONE', 'TELEGRAM', 'WALK_IN', 'INSTAGRAM'] as const;

export class CreateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: '+998901234567' })
  @Matches(/^\+998\d{9}$/, { message: 'Telefon +998XXXXXXXXX ko‘rinishida' })
  phone!: string;

  @ApiPropertyOptional({ enum: LEAD_SOURCES })
  @IsOptional()
  @IsIn(LEAD_SOURCES)
  source?: (typeof LEAD_SOURCES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ enum: LEAD_STATUSES })
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: (typeof LEAD_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Taxminiy summa, TIYIN (string)' })
  @IsOptional()
  @IsNumberString()
  estimatedAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}
