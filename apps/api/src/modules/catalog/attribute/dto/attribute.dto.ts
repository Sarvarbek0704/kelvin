import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { IsLocalizedText, LocalizedTextDto } from '../../../../shared/dto/localized-text.dto';

const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Prisma AttributeType enum'ining mahalliy aksi (arxitektura: Prisma faqat repo'da). */
export const ATTRIBUTE_TYPES = ['ENUM', 'NUMBER', 'BOOLEAN', 'TEXT', 'ORDINAL'] as const;
export type AttributeTypeValue = (typeof ATTRIBUTE_TYPES)[number];

export class CreateAttributeDto {
  @ApiProperty({ example: 'color_temperature', description: 'snake_case, unikal' })
  @IsString()
  @Matches(CODE_PATTERN, { message: 'code snake_case bo‘lishi kerak' })
  @MaxLength(64)
  code!: string;

  @ApiProperty({ enum: ATTRIBUTE_TYPES })
  @IsIn(ATTRIBUTE_TYPES)
  type!: AttributeTypeValue;

  @ApiProperty({ type: LocalizedTextDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsLocalizedText()
  name!: LocalizedTextDto;

  @ApiPropertyOptional({ example: 'K', description: 'Birlik: lm, K, W, Ra, °' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Variant o‘qi hosil qiladimi' })
  @IsOptional()
  @IsBoolean()
  isVariantAxis?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isComparable?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}

export class CreateAttributeValueDto {
  @ApiProperty({ example: '3000' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsLocalizedText()
  label!: LocalizedTextDto;

  @ApiPropertyOptional({ description: 'ORDINAL atributlar uchun (IP UCHUN EMAS)' })
  @IsOptional()
  @IsInt()
  rank?: number;

  @ApiPropertyOptional({ example: '#FFB46B' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'hexColor #RRGGBB formatida' })
  hexColor?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateAttributeValueDto extends PartialType(CreateAttributeValueDto) {}
