import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('7')
  productId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  body!: string;
}

export class CreateAnswerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;
}
