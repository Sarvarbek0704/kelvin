import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Tasdiqlash kodini qayta yuborish. */
export class ResendOtpDto {
  @ApiProperty({ example: 'mijoz@misol.uz' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
