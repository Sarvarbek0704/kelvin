import { IsEmail, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Ro'yxatdan o'tishni tasdiqlash (2-qadam) — email'ga kelgan 6 xonali kod. */
export class VerifyOtpDto {
  @ApiProperty({ example: 'mijoz@misol.uz' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '123456', description: '6 xonali kod' })
  @Matches(/^\d{6}$/, { message: 'Kod 6 ta raqamdan iborat bo‘lishi kerak' })
  code!: string;
}
