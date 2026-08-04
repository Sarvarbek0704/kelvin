import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Parol tiklash (2-qadam) — email'dagi kod + yangi parol. */
export class ResetPasswordDto {
  @ApiProperty({ example: 'mijoz@misol.uz' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '123456', description: '6 xonali kod' })
  @Matches(/^\d{6}$/, { message: 'Kod 6 ta raqamdan iborat bo‘lishi kerak' })
  code!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
