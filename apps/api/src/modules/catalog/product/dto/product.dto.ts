import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateProductDto {
  @ApiProperty({ example: 'aurora-qandil' })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(160)
  slug!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[0-9a-fA-F-]{36}$/, { message: 'categoryId UUID bo‘lishi kerak' })
  categoryId!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsLocalizedText()
  name!: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  countryOfOrigin?: string;

  @ApiPropertyOptional({ default: false, description: 'Mo‘rt (shisha qandil)' })
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresInstallation?: boolean;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  metaTitle?: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  metaDescription?: LocalizedTextDto;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// --- Variant matritsasi generatsiyasi ---------------------------------------

export class AxisDto {
  @ApiProperty({ example: 'color' })
  @IsString()
  @MaxLength(64)
  attributeCode!: string;

  @ApiProperty({ type: [String], example: ['gold', 'chrome'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  valueCodes!: string[];
}

export class GenerateVariantsDto {
  @ApiProperty({ type: [AxisDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AxisDto)
  axes!: AxisDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Chiqarib tashlanadigan kombinatsiya kalitlari (ta‘minotchida yo‘q)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedKeys?: string[];
}

// --- Variant atributlarini yangilash ----------------------------------------

export class UpdateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @ApiPropertyOptional({ description: 'lm' })
  @IsOptional()
  @IsInt()
  @Min(0)
  luminousFlux?: number;

  @ApiPropertyOptional({ description: 'K' })
  @IsOptional()
  @IsInt()
  colorTemperature?: number;

  @ApiPropertyOptional({ description: 'Ra (1..100)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  cri?: number;

  @ApiPropertyOptional({ example: 'IP65', description: 'ipSatisfies avtomatik hisoblanadi' })
  @IsOptional()
  @IsString()
  @Matches(/^IP[0-6][0-8]$/, { message: 'IP kodi IPxy formatida (masalan IP65)' })
  ipRating?: string;

  @ApiPropertyOptional({ example: 'E27' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  socketType?: string;

  @ApiPropertyOptional({ description: 'V' })
  @IsOptional()
  @IsInt()
  voltage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dimmable?: boolean;

  @ApiPropertyOptional({ description: '°' })
  @IsOptional()
  @IsInt()
  beamAngle?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  bulbsIncluded?: boolean;

  @ApiPropertyOptional({ example: 'LED' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  lightSource?: string;

  @ApiPropertyOptional({ description: 'Qolgan atributlar (JSONB)' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'g' })
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @ApiPropertyOptional({ description: 'Tannarx — tiyinda (string)' })
  @IsOptional()
  @Matches(/^\d+$/, { message: 'costPriceAmount tiyinda butun son (string)' })
  costPriceAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
