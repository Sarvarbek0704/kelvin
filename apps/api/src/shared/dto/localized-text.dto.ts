import { IsOptional, IsString, MaxLength, Validate } from 'class-validator';
import {
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { hasAnyLocale, type LocalizedText } from '@kelvin/contracts';

/** Kamida bitta til to'ldirilgan bo'lishi kerak. */
@ValidatorConstraint({ name: 'atLeastOneLocale', async: false })
export class AtLeastOneLocaleConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'object' && value !== null && hasAnyLocale(value);
  }
  defaultMessage(_args: ValidationArguments): string {
    return "Kamida bitta tilda qiymat bo'lishi kerak (uz-Latn, uz-Cyrl yoki ru)";
  }
}

/**
 * Ko'p tilli matn DTO — { "uz-Latn", "uz-Cyrl", "ru" }.
 * class-validator maydon nomlaridagi tire tufayli bracket nomlanadi.
 */
export class LocalizedTextDto implements LocalizedText {
  @ApiPropertyOptional({ example: 'Qandil' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  'uz-Latn'?: string;

  @ApiPropertyOptional({ example: 'Қандил' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  'uz-Cyrl'?: string;

  @ApiPropertyOptional({ example: 'Люстра' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ru?: string;
}

/** Majburiy ko'p tilli maydon uchun dekorator kombinatsiyasi. */
export function IsLocalizedText(): PropertyDecorator {
  return Validate(AtLeastOneLocaleConstraint);
}
