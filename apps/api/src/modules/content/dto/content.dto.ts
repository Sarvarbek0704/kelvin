import { IsBoolean, IsObject, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { IsLocalizedText, LocalizedTextDto } from '../../../shared/dto/localized-text.dto';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateBlogPostDto {
  @ApiProperty({ example: 'yangi-qandillar-2026' })
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug faqat kichik harf, raqam va tire' })
  @MaxLength(160)
  slug!: string;

  @ApiProperty()
  @IsObject()
  @IsLocalizedText()
  title!: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @IsLocalizedText()
  excerpt?: LocalizedTextDto;

  @ApiProperty()
  @IsObject()
  @IsLocalizedText()
  body!: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverUrl?: string;
}

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}

export class UpsertPageDto {
  @ApiProperty({ example: 'o-kompanii' })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(160)
  slug!: string;

  @ApiProperty()
  @IsObject()
  @IsLocalizedText()
  title!: LocalizedTextDto;

  @ApiProperty()
  @IsObject()
  @IsLocalizedText()
  body!: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
