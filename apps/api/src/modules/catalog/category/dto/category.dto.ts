import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { IsLocalizedText, LocalizedTextDto } from '../../../../shared/dto/localized-text.dto';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryDto {
  @ApiProperty({ example: 'lyustry-hrustalnye', description: 'kebab-case, unikal' })
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug kebab-case bo‘lishi kerak (a-z, 0-9, -)' })
  @MaxLength(120)
  slug!: string;

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

  @ApiPropertyOptional({ description: 'Ota kategoriya (ildiz uchun bo‘sh)' })
  @IsOptional()
  @IsUUID(7)
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  imageUrl?: string;

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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
