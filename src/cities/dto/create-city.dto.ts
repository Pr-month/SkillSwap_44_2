import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCityDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({
    description: 'Название города (минимум 2 символа)',
    required: true,
    example: 'Москва',
  })
  name: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Широта в десятичных градусах',
    required: false,
    example: 55.7558,
  })
  lat?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Долгота в десятичных градусах',
    required: false,
    example: 37.6176,
  })
  lon?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Район/округ города',
    required: false,
    example: 'ЦАО',
  })
  district?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Численность населения',
    required: false,
    example: 13000000,
  })
  population?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Субъект РФ (область, край, республика и т.п.)',
    required: false,
    example: 'г. Москва',
  })
  subject?: string;
}
