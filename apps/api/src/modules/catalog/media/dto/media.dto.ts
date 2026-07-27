import {
  ArrayNotEmpty,
  IsArray,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { LocalizedTextDto } from '../../../../shared/dto/localized-text.dto';

export const MEDIA_KINDS = ['IMAGE', 'VIDEO', 'VIEW_360', 'DOCUMENT'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export class CreateUploadDto {
  @ApiProperty({ enum: MEDIA_KINDS, default: 'IMAGE' })
  @IsIn(MEDIA_KINDS)
  kind!: MediaKind;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  contentType!: string;

  @ApiProperty({ example: 'aurora-gold.jpg' })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiPropertyOptional({ description: 'Mahsulotga biriktirish' })
  @IsOptional()
  @Matches(/^[0-9a-fA-F-]{36}$/)
  productId?: string;

  @ApiPropertyOptional({ description: 'Variantga biriktirish' })
  @IsOptional()
  @Matches(/^[0-9a-fA-F-]{36}$/)
  variantId?: string;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  alt?: LocalizedTextDto;

  isImage(): boolean {
    return this.kind === 'IMAGE' && IMAGE_TYPES.includes(this.contentType);
  }
}

export class ReorderMediaDto {
  @ApiProperty({ type: [String], description: 'Media ID lar yangi tartibda' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  order!: string[];
}

export class UpdateMediaDto {
  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  alt?: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
